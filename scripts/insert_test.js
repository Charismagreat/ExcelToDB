// insert_test.js
const fetch = require('node-fetch');

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const ireq = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_insert_rows', 
            arguments: {
                tableName: 'report_row', 
                rows: [{
                    id: Math.floor(Math.random() * 1000000000),
                    reportId: "rep-1775443075836-1m7wx",
                    data: "{}",
                    isDeleted: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }]
            }
        })
    });
    const res = await ireq.json();
    console.log("TEXT:", res.result.content[0].text);
}
run();
