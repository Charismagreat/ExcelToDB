// check_report_rows.js
const fetch = require('node-fetch');

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const req = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_query', 
            arguments: {
                tableName: 'report_row',
                limit: 1000
            }
        })
    });
    
    const res = await req.json();
    const rows = JSON.parse(res.result.content[0].text).rows || [];
    
    console.log("Total rows in report_row:", rows.length);
    const newRows = rows.filter(r => r.reportId.startsWith('rep-'));
    console.log("Rows with 'rep-' ID:", newRows.length);
}
run();
