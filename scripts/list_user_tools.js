const fetch = require('node-fetch');
async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const req = await fetch(`${API_URL}/user-data/tools/list`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY}
    });
    
    if (!req.ok) {
        const getReq = await fetch(`${API_URL}/user-data/tools/list`, {
            method: 'GET',
            headers: {'X-Api-Key': API_KEY}
        });
        const res = await getReq.json();
        console.log(JSON.stringify(res, null, 2));
        return;
    }
    
    const res = await req.json();
    console.log(JSON.stringify(res, null, 2));
}
run();
