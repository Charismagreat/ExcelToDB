// restore_metadata.js

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';

    const reqSys = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({tool: 'user_data_list_tables', arguments: {}})
    });
    const resSys = await reqSys.json();
    const systemTables = JSON.parse(resSys.result.content[0].text).tables || [];

    for (let t of systemTables) {
        if (t.tableName.startsWith('tb_')) {
            console.log("Restoring metadata for:", t.tableName);
            
            // Get schema
            const reqSch = await fetch(`${API_URL}/user-data/tools/call`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
                body: JSON.stringify({tool: 'user_data_get_schema', arguments: {tableName: t.tableName}})
            });
            const resSch = await reqSch.json();
            const schema = JSON.parse(resSch.result.content[0].text);
            const columns = (schema.schema || schema.columns || []).map(c => ({
                name: c.name,
                type: c.type === 'REAL' ? 'number' : (c.type === 'DATE' ? 'date' : 'string')
            }));

            // Insert into report
            const reqIns = await fetch(`${API_URL}/user-data/tools/call`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
                body: JSON.stringify({
                    tool: 'user_data_insert_rows', 
                    arguments: {
                        tableName: 'report', 
                        rows: [{
                            id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substr(2,5),
                            name: t.displayName || t.tableName,
                            sheetName: 'Restored Sheet',
                            tableName: t.tableName,
                            columns: JSON.stringify(columns),
                            ownerId: 'system',
                            createdAt: new Date().toISOString(),
                            isDeleted: '0',
                            lastSerial: t.rowCount || 0
                        }]
                    }
                })
            });
            const resIns = await reqIns.json();
            console.log("Insert result:", JSON.stringify(resIns));
        }
    }
}
run();
