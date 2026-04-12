'use server';

import { queryTable, createTable } from '@/egdesk-helpers';
import { EGDESK_CONFIG } from '@/egdesk.config';
import { SYSTEM_TABLES } from './shared';

/**
 * 모든 필수 시스템 테이블의 건전성을 검사하고 부재 시 생성합니다.
 * [보안 점검] 수동 데이터 복구 작업 중이므로 자동 초기화 기능을 완전히 비활성화한 상태를 유지합니다.
 */
export async function ensureSystemTables() {
    console.log('[System Initialization] Auto-initialization is temporarily disabled for data recovery.');
    return;
}

/**
 * [관리자용] 모든 시스템 테이블을 초기화하고 샘플 데이터를 주입합니다. (Clean Seed)
 */
export async function rebuildAndSeedSystemAction() {
    const { listTables, deleteTable, createTable, insertRows } = await import('@/egdesk-helpers');
    const { generateId, hashPassword } = await import('./shared');

    try {
        console.log('[Seed] Starting clean seed process...');

        const existingTablesRes: any = await listTables();
        const tables = Array.isArray(existingTablesRes) 
            ? existingTablesRes 
            : (existingTablesRes?.tables || existingTablesRes?.rows || []);

        const existingTableNames = new Set(
            tables.map((t: any) => t.tableName || t.name)
        );

        for (const tableDef of SYSTEM_TABLES) {
            if (existingTableNames.has(tableDef.tableName)) {
                console.log(`[Seed] Deleting existing table: ${tableDef.tableName}`);
                await deleteTable(tableDef.tableName).catch(e => console.warn(`Failed to delete ${tableDef.tableName}:`, e.message));
            }
        }

        for (const tableDef of SYSTEM_TABLES) {
            console.log(`[Seed] Creating table: ${tableDef.tableName}`);
            await createTable(tableDef.displayName, tableDef.schema, { tableName: tableDef.tableName });
        }

        const now = new Date().toISOString();
        const adminId = generateId();

        await insertRows('user', [
            { 
                id: adminId, 
                username: 'admin', 
                password: hashPassword('admin123!'), 
                fullName: 'System Administrator', 
                role: 'ADMIN', 
                isActive: 1, 
                createdAt: now 
            }
        ]);

        return { success: true, message: 'Clean Seed 완료. admin 계정이 생성되었습니다.' };
    } catch (err: any) {
        console.error('[Seed] Critical failure:', err);
        return { success: false, error: err.message };
    }
}
