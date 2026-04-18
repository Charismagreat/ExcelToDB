'use server';
import fs from 'fs/promises';
import path from 'path';
import { runAITool } from '@/lib/ai-tools';

const PINNED_CHARTS_PATH = path.join(process.cwd(), 'pinned_charts.json');

export interface ChartConfig {
    id: string;
    userId: string;
    config: any;
    layout?: any;
    createdAt?: string;
    updatedAt?: string;
    refreshedAt?: string;
}

/**
 * 동적 플레이스홀더($TODAY, $TODAY-N 등)를 실제 날짜 값으로 변환합니다.
 */
function resolveDynamicValue(val: any): any {
    if (typeof val !== 'string') return val;
    const today = new Date();
    const kstTodayStr = today.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    
    if (val === '$TODAY') return kstTodayStr;
    
    const match = val.match(/^\$TODAY-(\d+)$/);
    if (match) {
        const days = parseInt(match[1], 10);
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - days);
        return targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    }
    
    return val;
}

/**
 * 인자 객체 전체를 순회하며 동적 플레이스홀더를 치환합니다.
 */
export async function resolveDynamicArgsAction(args: any): Promise<any> {
    if (!args || typeof args !== 'object') return args;
    const resolvedArgs: any = Array.isArray(args) ? [] : {};
    for (const [key, value] of Object.entries(args)) {
        if (value && typeof value === 'object') {
            resolvedArgs[key] = await resolveDynamicArgsAction(value);
        } else {
            resolvedArgs[key] = resolveDynamicValue(value);
        }
    }
    return resolvedArgs;
}

/**
 * 차트 설명 내의 날짜 정보를 동적으로 변환합니다.
 */
export async function resolveDynamicDescriptionAction(desc: string, args: any): Promise<string> {
    if (!desc) return desc;
    let resolvedDesc = desc;
    resolvedDesc = resolvedDesc.replace(/\$TODAY(?:-(\d+))?/g, (match) => resolveDynamicValue(match));
    
    if (args?.startDate && args?.endDate) {
        const sDate = resolveDynamicValue(args.startDate);
        const eDate = resolveDynamicValue(args.endDate);
        resolvedDesc = resolvedDesc.replace(/\d{4}-\d{2}-\d{2}/g, (match, offset) => {
            return offset < resolvedDesc.indexOf('부터') ? sDate : eDate;
        });
    }
    return resolvedDesc;
}

/**
 * 툴 호출 결과를 차트 데이터 형식으로 변환합니다.
 */
export async function mapRefreshedDataAction(rawData: any, mapping: any): Promise<any[]> {
    let newData: any[] = [];
    const records = (rawData && rawData.result && Array.isArray(rawData.result)) ? rawData.result :
                  (rawData && rawData.transactions && Array.isArray(rawData.transactions)) ? rawData.transactions : 
                  (rawData && rawData.summary && Array.isArray(rawData.summary)) ? rawData.summary : null;

    const processRow = (row: any) => {
        if (mapping && typeof mapping === 'object' && !mapping.label && !mapping.value) {
            const mappedRow: any = {};
            for (const [targetKey, sourceKey] of Object.entries(mapping)) {
                mappedRow[targetKey] = row[sourceKey as string] ?? row[targetKey] ?? '';
            }
            return mappedRow;
        }
        return {
            label: mapping?.label && row[mapping.label] !== undefined ? row[mapping.label] : (row.yearMonth || row.month || row.name || row.label || row.date || Object.values(row)[0]),
            value: mapping?.value && row[mapping.value] !== undefined ? row[mapping.value] : (row.totalWithdrawals || row.amount || row.value || row.count || row.total || Object.values(row)[1])
        };
    };

    if (records) {
        newData = records.map(processRow);
    } else if (Array.isArray(rawData)) {
        newData = rawData.map(processRow);
    } else if (rawData && rawData.categorySummary) {
        newData = Object.entries(rawData.categorySummary).map(([label, value]) => ({ label, value }));
    } 
    return newData;
}

/**
 * 모든 핀 고정 차트 목록을 로드합니다.
 */
export async function loadAllPinnedChartsAction(): Promise<ChartConfig[]> {
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

/**
 * 차트 목록을 파일에 저장합니다.
 */
export async function saveAllPinnedChartsAction(charts: ChartConfig[]): Promise<void> {
    await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(charts, null, 2));
}

/**
 * 특정 사용자의 차트를 새로고침합니다.
 */
export async function refreshUserChartsAction(userId: string): Promise<{ charts: ChartConfig[], hasChanges: boolean }> {
    const allCharts = await loadAllPinnedChartsAction();
    const userCharts = allCharts.filter(p => String(p.userId) === String(userId));
    let hasChanges = false;

    const refreshedCharts = await Promise.all(userCharts.map(async (item) => {
        if (item.config.refreshMetadata) {
            const refreshedItem = await refreshSingleChartAction(item);
            if (refreshedItem.refreshedAt) hasChanges = true;
            return refreshedItem;
        }
        return item;
    }));

    if (hasChanges) {
        const updatedAll = allCharts.map(p => refreshedCharts.find(rc => rc.id === p.id) || p);
        await saveAllPinnedChartsAction(updatedAll);
    }

    return { charts: refreshedCharts, hasChanges };
}

/**
 * 개별 차트를 새로고침 로직에 따라 업데이트합니다.
 */
export async function refreshSingleChartAction(item: ChartConfig): Promise<ChartConfig> {
    if (!item.config.refreshMetadata) return item;

    try {
        const { tool, args: originalArgs, mapping } = item.config.refreshMetadata;
        const args = await resolveDynamicArgsAction(originalArgs);
        
        if (item.config.sourceDescription) {
            item.config.sourceDescription = await resolveDynamicDescriptionAction(item.config.sourceDescription, originalArgs);
        }
        
        const rawData = await runAITool(tool, args);
        const newData = await mapRefreshedDataAction(rawData, mapping);
        
        if (newData.length > 0) {
            return {
                ...item,
                config: { ...item.config, data: newData },
                refreshedAt: new Date().toISOString()
            };
        }
    } catch (e) {
        console.error(`[ChartService] Refresh error for ${item.id}:`, e);
    }
    return item;
}
