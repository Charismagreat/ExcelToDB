const fetch = require('node-fetch');
async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a17ed53e-4f32-48af-a792-9c6c94947e7d';

    const req = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_list_tables', 
            arguments: {}
        })
    });
    
    const res = await req.json();
    const tables = JSON.parse(res.result.content[0].text).tables;
    const filtered = tables.filter(t => t.displayName && (t.displayName.includes('홈택스') || t.displayName.includes('어음') || t.displayName.includes('계산서') || t.displayName.includes('현금영수증') || t.tableName.includes('finance') || t.tableName.includes('hub')));
    console.log(JSON.stringify(filtered, null, 2));
}
run();
