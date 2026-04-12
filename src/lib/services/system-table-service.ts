import { listTables, createTable } from '@/egdesk-helpers';
import { SYSTEM_TABLES } from '@/app/actions/shared';

export class SystemTableService {
    private static initializedTables = new Set<string>();

    /**
     * 지정된 시스템 테이블이 서버에 존재하는지 안전하게 확인하고 없으면 생성합니다.
     */
    static async ensureTable(tableName: string): Promise<void> {
        // 이미 이번 세션에서 확인된 테이블은 스킵
        if (this.initializedTables.has(tableName)) return;

        const tableDef = SYSTEM_TABLES.find(t => t.tableName === tableName);
        if (!tableDef) {
            console.warn(`[SystemTableService] No definition for: ${tableName}`);
            return;
        }

        try {
            const tablesResult = await listTables();
            const tables = Array.isArray(tablesResult) ? tablesResult : (tablesResult?.rows || []);
            
            const exists = tables.some((t: any) => {
                const name = typeof t === 'string' ? t : (t.name || t.tableName);
                return name === tableName;
            });

            if (!exists) {
                console.info(`[SystemTableService] Table '${tableName}' missing. Creating...`);
                await createTable(tableDef.displayName, tableDef.schema, { tableName: tableDef.tableName });
            }
            
            this.initializedTables.add(tableName);
        } catch (err: any) {
            console.error(`[SystemTableService] Check failed for ${tableName}:`, err.message);
            
            // Aggressive Fallback
            try {
                await createTable(tableDef.displayName, tableDef.schema, { tableName: tableDef.tableName });
                this.initializedTables.add(tableName);
            } catch (createErr: any) {
                const msg = String(createErr.message || createErr);
                if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('exists')) {
                    this.initializedTables.add(tableName);
                } else {
                    throw createErr;
                }
            }
        }
    }

    /**
     * 모든 필수 시스템 테이블을 보장합니다.
     */
    static async ensureAllSystemTables(): Promise<void> {
        for (const table of SYSTEM_TABLES) {
            await this.ensureTable(table.tableName);
        }
    }
}
