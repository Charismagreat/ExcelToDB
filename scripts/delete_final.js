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
        console.log('--- Deleting Physical Rows [1, 2, 3] from tb_944447372_1h23k ---');
        const res2 = await fetch(`${apiUrl}/user-data/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
            body: JSON.stringify({
                tool: 'user_data_delete_rows',
                arguments: { tableName: 'tb_944447372_1h23k', ids: [1, 2, 3] }
            })
        });
        console.log('Physical Delete:', await res2.json());

        console.log('--- Deleting Virtual Rows [582161004, 734176964, 747808843] from report_row ---');
        const res1 = await fetch(`${apiUrl}/user-data/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
            body: JSON.stringify({
                tool: 'user_data_delete_rows',
                arguments: { tableName: 'report_row', ids: [582161004, 734176964, 747808843] }
            })
        });
        console.log('Virtual Delete:', await res1.json());

    } catch (e) {
        console.error(e);
    }
}
doDelete();
