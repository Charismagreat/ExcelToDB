import fs from 'fs';
import path from 'path';
import { 
    listTables, 
    getTableSchema, 
    queryTable, 
    createTable, 
    insertRows, 
    deleteTable 
} from '@/egdesk-helpers';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export class BackupService {
    /**
     * 📁 백업 디렉토리 확보
     */
    static ensureBackupDir() {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    /**
     * 📸 새로운 백업 생성 (JSON 스냅샷)
     */
    static async createBackup() {
        this.ensureBackupDir();
        const res = await listTables();
        const tables = res?.tables || [];
        
        const backupData: any = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            tables: []
        };

        console.log(`[BackupService] Starting snapshot for ${tables.length} tables...`);

        for (const table of tables) {
            const tableName = table.tableName;
            const schema = await getTableSchema(tableName);
            const rows = await queryTable(tableName);

            backupData.tables.push({
                name: tableName,
                displayName: table.displayName,
                schema,
                rows: rows || []
            });
        }

        const filename = `snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filePath = path.join(BACKUP_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

        console.log(`[BackupService] Backup created: ${filename}`);
        
        // Retention Policy 적용 (Task 3에서 상세 구현 예정이나 미리 공간 확보)
        await this.enforceRetention();

        return { success: true, filename };
    }

    /**
     * 🗑️ 보관 정책 강제 (최신 10개 유지)
     */
    static async enforceRetention() {
        this.ensureBackupDir();
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const stats = fs.statSync(path.join(BACKUP_DIR, f));
                return { name: f, createdAt: stats.birthtimeMs };
            })
            .sort((a, b) => b.createdAt - a.createdAt); // 최신순 정렬

        if (files.length > 10) {
            const toDelete = files.slice(10);
            for (const file of toDelete) {
                const filePath = path.join(BACKUP_DIR, file.name);
                fs.unlinkSync(filePath);
                console.log(`[BackupService] Deleted old backup: ${file.name}`);
            }
        }
    }
}
