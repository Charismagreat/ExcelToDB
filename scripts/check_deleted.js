// check_deleted.js
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

    const reportRows = vRows.filter(r => r.reportId === 'rep-1775443075836-1m7wx');
    
    // check exactly how it fails in actions.ts:
    // actions.ts checkSyncStatusAction filter:
    // const virtualList = allVirtualList.filter((r: any) => !r.isDeleted || r.isDeleted === '0' || r.isDeleted === 0 || r.isDeleted === false);
    
    let virtualCount = reportRows.filter(r => !r.isDeleted || r.isDeleted === '0' || r.isDeleted === 0 || r.isDeleted === false).length;
    console.log("Filtered length exactly like actions.ts:", virtualCount);
    
    console.log("Samples:", reportRows.slice(0, 2).map(r => ({ id: r.id, isDeleted: r.isDeleted, type: typeof r.isDeleted })));
}
run();
