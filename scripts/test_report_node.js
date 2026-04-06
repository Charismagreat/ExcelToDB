// test_report.js
const { callUserDataTool } = require('./src/egdesk-helpers.js'); // Cannot use .ts easily without ts-node

async function run() {
    try {
        const fetch = require('node-fetch');
        const r1 = await fetch('http://localhost:8080/user-data/tools/call', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key':'3931f0ae-064f-41f4-b63d-367dbf249e37'},
            body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', limit: 10}})
        }).then(r => r.json());
        console.log('All: ', r1.result.content[0].text.substring(0, 100));

        const r2 = await fetch('http://localhost:8080/user-data/tools/call', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key':'3931f0ae-064f-41f4-b63d-367dbf249e37'},
            body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', filters: {isDeleted: "0"}}})
        }).then(r => r.json());
        console.log('With string "0": ', JSON.parse(r2.result.content[0].text).rows.length);

        const r3 = await fetch('http://localhost:8080/user-data/tools/call', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Api-Key':'3931f0ae-064f-41f4-b63d-367dbf249e37'},
            body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', filters: {isDeleted: 0}}})
        }).then(r => r.json());
        console.log('With number 0: ', JSON.parse(r3.result.content[0].text).rows.length);

    } catch (e) {
        console.log("Error:", e);
    }
}
run();
