// print_table.js

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const reqAll = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report'}})
    });
    const resAll = await reqAll.json();
    const rows = JSON.parse(resAll.result.content[0].text).rows || [];
    
    console.log("ALL REPORTS IN DATABASE:");
    rows.forEach(r => {
        console.log(JSON.stringify(r, null, 2));
    });
    
}
run();
