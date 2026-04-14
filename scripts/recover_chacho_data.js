const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
    }
});

const apiUrl = env.NEXT_PUBLIC_EGDESK_API_URL;
const apiKey = env.NEXT_PUBLIC_EGDESK_API_KEY;

async function callTool(tool, args) {
    const response = await fetch(`${apiUrl}/user-data/tools/call`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body: JSON.stringify({ tool, arguments: args })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return JSON.parse(result.result.content[0].text);
}

async function recover() {
    try {
        console.log('🚀 Starting Data Recovery for chacho...');

        const itemId = 'id-1776048432957-m9z6997f';
        const reportId = '1';
        const chachoId = '6428777f-4ade-4d04-86aa-7becc4d9bbe6';

        // 1. Get original item
        const items = await callTool('user_data_query', { filters: { id: itemId }, tableName: 'workspace_item' });
        const item = items.rows?.[0] || items?.[0];
        if (!item) throw new Error('Workspace item not found');

        console.log('Item found. Parsing data...');
        const rowData = JSON.parse(item.aiData);
        // Map image URL if missing in aiData
        if (!rowData.영수증사진 && item.imageUrl) {
            rowData.영수증사진 = item.imageUrl;
        }
        
        // Manual DID generation
        const dataId = 'DID-000008';
        rowData.데이터ID = dataId;

        // 2. Insert into Physical Table (tb_944447372_1h23k)
        console.log('Inserting into physical table...');
        await callTool('user_data_insert_rows', {
            tableName: 'tb_944447372_1h23k',
            rows: [rowData]
        });

        // 3. Insert into Virtual Table (report_row)
        console.log('Inserting into virtual table...');
        const virtualRow = {
            id: Math.random().toString(36).substring(2, 10),
            reportId: reportId,
            data: JSON.stringify(rowData),
            contentHash: 'RECOVERED_' + Date.now(),
            creatorId: chachoId,
            createdAt: item.createdAt, // Keep original creation time
            updatedAt: new Date().toISOString(),
            isDeleted: 0
        };

        await callTool('user_data_insert_rows', {
            tableName: 'report_row',
            rows: [virtualRow]
        });

        // 4. Update Workspace Item to link it (optional, but keep rowId if we had it)
        // Since we don't have a specific column for virtual row ID in workspace_item, we just ensure status is completed.

        console.log('✅ Recovery success! chacho\'s receipt (18,000 KRW) recorded as DID-000008.');

    } catch (err) {
        console.error('❌ Recovery failed:', err.message);
    }
}

recover();
