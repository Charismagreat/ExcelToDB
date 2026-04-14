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
    const content = JSON.parse(result.result.content[0].text);
    return content;
}

async function cleanup() {
    try {
        console.log('--- Cleaning up Report 1 data ---');
        
        // 1. Find all active rows for report 1
        const rowsResult = await callTool('user_data_query', { 
            tableName: 'report_row', 
            filters: { reportId: '1' },
            limit: 100 
        });
        const rows = rowsResult.rows || rowsResult || [];
        const idsToDelete = rows.map(r => r.id);
        
        console.log(`Found ${idsToDelete.length} rows to delete.`);
        
        if (idsToDelete.length > 0) {
            const delResult = await callTool('user_data_delete_rows', {
                tableName: 'report_row',
                ids: idsToDelete
            });
            console.log('Virtual rows deleted:', delResult);
        }

        // 2. Clear physical table
        const physDelResult = await callTool('user_data_delete_rows', {
            tableName: 'tb_944447372_1h23k',
            filters: {}
        });
        console.log('Physical rows deleted:', physDelResult);

        console.log('\n--- Attempting to fix report_row schema ---');
        const schema = [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'data', type: 'TEXT', notNull: true },
            { name: 'contentHash', type: 'TEXT' },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 },
            { name: 'deletedAt', type: 'TEXT' },
            { name: 'creatorId', type: 'TEXT' },
            { name: 'updaterId', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT', notNull: true }
        ];

        try {
            const createResult = await callTool('user_data_create_table', { 
                displayName: 'Virtual Report Rows',
                tableName: 'report_row',
                schema: schema,
                uniqueKeyColumns: ['id']
            });
            console.log('Schema update result:', JSON.stringify(createResult));
        } catch (e) {
            console.log('Schema update failed:', e.message);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

cleanup();
