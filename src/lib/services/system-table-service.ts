import { listTables, createTable } from '@/egdesk-helpers';
import { SYSTEM_TABLES } from '@/app/actions/shared';

export class SystemTableService {
    private static initializedTables = new Set<string>();

    /**
     * [관리자 점검 중] 수동 데이터 복구 작업을 위해 모든 자동 테이블 생성 기능을 일시 중지합니다.
     */
    static async ensureTable(tableName: string): Promise<void> {
        console.log(`[SystemTableService] Auto-ensure for ${tableName} is temporarily disabled.`);
        return;
    }

    /**
     * [관리자 점검 중] 모든 필수 시스템 테이블 보장 기능을 일시 중지합니다.
     */
    static async ensureAllSystemTables(): Promise<void> {
        console.log('[SystemTableService] Global auto-ensure is temporarily disabled.');
        return;
    }
}
