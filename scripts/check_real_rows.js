// check_real_rows.js
const fetch = require('node-fetch');

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const vreq = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_query', 
            arguments: { tableName: 'report_row', limit: 10000 }
        })
    });
    const vText = (await vreq.json()).result.content[0].text;
    const vRows = JSON.parse(vText).rows || [];

    console.log("TOTAL report_row rows:", vRows.length);
    console.log("DISTINCT reportId counts:");
    const counts = {};
    for (const r of vRows) {
        counts[r.reportId] = (counts[r.reportId] || 0) + 1;
    }
    console.log(counts);
}
run();
