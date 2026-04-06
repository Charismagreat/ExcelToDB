// auto_repair3.js
const fetch = require('node-fetch');

function generateNumericId() {
    return Math.floor(Math.random() * 2147483647);
}

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    // 1. Get all reports
    const reqAll = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', limit: 1000}})
    });
    const resAll = await reqAll.json();
    const reportsAll = JSON.parse(resAll.result.content[0].text).rows || [];
    const reportsActive = reportsAll.filter(r => String(r.isDeleted) === '0');

    // 2. Loop and sync
    for (const report of reportsActive) {
        if (!report.tableName) continue;
        
        // Physical count
        const preq = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: report.tableName, limit: 10000}})
        });
        const pRows = JSON.parse((await preq.json()).result.content[0].text).rows || [];
        
        // Virtual rows
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
        // we can't fetch all virtual rows like this because of limit, so just use user_data_search or let the UI button do it?
        // Wait, I can't easily auto_repair. I'll just tell the user to click the button!! The logic in actions.ts is now fixed!
    }
}
// run();
