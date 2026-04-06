// check_dashboard.js

async function run() {
    const API_URL = 'http://localhost:8080';
    const API_KEY = process.env.NEXT_PUBLIC_EGDESK_API_KEY || 'a87d1623-34c1-43fe-87c8-9fa8263d71a4';
    
    // 1. Get system tables
    const sysReq = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({tool: 'user_data_list_tables', arguments: {}})
    });
    const sysRes = await sysReq.json();
    const systemTables = JSON.parse(sysRes.result.content[0].text).tables || [];

    // 4. Get all reports
    const reqAll = await fetch(`${API_URL}/user-data/tools/call`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Api-Key': API_KEY},
        body: JSON.stringify({tool: 'user_data_query', arguments: {tableName: 'report', limit: 1000}})
    });
    const resAll = await reqAll.json();
    const reportsAll = JSON.parse(resAll.result.content[0].text).rows || [];
    
    // Filter JS side
    const reportsActive = reportsAll.filter(r => String(r.isDeleted) === '0');
    
    console.log("\n=== REPORTS ===");
    console.log("Reports with JS filter length:", reportsActive.length);
    reportsActive.forEach(r => console.log(r.id, "=>", r.name, "| tableName:", r.tableName));
    
    const mappedTableNames = new Set(reportsActive.map(r => r.tableName?.toLowerCase()).filter(Boolean));
    console.log("\n=== MAPPED TABLE NAMES ===");
    console.log(Array.from(mappedTableNames));
    
    const unmappedSystemTables = systemTables.filter((t) => !mappedTableNames.has(t.tableName?.toLowerCase()));
    console.log("\n=== UNMAPPED (SYSTEM) TABLES ===");
    unmappedSystemTables.forEach(t => console.log(t.tableName));
}
run();
