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

async function listTools() {
    try {
        console.log('--- Checking available tools on user-data server ---');
        const response = await fetch(`${apiUrl}/user-data/tools`, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey
            }
        });

        const result = await response.json();
        console.log(JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

listTools();
