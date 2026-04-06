// fast_repair.js
const fetch = require('node-fetch');

function generateNumericId() {
    return Math.floor(Math.random() * 2147483647);
}

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

    for (const report of reportsAll) {
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
                arguments: { tableName: 'report_row', filters: {reportId: report.id}, limit: 10000 }
            })
        });
        const vText = (await vreq.json()).result.content[0].text;
        const vRows = JSON.parse(vText).rows || [];

        if (vRows.length < pRows.length) {
            console.log(`Mismatch ${report.name}: v=${vRows.length}, p=${pRows.length}. Repairing...`);
            
            // just insert all missing rows (since this is mostly empty virtuals currently)
            const vDataStrings = new Set(vRows.map(v => v.data));
            const toInsert = pRows.filter(p => !vDataStrings.has(JSON.stringify(p)));
            
            console.log(`Found ${toInsert.length} rows to insert.`);
            
            if(toInsert.length > 0) {
                const chunk = toInsert.map(pData => ({
                    id: generateNumericId(),
                    reportId: String(report.id),
                    data: JSON.stringify(pData),
                    isDeleted: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
                
                const ireq = await fetch(`${API_URL}/user-data/tools/call`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
                    body: JSON.stringify({
                        tool: 'user_data_insert_rows', 
                        arguments: { tableName: 'report_row', rows: chunk }
                    })
                });
                const ires = await ireq.json();
                console.log("INSERT RES:", JSON.stringify(ires, null, 2));
            }
        }
    }
}
run();
