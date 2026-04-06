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

        const reports = await q('report', { limit: 50, orderBy: 'createdAt', orderDirection: 'DESC' });
        const latest = reports.filter(r => r.tableName)[0]; 
        
        console.log("Report:", latest.name, latest.tableName);
        
        const virtuals = await q('report_row', { filters: { reportId: String(latest.id) }, limit: 10 });
        console.log("Virtuals RAW length:", virtuals.length);
        if(virtuals.length > 0) {
            console.log("First V Row isDeleted type:", typeof virtuals[0].isDeleted, "value:", virtuals[0].isDeleted);
            console.log("First V Row full:", virtuals[0]);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
