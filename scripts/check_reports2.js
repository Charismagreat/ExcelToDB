const fetch = require('node-fetch');

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const q = async (name, args) => {
            const res = await fetch(`${API_URL}/user-data/tools/call`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
                body: JSON.stringify({ tool: 'user_data_query', arguments: { tableName: name, ...args } })
            });
            const j = await res.json();
            const parsed = JSON.parse(j.result.content[0].text);
            return Array.isArray(parsed) ? parsed : (parsed.rows || []);
        }

        const reports = await q('report', { limit: 10, orderBy: 'createdAt', orderDirection: 'DESC' });
        const latest = reports.filter(r => r.tableName)[0]; 

        console.log("Checking Sync for Report ID:", latest.id, "Table Name:", latest.tableName);

        const virtualRowsResponse = await q('report_row', { filters: { reportId: String(latest.id) }, limit: 10000 });
        console.log("Found rows for this reportId:", virtualRowsResponse.length);

        if(virtualRowsResponse.length > 0) {
            console.log("Sample isDeleted:", virtualRowsResponse[0].isDeleted);
        } else {
             // Let's search if ANY row has this report's table name or something?
             // Fetch all recent report rows
             const allRecent = await q('report_row', { limit: 100, orderBy: 'createdAt', orderDirection: 'DESC' });
             console.log("Recent report_row reportIds:", allRecent.map(r => r.reportId).slice(0, 5));
        }

    } catch (e) {
        console.error(e);
    }
}
run();
