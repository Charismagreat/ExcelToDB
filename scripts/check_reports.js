const fetch = require('node-fetch');
async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const req = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_sql_query', 
            arguments: {
                query: "SELECT id, tableName, displayName FROM report WHERE displayName LIKE '%홈택스%' OR displayName LIKE '%세금계산서%' OR displayName LIKE '%어음%'"
            }
        })
    });
    const res = await req.json();
    console.log(res.result.content[0].text);
}
run();
