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

async function run() {
    console.log('--- Triggering Schema Update for report_row ---');
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

    const body = JSON.stringify({
        tool: 'user_data_create_table',
        arguments: {
            displayName: 'Virtual Report Rows',
            tableName: 'report_row',
            schema: schema
        }
    });

    const res = await fetch(`${apiUrl}/user-data/tools/call`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body
    });

    const result = await res.json();
    console.log(JSON.stringify(result, null, 2));
}

run();
