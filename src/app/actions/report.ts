'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { 
    queryTable, 
    insertRows, 
    updateRows, 
    deleteRows, 
    createTable,
    deleteTable,
    renameTable
} from '@/egdesk-helpers';
import { 
    generateId, 
    checkReportAuthorization 
} from './shared';
import { getSessionAction } from './auth';
import { recommendSchemaFromSample } from '@/lib/ai-vision';
import fs from 'fs/promises';

export async function deleteReportAction(reportId: string) {
    await updateRows('report', { 
        isDeleted: 1,
        deletedAt: new Date().toISOString()
    }, { filters: { id: String(reportId) } });
    revalidatePath('/');
    revalidatePath('/archive');
}

export async function restoreReportAction(reportId: string) {
    await updateRows('report', { 
        isDeleted: 0,
        deletedAt: null
    }, { filters: { id: String(reportId) } });
    revalidatePath('/');
    revalidatePath('/archive');
}

export async function permanentDeleteReportAction(reportId: string) {
    // 0. 보고서 정보 로드 (물리 테이블 삭제를 위해)
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];

    // 1. 데이터(행) 먼저 삭제 (Virtual)
    await deleteRows('report_row', { filters: { reportId: String(reportId) } });

    // 2. 물리적 테이블 삭제 (Physical)
    if (report?.tableName) {
        try {
            await deleteTable(report.tableName);
            console.log(`[Cleanup] Deleted physical table: ${report.tableName}`);
        } catch (err: any) {
            console.warn(`[Cleanup Warning] Failed to delete physical table ${report.tableName}:`, err.message);
        }
    }

    // 3. 보고서 본체 삭제
    await deleteRows('report', { filters: { id: String(reportId) } });
    
    revalidatePath('/');
    revalidatePath('/archive');
}

export async function renameReportAction(reportId: string, newName: string) {
    await updateRows('report', { name: newName }, { filters: { id: String(reportId) } });
    revalidatePath(`/report/${reportId}`);
    revalidatePath('/');
}

export async function updateReportWebhookAction(reportId: string, webhookUrl: string | null) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
    if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

    await updateRows('report', { slackWebhookUrl: webhookUrl }, { filters: { id: String(reportId) } });
    
    revalidatePath(`/report/${reportId}`);
    return { success: true };
}

export async function getSchemaRecommendationAction(reportId: string) {
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    if (!report) throw new Error('보고서를 찾을 수 없습니다.');

    const currentColumns = JSON.parse(report.columns);
    const sampleRows = await queryTable('report_row', { 
        filters: { reportId: String(reportId) },
        limit: 20
    });

    const rowsData = sampleRows.map((r: any) => JSON.parse(r.data));
    const recommendation = await recommendSchemaFromSample(currentColumns, rowsData);
    
    return recommendation.columns;
}

export async function updateReportAccessAction(reportId: string, userIds: string[]) {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    // 기존 권한 삭제
    await deleteRows('report_access', { filters: { reportId } });
    
    // 신규 권한 삽입
    if (userIds.length > 0) {
        await insertRows('report_access', userIds.map(userId => ({
            reportId,
            userId
        })));
    }

    revalidatePath(`/report/${reportId}`);
    revalidatePath(`/report/${reportId}/input`);
    revalidatePath('/');
    return { success: true };
}

export async function getAuthorizedUsersForReportAction(reportId: string) {
    const accessList = await queryTable('report_access', { filters: { reportId } });
    const userIds = accessList.map((a: any) => a.userId);
    
    if (userIds.length === 0) return [];
    
    const users = await Promise.all(
        userIds.map(async (id: string) => {
            const results = await queryTable('user', { filters: { id } });
            return results[0];
        })
    );
    
    return users.filter(u => u);
}

export async function createManualReportAction(name: string, sheetName: string, columns: any[]) {
    // 1. 유저 확인
    const users = await queryTable('user', { filters: { username: 'admin_user' } });
    let user = users[0];
    if (!user) {
        const newUserId = generateId();
        await insertRows('user', [{
            id: newUserId,
            username: 'admin_user',
            role: 'ADMIN',
            isActive: 1
        }]);
        user = { id: newUserId };
    }

    // 2. 컬럼 준비 (Data ID 가 없으면 첫 번째로 자동 추가)
    const hasAutoId = columns.some(c => c.isAutoGenerated);
    let finalColumns = [...columns];
    if (!hasAutoId) {
        finalColumns = [
            { id: 'did', name: '데이터 ID', type: 'string', isRequired: true, isAutoGenerated: true },
            ...columns
        ];
    }

    // 3. 보고서 생성
    const reportId = generateId();
    await insertRows('report', [{
        id: reportId,
        name,
        sheetName,
        columns: JSON.stringify(finalColumns),
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        lastSerial: 0 // New manual report starts with 0
    }]);

    revalidatePath('/');
    redirect(`/report/${reportId}?action=new`);
}

export async function updateReportSchemaAction(
    reportId: string, 
    columns: any[], 
    convertExistingData: boolean = false,
    newName?: string
) {
    // 1. 기존 리포트의 컬럼 정보 로드 (변경 확인용)
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    if (!report) throw new Error('보고서를 찾을 수 없습니다.');
    const oldColumns = JSON.parse(report.columns || '[]');

    // 2.5 물리적 테이블 스키마 동기화 (Blue-Green Migration 전략)
    if (report.tableName && Array.isArray(oldColumns)) {
        const logPath = 'schema_sync_trace.log';
        const logInfo = (msg: string) => fs.appendFile(logPath, `[${new Date().toISOString()}] [INFO] ${msg}\n`).catch(() => {});
        const logError = (msg: string) => fs.appendFile(logPath, `[${new Date().toISOString()}] [ERROR] ${msg}\n`).catch(() => {});

        try {
            const oldColNames = new Set(oldColumns.map((c: any) => c.name));
            const newCols = columns.filter((c: any) => !oldColNames.has(c.name));
            const deletedCols = oldColumns.filter((c: any) => !columns.some((nc: any) => nc.name === c.name));

            if (newCols.length > 0 || deletedCols.length > 0) {
                await logInfo(`Schema change detected. Starting Blue-Green Migration for report ${reportId}.`);
                
                // 1) 신규 테이블명 생성 (고유성 보장)
                const suffix = Date.now().toString(36).slice(-5);
                const newTableName = `tb_${reportId}_${suffix}`;
                await logInfo(`Step 1: Generating new table name: ${newTableName}`);

                // 2) 신규 테이블 생성 (target schema 적용)
                await logInfo(`Step 2: Creating new table with updated schema...`);
                // createTable(displayName, schema, options)
                // columns 를 TableDefinition.schema 형식으로 변환 (필요 시)
                const tableSchema = columns.map((c: any) => ({
                    name: c.name,
                    type: ((c.type === 'number' || c.type === 'currency') ? 'INTEGER' : 'TEXT') as 'TEXT' | 'INTEGER'
                }));
                const finalDisplayName = (newName || report.name) + ' (Sync)';
                await createTable(finalDisplayName, tableSchema, { tableName: newTableName });
                await logInfo(`Step 2: Successfully created new table ${newTableName}.`);

                // 3) 기존 데이터 읽기 및 이관
                await logInfo(`Step 3: Migrating existing data from ${report.tableName}...`);
                const existingData = await queryTable(report.tableName, { limit: 100000 }); // 대량 데이터 고려
                
                if (existingData && existingData.length > 0) {
                    // 데이터 매핑 (ID 기반으로 이전 필드 찾기)
                    const migratedData = existingData.map((row: any) => {
                        const newRow: any = {};
                        columns.forEach((newCol: any) => {
                            // 1. ID 매핑 시도 (최우선)
                            // 2. ID가 없는 경우 이름 매핑 시도 (기존 데이터 호환성)
                            const oldCol = oldColumns.find((oc: any) => 
                                (newCol.id && oc.id === newCol.id) || 
                                (!newCol.id && oc.name === newCol.name)
                            );
                            
                            if (oldCol) {
                                newRow[newCol.name] = row[oldCol.name] ?? null;
                            } else {
                                newRow[newCol.name] = null;
                            }
                        });
                        return newRow;
                    });
                    
                    await insertRows(newTableName, migratedData);
                    await logInfo(`Step 3: Successfully migrated ${existingData.length} rows using ID mapping.`);
                } else {
                    await logInfo(`Step 3: No existing data found to migrate.`);
                }

                // 4) 메타데이터 연결 스위칭 (DB 업데이트)
                await logInfo(`Step 4: Swapping table reference in metadata...`);
                const updateValues: any = { 
                    tableName: newTableName,
                    columns: JSON.stringify(columns)
                };
                if (newName) updateValues.name = newName;

                await updateRows('report', updateValues, { filters: { id: String(reportId) } });
                await logInfo(`Step 4: Metadata pointed to ${newTableName}.`);

                // 5) 구 테이블 삭제 (Cleanup)
                await logInfo(`Step 5: Cleaning up old table ${report.tableName}...`);
                try {
                    await deleteTable(report.tableName);
                    await logInfo(`Step 5: Successfully deleted old table.`);
                } catch (delErr: any) {
                    await logError(`Step 5 Warning: Failed to delete old table: ${delErr.message}. Manual cleanup may be required.`);
                }

                await logInfo(`Blue-Green Migration COMPLETED successfully for report ${reportId}.`);
            } else {
                await logInfo(`No schema structure change detected. Metadata configuration update.`);
                // 비구조적 변경(중복체크, 필수여부, 옵션 등) 시에도 메타데이터 업데이트 수행
                const updateValues: any = { columns: JSON.stringify(columns) };
                if (newName) updateValues.name = newName;
                await updateRows('report', updateValues, { filters: { id: String(reportId) } });
            }
        } catch (err: any) {
            await logError(`CRITICAL: Blue-Green Migration FAILED: ${err.message}`);
            // 마이그레이션 실패 시 메타데이터는 구 테이블을 유지함 (트랜잭션 효과)
            throw new Error(`물리 스키마 동기화 중 오류가 발생했습니다: ${err.message}`);
        }
    } else {
        // 물리 테이블 정보가 부족하거나 이름만 바뀌는 경우에도 columns 메타데이터는 항상 최신화
        const updateValues: any = { columns: JSON.stringify(columns) };
        if (newName) updateValues.name = newName;
        await updateRows('report', updateValues, { filters: { id: String(reportId) } });

        if (newName && report.tableName) {
            try {
                // 물리 테이블의 표시 이름을 새 이름으로 변경 (물리 ID는 유지)
                await renameTable(report.tableName, report.tableName, newName);
            } catch (err) {
                console.warn(`[Sync Warning] Failed to update physical table display name for ${report.tableName}:`, err);
            }
        }
    }

    // 3. 기존 데이터 변환 로직 (사용자가 선택한 경우)
    if (convertExistingData && Array.isArray(oldColumns)) {
        console.log(`>>> Starting data migration for report ${reportId}...`);
        
        // 이름 변경 맵핑 (oldName -> newName) 구성
        const renameMap: Record<string, string> = {};
        const renamedCols = columns.filter(newCol => newCol.originalName && newCol.originalName !== newCol.name);
        renamedCols.forEach(col => {
             renameMap[col.originalName] = col.name;
        });

        // 파싱된 타입 매핑 생성을 위해 모든 새로운 컬럼 정의 저장
        const currentSchemaMap: Record<string, any> = {};
        columns.forEach(col => currentSchemaMap[col.name] = col);
        
        const allRows = await queryTable('report_row', { filters: { reportId: String(reportId) } });
        console.log(`>>> Migrating ${allRows.length} rows...`);

        // 삭제된 컬럼 데이터를 정리(가비지 컬렉션)하기 위해 새로운 스키마의 name 리스트 준비
        const validNewKeys = new Set(columns.map(c => c.name));

        for (const row of allRows) {
            const oldRowData = JSON.parse(row.data);
            const newRowData: any = {};
            let hasChanged = false;

            // 1) 기존 데이터 키 순회 및 이름 변경 적용
            for (const oldKey in oldRowData) {
                const val = oldRowData[oldKey];
                
                // 만약 이 기존 키가 새로운 이름으로 변경되었다면 새로운 키 사용, 아니면 그대로
                const targetKey = renameMap[oldKey] || oldKey;
                
                // 만약 새로운 스키마에 targetKey가 존재하지 않는다면 이 컬럼은 "삭제된 컬럼"입니다.
                if (!validNewKeys.has(targetKey)) {
                     hasChanged = true; // 삭제되었으므로 원본과 다름
                     continue; // newRowData에 담지 않고 버림
                }

                newRowData[targetKey] = val;
                if (targetKey !== oldKey) {
                    hasChanged = true;
                }
            }

            // 2) 새로운 스키마를 기준으로 타입 캐스팅 (기존 컬럼들 중 이름 안바뀐 것도 포함)
            for (const col of columns) {
                const val = newRowData[col.name];
                if (val === undefined || val === null || val === '') continue;

                let newVal = val;
                
                try {
                    if (col.type === 'number' || col.type === 'currency') {
                        const sVal = String(val);
                        const cleanVal = sVal.replace(/[^0-9.-]/g, '').trim();
                        if (!isNaN(Number(cleanVal)) && cleanVal !== '') {
                            newVal = Number(cleanVal);
                        }
                    } else if (col.type === 'date') {
                        // 엑셀 날짜 일련번호(Serial Date) 대응 로직
                        if (!isNaN(Number(val)) && String(val).trim() !== '') {
                            const serialNum = Number(val);
                            // 일반적인 엑셀 범위 (예: 30000 ~ 90000, 1980년대부터 2100년대까지 대략 커버)
                            if (serialNum > 10000 && serialNum < 100000) {
                                // 1900 날짜 시스템 기준 변환: 25569 = 1970-01-01 까지의 일수
                                const utcDays  = Math.floor(serialNum - 25569);
                                const utcValue = utcDays * 86400;                                        
                                const dateInfo = new Date(utcValue * 1000);
                                if (!isNaN(dateInfo.getTime())) {
                                    // YYYY-MM-DD 형식으로 클린업
                                    newVal = dateInfo.toISOString().split('T')[0];
                                }
                            } else {
                                // Unix timestamp 인 경우 등을 대비하여 폴백
                                const d = new Date(serialNum);
                                if (!isNaN(d.getTime())) newVal = d.toISOString();
                            }
                        } else {
                            // 일반 날짜 문자열인 경우
                            const d = new Date(val);
                            if (!isNaN(d.getTime())) {
                                newVal = d.toISOString();
                            }
                        }
                    } else if (col.type === 'boolean') {
                        newVal = (val === 'true' || val === '1' || val === 1 || val === true);
                    } else if (col.type === 'string' || col.type === 'textarea') {
                        newVal = String(val);
                    }
                } catch (e) {
                    console.error(`Failed to convert ${col.name} value "${val}" to ${col.type}`);
                }

                // 타입 변환 또는 포맷팅에 의해 값이 변경되었는지 감지
                const oldKeyName = col.originalName || col.name;
                if (oldRowData[oldKeyName] !== newVal) {
                    hasChanged = true;
                }
                newRowData[col.name] = newVal;
            }

            if (hasChanged) {
                const updatedDataStr = JSON.stringify(newRowData);
                // 가상 테이블 업데이트
                await updateRows('report_row', { data: updatedDataStr, updatedAt: new Date().toISOString() }, { filters: { id: String(row.id) } });

                // 물리적 테이블 동기화
                if (report.tableName) {
                    try {
                        const idCol = columns.find((c: any) => c.isAutoGenerated);
                        const filters: any = {};
                        if (idCol && newRowData[idCol.name]) {
                            filters[idCol.name] = String(newRowData[idCol.name]);
                            
                            // 물리적 DB 속성에 맞춰 타입 캐스팅 적용
                            const physicalData: any = {};
                            columns.forEach((col: any) => {
                                if (newRowData[col.name] !== undefined) {
                                    physicalData[col.name] = row[col.name] ?? null; // Use original value mapping
                                    // Actually we need to cast to physical value here for consistency with other actions
                                    // but we need the mapToPhysicalType or similar helper if available.
                                }
                            });
                            // Re-importing castToPhysicalValue for this file
                            const { castToPhysicalValue } = await import('@/lib/db-utils');
                            const castedPhysicalData: any = {};
                            columns.forEach((col: any) => {
                                if (newRowData[col.name] !== undefined) {
                                    castedPhysicalData[col.name] = castToPhysicalValue(newRowData[col.name], col.type);
                                }
                            });

                            await updateRows(report.tableName, castedPhysicalData, { filters });
                        }
                    } catch (err) {
                        console.error(`Physical sync failed during migration for row ${row.id}`, err);
                    }
                }
            }
        }
        console.log(`>>> Data migration completed for report ${reportId}`);
    }

    revalidatePath(`/report/${reportId}`);
    return { success: true };
}
