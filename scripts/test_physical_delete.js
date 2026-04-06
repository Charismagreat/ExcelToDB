const fetch = require('node-fetch');

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const q = async (tool, args) => {
            const res = await fetch(`${API_URL}/user-data/tools/call`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
                body: JSON.stringify({ tool, arguments: args })
            });
            return res.json();
        }

        // Get latest physical table
        const repRes = await q('user_data_query', { tableName: 'report', limit: 1, orderBy: 'createdAt', orderDirection: 'DESC' });
        const report = JSON.parse(repRes.result.content[0].text).rows[0];
        
        console.log("Testing on table:", report.tableName);
        
        const rows = JSON.parse((await q('user_data_query', { tableName: report.tableName, limit: 1 })).result.content[0].text).rows;
        if(rows.length === 0) {
           console.log("No rows in physical table to test delete");
           return;
        }

        const firstRow = rows[0];
        console.log("Attempting to delete row with data:", firstRow);
        
        const deleteRes = await q('user_data_delete_rows', { 
            tableName: report.tableName, 
            filters: { '데이터ID': String(firstRow['데이터ID']) } 
        });
        
        console.log("Delete Response:", JSON.stringify(deleteRes, null, 2));

    } catch (e) {
        console.error(e);
    }
}
run();
