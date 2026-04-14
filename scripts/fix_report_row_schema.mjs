import fs from 'fs';
import path from 'path';

// Read .env.local manually
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
    if (!result.success) throw new Error(result.error || 'Tool call failed');
    return JSON.parse(result.result.content[0].text);
}

async function migrate() {
    try {
        console.log('1. Healing report_row schema using user_data_create_table...');
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
                schema: schema
            });
            console.log('Schema healing result:', JSON.stringify(createResult));
        } catch (e) {
            console.log('Schema healing failed (might be expected if table exists):', e.message);
        }

        console.log('2. Deleting system-repair entries for report 1 (신용카드영수증)...');
        // Delete from virtual table
        await callTool('user_data_delete_rows', {
            tableName: 'report_row',
            filters: { reportId: '1', creatorId: 'system-repair' }
        });

        // Delete from physical table (신용카드영수증 table name: tb_944447372_1h23k)
        await callTool('user_data_delete_rows', {
            tableName: 'tb_944447372_1h23k',
            filters: {} // Delete all 
        });

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    }
}

migrate();
