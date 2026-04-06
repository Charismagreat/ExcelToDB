// get_schema.js
const fetch = require('node-fetch');

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const req = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_get_schema', 
            arguments: {
                tableName: 'report_row'
            }
        })
    });
    
    const res = await req.json();
    const parsed = JSON.parse(res.result.content[0].text);
    console.log(parsed.schema || parsed.columns);
}
run();
