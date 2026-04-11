'use server';

import { revalidatePath } from 'next/cache';
import { 
    queryTable, 
    insertRows, 
    updateRows, 
    deleteRows,
    createTable
} from '@/egdesk-helpers';
import { 
    generateId, 
    generateNumericId 
} from './shared';
import { getSessionAction } from './auth';
import { analyzeExcelImage, extractDataFromImage } from '@/lib/ai-vision';
import { getVisualizationRecommendation } from '@/lib/dashboard-ai';
import { runAITool } from '@/lib/ai-tools';
import fs from 'fs/promises';
import path from 'path';

/**
 * 핀 고정된 차트 목록을 관리하기 위한 영구 저장소 경로
 */
const PINNED_CHARTS_PATH = path.join(process.cwd(), 'pinned_charts.json');

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
function resolveDynamicArgs(args: any): any {
    if (!args || typeof args !== 'object') return args;
    const resolvedArgs: any = Array.isArray(args) ? [] : {};
    for (const [key, value] of Object.entries(args)) {
        if (value && typeof value === 'object') {
            resolvedArgs[key] = resolveDynamicArgs(value);
        } else {
            resolvedArgs[key] = resolveDynamicValue(value);
        }
    }
    return resolvedArgs;
}

/**
 * 차트 설명 내의 날짜 정보를 동적으로 변환합니다.
 */
function resolveDynamicDescription(desc: string, args: any): string {
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
function mapRefreshedData(rawData: any, mapping: any): any[] {
    let newData: any[] = [];
    const records = (rawData && rawData.result && Array.isArray(rawData.result)) ? rawData.result :
                  (rawData && rawData.transactions && Array.isArray(rawData.transactions)) ? rawData.transactions : 
                  (rawData && rawData.summary && Array.isArray(rawData.summary)) ? rawData.summary : null;

    if (records) {
        newData = records.map((row: any) => {
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
        });
    } else if (Array.isArray(rawData)) {
        newData = rawData.map(row => {
            if (mapping && typeof mapping === 'object' && !mapping.label && !mapping.value) {
                const mappedRow: any = {};
                for (const [targetKey, sourceKey] of Object.entries(mapping)) {
                    mappedRow[targetKey] = row[sourceKey as string] ?? row[targetKey] ?? '';
                }
                return mappedRow;
            }
            return {
                label: mapping?.label && row[mapping.label] !== undefined ? row[mapping.label] : (row.yearMonth || row.month || row.name || row.label || row.date),
                value: mapping?.value && row[mapping.value] !== undefined ? row[mapping.value] : (row.totalWithdrawals || row.amount || row.value || row.count || row.total)
            };
        });
    } else if (rawData && rawData.categorySummary) {
        newData = Object.entries(rawData.categorySummary).map(([label, value]) => ({ label, value }));
    } 
    return newData;
}

export async function getVisualizationRecommendationAction(tableIds: string[], messages: any[]) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    try {
        return await getVisualizationRecommendation(tableIds, messages);
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const combinedMessage = errorMessage + " " + (error.stack || '');
        if (combinedMessage.includes('429') || combinedMessage.toLowerCase().includes('quota')) {
            return {
                content: "죄송합니다. 현재 AI 분석 서비스의 허용 한도(Quota)를 초과하여 이용이 일시적으로 제한되었습니다. 시간이 조금 지난 후 다시 시도해 주시거나 결제 및 프로젝트 상태를 점검해 주세요. 😢",
                chartConfigs: []
            };
        }
        return {
            content: `AI 분석 도중 쿼리나 네트워크 관련 오류가 발생했습니다:\n\n\`\`\`\n${errorMessage}\n\`\`\`\n\n잠시 후 다시 대화를 시도해 주시거나, 질문을 조금 더 단순하게 바꿔서 요청해 보세요.`,
            chartConfigs: []
        };
    }
}

export async function analyzeExcelScreenshotAction(formData: FormData) {
  const image = formData.get('image') as File;
  if (!image) throw new Error('이미지 파일이 없습니다.');
  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const mimeType = image.type;
  return await analyzeExcelImage(base64, mimeType);
}

export async function analyzeImageAndExtractDataAction(formData: FormData, columnsJson: string) {
    try {
        const image = formData.get('image') as File;
        if (!image) throw new Error('이미지 파일이 없습니다.');
        const columns = JSON.parse(columnsJson);
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = image.type;
        const extractedData = await extractDataFromImage(base64, mimeType, columns);
        return { success: true, data: extractedData };
    } catch (error: any) {
        let errorMessage = error.message || '이미지를 분석하는 중 오류가 발생했습니다.';
        if (errorMessage.includes('413')) errorMessage = '이미지 용량이 너무 큽니다. 더 작은 이미지를 사용해 주세요.';
        return { success: false, error: errorMessage };
    }
}

export async function savePinnedChartAction(chartId: string, config: any) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    let pinned: any[] = [];
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        pinned = JSON.parse(fileContent);
    } catch (e) {}
    const existingIndex = pinned.findIndex(p => p.id === chartId);
    if (existingIndex > -1) {
        pinned[existingIndex] = { ...pinned[existingIndex], config, updatedAt: new Date().toISOString() };
    } else {
        pinned.push({
            id: chartId,
            userId: user.id,
            config,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
    revalidatePath('/dashboard');
    return { success: true };
}

export async function getPinnedChartsAction() {
    const user = await getSessionAction();
    if (!user) return [];
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        const pinned = JSON.parse(fileContent);
        const userPinned = pinned.filter((p: any) => String(p.userId) === String(user.id));
        let hasChanges = false;
        const refreshedCharts = await Promise.all(userPinned.map(async (item: any) => {
            if (item.config.refreshMetadata) {
                try {
                    const { tool, args: originalArgs, mapping } = item.config.refreshMetadata;
                    const args = resolveDynamicArgs(originalArgs);
                    if (item.config.sourceDescription) {
                        item.config.sourceDescription = resolveDynamicDescription(item.config.sourceDescription, originalArgs);
                    }
                    const rawData = await runAITool(tool, args);
                    const newData = mapRefreshedData(rawData, mapping);
                    if (newData.length > 0) {
                        item.config.data = newData;
                        item.refreshedAt = new Date().toISOString();
                        hasChanges = true;
                    }
                } catch (e) {
                    console.error(`[Refresh Error] Chart ${item.id}:`, e);
                }
            }
            return item;
        }));
        if (hasChanges) {
            const updatedPinned = pinned.map((p: any) => refreshedCharts.find((rc: any) => rc.id === p.id) || p);
            await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(updatedPinned, null, 2));
        }
        return refreshedCharts;
    } catch (e) {
        return [];
    }
}

export async function deletePinnedChartAction(chartId: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        let pinned = JSON.parse(fileContent);
        pinned = pinned.filter((p: any) => p.id !== chartId);
        await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function refreshIndividualChartAction(chartId: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        let pinned = JSON.parse(fileContent);
        const chartIndex = pinned.findIndex((p: any) => p.id === chartId);
        if (chartIndex === -1) throw new Error('차트를 찾을 수 없습니다.');
        const item = pinned[chartIndex];
        if (!item.config.refreshMetadata) return { success: true, item };
        const { tool, args: originalArgs, mapping } = item.config.refreshMetadata;
        const args = resolveDynamicArgs(originalArgs);
        if (item.config.sourceDescription) {
            item.config.sourceDescription = resolveDynamicDescription(item.config.sourceDescription, originalArgs);
        }
        const rawData = await runAITool(tool, args);
        const newData = mapRefreshedData(rawData, mapping);
        if (newData.length > 0) {
            item.config.data = newData;
            item.refreshedAt = new Date().toISOString();
            pinned[chartIndex] = item;
            await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
        }
        revalidatePath('/dashboard');
        return { success: true, item };
    } catch (e) {
        console.error('Refresh Action Error:', e);
        return { success: false };
    }
}

export async function updateChartLayoutAction(chartId: string, layout: any) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        let pinned = JSON.parse(fileContent);
        const chartIndex = pinned.findIndex((p: any) => p.id === chartId);
        if (chartIndex === -1) throw new Error('차트를 찾을 수 없습니다.');
        pinned[chartIndex].layout = layout;
        pinned[chartIndex].updatedAt = new Date().toISOString();
        await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

let isAIStudioSessionTableInitialized = false;

export async function saveAIStudioSessionAction(data: any) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    const tableName = 'ai_studio_session';
    try {
        const sessionData = { userId: user.id, data: JSON.stringify(data), updatedAt: new Date().toISOString() };
        if (!isAIStudioSessionTableInitialized) {
            try {
                await queryTable(tableName, { limit: 1 });
                isAIStudioSessionTableInitialized = true;
            } catch (e) {
                await createTable('AI Studio Session', [
                    { name: 'userId', type: 'TEXT', notNull: true },
                    { name: 'data', type: 'TEXT', notNull: true },
                    { name: 'updatedAt', type: 'TEXT', notNull: true }
                ], { tableName, uniqueKeyColumns: ['userId'] });
                isAIStudioSessionTableInitialized = true;
            }
        }
        const existing = await queryTable(tableName, { filters: { userId: user.id } });
        if (existing && existing.length > 0) {
            await updateRows(tableName, { data: sessionData.data, updatedAt: sessionData.updatedAt }, { filters: { userId: user.id } });
        } else {
            await insertRows(tableName, [sessionData]);
        }
        return { success: true };
    } catch (e) {
        isAIStudioSessionTableInitialized = false;
        return { success: false };
    }
}

export async function getAIStudioSessionAction() {
    const user = await getSessionAction();
    if (!user) return null;
    const tableName = 'ai_studio_session';
    try {
        const results = await queryTable(tableName, { filters: { userId: user.id } });
        if (results && results.length > 0) return JSON.parse(results[0].data);
    } catch (e) {}
    return null;
}

export async function clearAIStudioSessionAction() {
    const user = await getSessionAction();
    if (!user) return { success: false };
    const tableName = 'ai_studio_session';
    try {
        await deleteRows(tableName, { filters: { userId: user.id } });
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
