const fetch = require('node-fetch');

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const req = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({ 
                tool: 'user_data_insert_rows', 
                arguments: { 
                    tableName: 'report_row', 
                    rows: [{
                        id: 'a87d1623-34c1-43fe-87c8-9fa8263d71a4', // some string
                        reportId: 'rep-test222',
                        data: JSON.stringify({ "테스트": 123 }),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }]
                } 
            })
        });
        const res = await req.json();
        console.dir(res, { depth: null });
    } catch (e) {
        console.error(e);
    }
}
run();
