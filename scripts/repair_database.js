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

async function repair() {
    try {
        console.log('1. Dropping inconsistent report_row metadata...');
        try {
            const dropResult = await callTool('user_data_delete_table', { 
                tableName: 'report_row' 
            });
            console.log('Drop result:', JSON.stringify(dropResult));
        } catch (e) {
            console.log('Drop failed (might be expected if table missing):', e.message);
        }

        console.log('\n2. Recreating report_row table with full schema...');
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

        const createResult = await callTool('user_data_create_table', { 
            displayName: 'Virtual Report Rows',
            tableName: 'report_row',
            schema: schema,
            uniqueKeyColumns: ['id']
        });
        console.log('Creation result:', JSON.stringify(createResult));

        console.log('\n✅ Repair completed successfully.');
    } catch (err) {
        console.error('\n❌ Repair failed:', err.message);
    }
}

repair();
