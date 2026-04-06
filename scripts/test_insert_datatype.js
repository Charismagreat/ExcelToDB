const fetch = require('node-fetch');

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const row = {
            "데이터ID": "DID-000001",
            "test": 123
        };

        const testInsert = async (idValue) => {
            const req = await fetch(`${API_URL}/user-data/tools/call`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
                body: JSON.stringify({ 
                    tool: 'user_data_insert_rows', 
                    arguments: { 
                        tableName: 'report_row', 
                        rows: [{
                          id: idValue,
                          reportId: 'rep-uuid-1234',
                          data: JSON.stringify(row),
                          creatorId: 'user-uuid-1234',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          isDeleted: 0
                        }]
                    } 
                })
            });
            const res = await req.json();
            console.log("ID Type:", typeof idValue, "Value:", idValue);
            console.log(JSON.parse(res.result.content[0].text));
        }
        
        await testInsert(Math.floor(Math.random() * 2147483647)); // number
        await testInsert("123e4567-e89b-12d3-a456-426614174001"); // string
        await testInsert(0); // number 0

    } catch (e) {
        console.error(e);
    }
}
run();
