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

async function search() {
    try {
        console.log('--- Searching for chacho data ---');
        
        // 1. Find chacho user
        const users = await callTool('user_data_query', { 
            tableName: 'user', 
            filters: { username: 'chacho' } 
        });
        const chacho = users.rows?.[0] || users?.[0];
        console.log('Chacho user:', JSON.stringify(chacho, null, 2));
        
        const chachoId = chacho?.id;

        // 2. Check physical table
        console.log('\n--- Physical Table (tb_944447372_1h23k) ---');
        const physRes = await callTool('user_data_query', { 
            tableName: 'tb_944447372_1h23k', 
            limit: 10,
            orderBy: 'id',
            orderDirection: 'DESC'
        });
        console.log('Last 10 physical rows:', JSON.stringify(physRes, null, 2));

        // 3. Check virtual table
        console.log('\n--- Virtual Table (report_row) ---');
        const virtRes = await callTool('user_data_query', { 
            tableName: 'report_row', 
            filters: { reportId: '1' },
            limit: 10,
            orderBy: 'createdAt',
            orderDirection: 'DESC'
        });
        console.log('Last 10 virtual rows for report 1:', JSON.stringify(virtRes, null, 2));

        // 4. Check workspace items
        console.log('\n--- Workspace Item (workspace_item) ---');
        const workRes = await callTool('user_data_query', { 
            tableName: 'workspace_item', 
            filters: { creatorId: chachoId },
            limit: 10,
            orderBy: 'createdAt',
            orderDirection: 'DESC'
        });
        console.log('Last 10 workspace items:', JSON.stringify(workRes, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

search();
