// auto_repair2.js
const fetch = require('node-fetch');

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const reqAll = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', limit: 1000}})
    });
    const resAll = await reqAll.json();
    const reportsAll = JSON.parse(resAll.result.content[0].text).rows || [];
    const reportsActive = reportsAll.filter(r => String(r.isDeleted) === '0');

    for (const report of reportsActive) {
        if (!report.tableName) continue;
        
        const preq = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: report.tableName, limit: 10000}})
        });
        const pRows = JSON.parse((await preq.json()).result.content[0].text).rows || [];
        
        const vreq = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({
                tool: 'user_data_query', 
                arguments: {
                    tableName: 'report_row'
                }
            })
        });
        const allVRowsResponse = JSON.parse((await vreq.json()).result.content[0].text);
        // User query is paginated, need a query that actually fetches filtered items
        // Let's use user_data_search or user_data_query with very high limit
    }
}
run();
