const fetch = require('node-fetch');

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const dreq = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({
                tool: 'user_data_query', 
                arguments: { tableName: 'report_access' }
            })
        });
        const res = await dreq.json();
        console.log(res);
    } catch (e) {
        console.error(e);
    }
}
run();
