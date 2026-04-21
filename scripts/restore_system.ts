import { listTables, deleteTable, createTable, insertRows } from '../egdesk-helpers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * .env.local 파일을 수동으로 로드하여 환경 변수 주입
 */
function loadEnvLocal() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        console.log('📝 Loading environment from .env.local...');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    } else {
        console.warn('⚠️  .env.local file not found at:', envPath);
    }
}

// 스크립트 시작 시 환경 변수 로드
loadEnvLocal();

const SALT_SIZE = 16;
const KEY_LEN = 64;

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_SIZE).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
    return `${salt}:${derivedKey.toString('hex')}`;
}

async function restore() {
    console.log('🚀 Starting System Restoration...');
    console.log('Using API Key:', process.env.NEXT_PUBLIC_EGDESK_API_KEY ? '***** (Loaded)' : 'Not Found');

    try {
        // 1. Create User Table
        console.log('Creating [user] table...');
        await createTable('user', [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'username', type: 'TEXT', notNull: true },
            { name: 'password', type: 'TEXT', notNull: true },
            { name: 'role', type: 'TEXT', notNull: true },
            { name: 'fullName', type: 'TEXT' },
            { name: 'isActive', type: 'INTEGER', defaultValue: 1 },
            { name: 'createdAt', type: 'TEXT' }
        ], { tableName: 'user', uniqueKeyColumns: ['username'] });

        // 2. Create Report Table
        console.log('Creating [report] table...');
        await createTable('report', [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'sheetName', type: 'TEXT' },
            { name: 'tableName', type: 'TEXT' },
            { name: 'columns', type: 'TEXT' }, 
            { name: 'ownerId', type: 'TEXT' },
            { name: 'slackWebhookUrl', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT' },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 }
        ], { tableName: 'report' });

        // 3. Create Report Row Table
        console.log('Creating [report_row] table...');
        await createTable('report_row', [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'data', type: 'TEXT' }, 
            { name: 'contentHash', type: 'TEXT' },
            { name: 'creatorId', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT' },
            { name: 'updatedAt', type: 'TEXT' },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 }
        ], { tableName: 'report_row' });

        // 4. Create Report Access Table
        console.log('Creating [report_access] table...');
        await createTable('report_access', [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'userId', type: 'TEXT', notNull: true },
            { name: 'createdAt', type: 'TEXT' }
        ], { tableName: 'report_access' });

        // 5. Insert Admin User
        console.log('Inserting [admin_user]...');
        const adminId = crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex');
        const hashedPassword = hashPassword('admin123!');
        
        await insertRows('user', [{
            id: adminId,
            username: 'admin_user',
            password: hashedPassword,
            role: 'ADMIN',
            fullName: 'Administrator',
            isActive: 1,
            createdAt: new Date().toISOString()
        }]);

        console.log('✅ Restoration Complete!');
        console.log('Admin ID:', adminId);
        console.log('Username: admin_user');
        console.log('Password: admin123!');

    } catch (error: any) {
        console.error('❌ Restoration Failed:', error.message);
    }
}

restore();
