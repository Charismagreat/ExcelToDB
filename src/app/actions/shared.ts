import crypto from 'crypto';
import { queryTable } from '@/egdesk-helpers';

// Password Security Utilities
export const SALT_SIZE = 16;
export const KEY_LEN = 64;

/**
 * 외부 의존성 없이 작동하는 안전한 ID 생성기
 */
export function generateSafeId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
}

/**
 * 프록시 Prisma 백엔드의 Int 제약을 피하기 위한 숫자형 ID 생성기
 */
export function generateNumericId() {
    return Math.floor(Math.random() * 2147483647);
}

/**
 * 전역에서 사용할 수 있는 안전한 ID 생성기
 */
export function generateId(): string {
    try {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch (e) {}
    // Fallback for older Node versions or environments
    return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_SIZE).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
    return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash) return false;
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
    return derivedKey.toString('hex') === hash;
}

/**
 * 보고서에 대한 사용자의 접근 권한을 확인합니다.
 * ADMIN, EDITOR는 모든 권한을 가지며, VIEWER는 명시적으로 권한이 부여되었거나 소유자인 경우에만 허용합니다.
 */
export async function checkReportAuthorization(reportId: string, userId: string, role: string) {
    if (role === 'ADMIN' || role === 'EDITOR') return true;
    
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    
    if (!report) return false;
    if (report.ownerId === userId) return true;
    
    // report_access 테이블 확인
    const accessList = await queryTable('report_access', { 
        filters: { reportId: String(reportId), userId: String(userId) } 
    });
    
    return accessList.length > 0;
}

/**
 * 필수 시스템 테이블 스키마 정의 (Self-Healing 용)
 */
export const SYSTEM_TABLES = [
    {
        tableName: 'user', displayName: 'System Users', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'email', type: 'TEXT', notNull: true },
            { name: 'passwordHash', type: 'TEXT', notNull: true },
            { name: 'salt', type: 'TEXT', notNull: true },
            { name: 'role', type: 'TEXT', notNull: true, defaultValue: 'USER' },
            { name: 'fullName', type: 'TEXT', notNull: true },
            { name: 'createdAt', type: 'TEXT', notNull: true }
        ] as any[]
    },
    {
        tableName: 'report', displayName: 'System Reports', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'sheetName', type: 'TEXT' },
            { name: 'description', type: 'TEXT' },
            { name: 'tableName', type: 'TEXT', notNull: true },
            { name: 'columns', type: 'TEXT', notNull: true },
            { name: 'uiConfig', type: 'TEXT' },
            { name: 'aiConfig', type: 'TEXT' },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 },
            { name: 'deletedAt', type: 'TEXT' },
            { name: 'ownerId', type: 'TEXT', notNull: true },
            { name: 'lastSerial', type: 'INTEGER', defaultValue: 0 },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT' }
        ] as any[]
    },
    {
        tableName: 'report_row', displayName: 'Virtual Report Rows', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'data', type: 'TEXT', notNull: true },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 },
            { name: 'deletedAt', type: 'TEXT' },
            { name: 'creatorId', type: 'TEXT' },
            { name: 'updaterId', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT', notNull: true }
        ] as any[]
    },
    {
        tableName: 'report_access', displayName: 'Report Access Controls', schema: [
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'userId', type: 'TEXT', notNull: true },
            { name: 'role', type: 'TEXT', notNull: true },
            { name: 'grantedAt', type: 'TEXT', notNull: true },
            { name: 'grantedBy', type: 'TEXT', notNull: true }
        ] as any[]
    },
    {
        tableName: 'report_row_history', displayName: 'Report Row History', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'rowId', type: 'TEXT', notNull: true },
            { name: 'oldData', type: 'TEXT' },
            { name: 'newData', type: 'TEXT' },
            { name: 'changeType', type: 'TEXT' },
            { name: 'changedById', type: 'TEXT' },
            { name: 'changedAt', type: 'TEXT' }
        ] as any[]
    },
    {
        tableName: 'workspace_item', displayName: 'Workspace Image Items', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'creatorId', type: 'TEXT' },
            { name: 'imageUrl', type: 'TEXT' },
            { name: 'originalText', type: 'TEXT' },
            { name: 'suggestedTitle', type: 'TEXT' },
            { name: 'suggestedSummary', type: 'TEXT' },
            { name: 'aiData', type: 'TEXT' },
            { name: 'status', type: 'TEXT', defaultValue: 'pending' },
            { name: 'reportId', type: 'TEXT' },
            { name: 'rowId', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT', notNull: true }
        ] as any[]
    }
];
