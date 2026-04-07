import { insertRows } from '../src/egdesk-helpers';
import fs from 'fs';
import path from 'path';

/**
 * .env.local 파일을 수동으로 로드하여 환경 변수 주입
 */
function loadEnvLocal() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    }
}

async function restoreReport() {
    console.log('📝 Restoring [발주 입고 내역] virtual table definition...');
    loadEnvLocal();

    try {
        const columns = [
            { name: '구 분', type: 'string' },
            { name: '규 격', type: 'string' },
            { name: '단 가', type: 'number' },
            { name: '주문 수량', type: 'number' },
            { name: '금 액', type: 'number' },
            { name: '발 주 일', type: 'date' },
            { name: '입고요청일', type: 'date' },
            { name: '입고일자', type: 'date' },
            { name: '비 고', type: 'string' }
        ];

        await insertRows('report', [{
            id: 'e9690f38-daac-4819-bf93-66236b28399e',
            name: '발주 입고 내역',
            sheetName: 'Sheet1',
            tableName: 'sheet1',
            columns: JSON.stringify(columns),
            ownerId: '', 
            createdAt: new Date().toISOString(),
            isDeleted: 0
        }]);

        console.log('✅ Virtual Table definition restored successfully!');
    } catch (e: any) {
        console.error('❌ Failed to restore report:', e.message);
    }
}

restoreReport();
