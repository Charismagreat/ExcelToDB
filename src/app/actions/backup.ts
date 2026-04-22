'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { 
    listTables, 
    getTableSchema, 
    queryTable, 
    createTable, 
    insertRows, 
    deleteTable 
} from '@/egdesk-helpers';
import { getSessionAction } from './auth';

import { BackupService } from '@/lib/services/backup-service';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

/**
 * 📁 백업 디렉토리 확보
 */
function ensureBackupDir() {
    BackupService.ensureBackupDir();
}

/**
 * 📂 백업 파일 리스트 조회
 */
export async function getBackupsAction() {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') return [];

    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
            const stats = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                name: f,
                size: stats.size,
                createdAt: stats.birthtime.toISOString()
            };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return files;
}

/**
 * 📸 새로운 백업 생성 (JSON 스냅샷)
 */
export async function createBackupAction() {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    const result = await BackupService.createBackup();

    revalidatePath('/dashboard');
    return result;
}

/**
 * 🔄 백업 복구 (Restore)
 */
export async function restoreBackupAction(filename: string) {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) throw new Error('백업 파일을 찾을 수 없습니다.');

    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`[Restore] Starting restoration from ${filename}...`);

    for (const tableData of backupData.tables) {
        try {
            // 1. 기존 테이블 삭제 (충돌 방지)
            await deleteTable(tableData.name).catch(() => {});
            
            // 2. 테이블 생성
            await createTable(tableData.displayName || tableData.name, tableData.schema, {
                tableName: tableData.name
            });

            // 3. 데이터 삽입
            if (tableData.rows && tableData.rows.length > 0) {
                // 대량 삽입 시 청크 단위로 나누는 것이 안전함
                const chunkSize = 100;
                for (let i = 0; i < tableData.rows.length; i += chunkSize) {
                    const chunk = tableData.rows.slice(i, i + chunkSize);
                    await insertRows(tableData.name, chunk);
                }
            }
        } catch (err) {
            console.error(`[Restore Error] Table: ${tableData.name}`, err);
        }
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * 🗑️ 백업 파일 삭제
 */
export async function deleteBackupAction(filename: string) {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    const filePath = path.join(BACKUP_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return { success: true };
}

/**
 * 📥 백업 파일 다운로드 준비 (내용 읽기)
 */
export async function downloadBackupAction(filename: string) {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) throw new Error('파일을 찾을 수 없습니다.');

    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
}

/**
 * 📤 백업 파일 업로드 (내용 저장)
 */
export async function uploadBackupAction(filename: string, content: string) {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    ensureBackupDir();
    
    // 파일명 보안 처리 (경로 탐색 공격 방지)
    const safeName = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeName);
    
    fs.writeFileSync(filePath, content, 'utf8');

    revalidatePath('/dashboard');
    return { success: true };
}
