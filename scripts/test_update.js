const fetch = require('node-fetch');

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const req = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({ 
                tool: 'user_data_update_rows', 
                arguments: { 
                    tableName: 'report_row', 
                    updates: { isDeleted: '1' },
                    filters: { id: 1 } // some dummy id
                } 
            })
        });
        const res = await req.json();
        console.dir(JSON.parse(res.result.content[0].text), { depth: null });
        
        // Let's test with integer 1
        const req2 = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({ 
                tool: 'user_data_update_rows', 
                arguments: { 
                    tableName: 'report_row', 
                    updates: { isDeleted: 1 },
                    filters: { id: 1 } // some dummy id
                } 
            })
        });
        const res2 = await req2.json();
        console.dir(JSON.parse(res2.result.content[0].text), { depth: null });

    } catch (e) {
        console.error(e);
    }
}
run();
