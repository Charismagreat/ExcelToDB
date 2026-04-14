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

async function check() {
    try {
        console.log('--- Checking report_row via API ---');
        const response = await fetch(`${apiUrl}/user-data/tools/call`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey
            },
            body: JSON.stringify({
                tool: 'user_data_query',
                arguments: { tableName: 'report_row', limit: 5 }
            })
        });

        const result = await response.json();
        console.log('Status Code:', response.status);
        if (!result.success) {
            console.error('Error:', result.error);
        } else {
            const content = JSON.parse(result.result.content[0].text);
            console.log('Rows:', JSON.stringify(content, null, 2));
        }

    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

check();
