'use server';

import { queryTable, createTable } from '@/egdesk-helpers';
import { EGDESK_CONFIG } from '@/egdesk.config';
import { SYSTEM_TABLES } from './shared';

/**
 * 특정 시스템 테이블의 물리적 손상(고스트 상태)을 감지하고 강제 재생성합니다.
 */
export async function repairGhostTable(tableName: string) {
    const tableDef = SYSTEM_TABLES.find(t => t.tableName === tableName);
    if (!tableDef) return;

    try {
        await queryTable(tableName, { limit: 1 });
    } catch (err: any) {
        const msg = String(err.message || err);
        if (msg.includes('no such table')) {
            console.warn(`[Self-Healing] Ghost table detected or table missing: ${tableName}. Force recreating...`);
            try {
                // 고스트 메타데이터 삭제 시도 (에러 무시)
                await fetch(`${EGDESK_CONFIG.apiUrl}/user-data/tools/call`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Api-Key': EGDESK_CONFIG.apiKey || '' },
                    body: JSON.stringify({ tool: 'user_data_delete_table', arguments: { tableName } })
                }).catch(() => {});
                
                await createTable(tableDef.displayName, tableDef.schema, { tableName });
                console.log(`[Self-Healing] Successfully recreated table: ${tableName}`);
            } catch (createErr) {
                console.error(`[Self-Healing] Failed to recreate table ${tableName}:`, createErr);
            }
        }
    }
}

/**
 * 모든 필수 시스템 테이블의 건전성을 검사합니다.
 */
export async function ensureSystemTables() {
    for (const table of SYSTEM_TABLES) {
        await repairGhostTable(table.tableName);
    }
}
