// trigger_healing.js

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const req = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({
            tool: 'user_data_create_table', 
            arguments: {
                displayName: 'System Reports',
                tableName: 'report',
                schema: [
                    { name: 'id', type: 'TEXT', notNull: true },
                    { name: 'name', type: 'TEXT', notNull: true },
                    { name: 'sheetName', type: 'TEXT' },
                    { name: 'description', type: 'TEXT' },
                    { name: 'tableName', type: 'TEXT', notNull: true },
                    { name: 'columns', type: 'TEXT', notNull: true },
                    { name: 'uiConfig', type: 'TEXT' },
                    { name: 'aiConfig', type: 'TEXT' },
                    { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 },
                    { name: 'deletedAt', type: 'TEXT' },
                    { name: 'ownerId', type: 'TEXT', notNull: true },
                    { name: 'lastSerial', type: 'INTEGER', defaultValue: 0 },
                    { name: 'createdAt', type: 'TEXT', notNull: true },
                    { name: 'updatedAt', type: 'TEXT' }
                ]
            }
        })
    });
    
    const res = await req.json();
    console.log("Create table result:", JSON.stringify(res, null, 2));
}
run();
