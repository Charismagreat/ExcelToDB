// test.js

async function run() {
    const r2 = await fetch('http://localhost:8080/user-data/tools/call', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key':'a87d1623-34c1-43fe-87c8-9fa8263d71a4'}, // Checking history
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', filters: {isDeleted: "0"}}})
    });
    const t2 = await r2.json();
    console.log('With string "0": ', t2.result ? JSON.parse(t2.result.content[0].text).rows.length : t2);

    const r3 = await fetch('http://localhost:8080/user-data/tools/call', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key':'a87d1623-34c1-43fe-87c8-9fa8263d71a4'},
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', filters: {isDeleted: 0}}})
    });
    const t3 = await r3.json();
    console.log('With number 0: ', t3.result ? JSON.parse(t3.result.content[0].text).rows.length : t3);
    
    // Also let's just get ALL reports without filter
    const r1 = await fetch('http://localhost:8080/user-data/tools/call', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key':'a87d1623-34c1-43fe-87c8-9fa8263d71a4'},
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', limit: 100}})
    });
    const t1 = await r1.json();
    console.log('All: ', t1.result ? JSON.parse(t1.result.content[0].text).rows.length : t1);
}
run();
