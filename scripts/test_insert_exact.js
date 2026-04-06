const fetch = require('node-fetch');
const crypto = require('crypto');

function generateId() {
    return '123e4567-e89b-12d3-a456-426614174001';
}

async function run() {
    try {
        const API_URL = 'http://localhost:8080';
        const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

        const row = {
            "데이터ID": "DID-000001",
            "test": 123
        };

        const req = await fetch(`${API_URL}/user-data/tools/call`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
            body: JSON.stringify({ 
                tool: 'user_data_insert_rows', 
                arguments: { 
                    tableName: 'report_row', 
                    rows: [{
                      id: generateId(),
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
        console.dir(res, { depth: null });
    } catch (e) {
        console.error(e);
    }
}
run();
