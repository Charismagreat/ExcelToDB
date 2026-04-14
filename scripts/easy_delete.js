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

async function doDelete() {
    try {
        console.log('--- Deleting Report 1 rows from report_row ---');
        const res1 = await fetch(`${apiUrl}/user-data/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
            body: JSON.stringify({
                tool: 'user_data_delete_rows',
                arguments: { tableName: 'report_row', filters: { reportId: '1' } }
            })
        });
        const r1 = await res1.json();
        console.log('Virtual Delete Result:', JSON.stringify(r1, null, 2));

        console.log('--- Deleting all rows from tb_944447372_1h23k ---');
        const res2 = await fetch(`${apiUrl}/user-data/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
            body: JSON.stringify({
                tool: 'user_data_delete_rows',
                arguments: { tableName: 'tb_944447372_1h23k', filters: {} }
            })
        });
        const r2 = await res2.json();
        console.log('Physical Delete Result:', JSON.stringify(r2, null, 2));

    } catch (e) {
        console.error(e);
    }
}
doDelete();
