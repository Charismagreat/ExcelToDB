// test_insert.js

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const req = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_insert_rows', 
            arguments: {
                tableName: 'report', 
                rows: [{
                    id: 'test-insert-1234',
                    name: 'test_insert',
                    tableName: 'test_insert',
                    columns: '[]',
                    ownerId: 'system',
                    createdAt: new Date().toISOString(),
                    isDeleted: '0',
                    lastSerial: 0
                }]
            }
        })
    });
    
    const res = await req.json();
    console.log("Insert result:", JSON.stringify(res, null, 2));
}
run();
