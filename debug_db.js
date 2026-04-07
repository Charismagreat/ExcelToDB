const apiUrl = 'http://localhost:8080/user-data/tools/call';
const apiKey = '7a406902-a90d-4aef-a983-c64320c77084';

async function callTool(tool, args) {
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        },
        body: JSON.stringify({ tool, arguments: args })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    const content = result.result.content[0].text;
    return JSON.parse(content);
}

async function run() {
    try {
        console.log('--- Table: workspace_item (Latest 2) ---');
        const q1 = await callTool('user_data_query', { tableName: 'workspace_item', limit: 2, orderBy: 'createdAt', orderDirection: 'DESC' });
        console.log(JSON.stringify(q1.rows, null, 2));

        console.log('--- Schema: tb_944447372_1h23k ---');
        const s1 = await callTool('user_data_get_schema', { tableName: 'tb_944447372_1h23k' });
        console.log(JSON.stringify(s1.columns || s1.schema, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
