// check_delete.js
const fetch = require('node-fetch');

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    // get the row to delete
    const vreq = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_query', 
            arguments: { tableName: 'report_row', filters: {reportId: "rep-1775443075836-1m7wx"}, limit: 10000 }
        })
    });
    const vText = (await vreq.json()).result.content[0].text;
    const vRows = JSON.parse(vText).rows || [];

    // find the dummy row I made "id: Math.floor(...)" that isn't connected or we can just delete it
    // Wait, the dummy rows didn't have auto-generated dataID, their data was '{}'.
    const dummy = vRows.find(r => r.data === '{}');
    if (!dummy) {
        console.log("No dummy found");
        return;
    }
    console.log("Found dummy id:", dummy.id);

    // Try deleting with filters
    const dreq = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_delete_rows', 
            arguments: { tableName: 'report_row', filters: { id: String(dummy.id) } }
        })
    });
    console.log("DELETE result filters:", await dreq.json());
}
run();
