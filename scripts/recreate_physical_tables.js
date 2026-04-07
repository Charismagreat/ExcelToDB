const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '7a406902-a90d-4aef-a983-c64320c77084',
};

function mapToPhysicalType(appType) {
    if (!appType) return 'TEXT';
    switch (appType.toLowerCase()) {
        case 'number':
        case 'currency':
        case 'percent':
        case 'rating':
            return 'REAL';
        case 'date':
        case 'datetime':
        case 'time':
            return 'DATE';
        case 'boolean':
        case 'checkbox':
            return 'INTEGER';
        default:
            return 'TEXT';
    }
}

async function callTool(tool, args) {
  const response = await fetch(`${EGDESK_CONFIG.apiUrl}/user-data/tools/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': EGDESK_CONFIG.apiKey
    },
    body: JSON.stringify({ tool, arguments: args })
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Tool call failed');
  }
  return JSON.parse(result.result.content[0].text);
}

async function recreate() {
  console.log('🚀 Starting Recreate Physical Tables...');

  try {
    // 1. Get current reports
    const reportsRes = await callTool('user_data_query', { tableName: 'report' });
    console.log('DEBUG: report query response:', JSON.stringify(reportsRes));
    
    // Handle both { rows: [...] } and direct array formats
    const reports = Array.isArray(reportsRes) ? reportsRes : (reportsRes.rows || []);
    console.log(`Found ${reports.length} report definitions in metadata.`);

    // 2. Get existing physical tables
    const tablesRes = await callTool('user_data_list_tables', {});
    const existingTableNames = (tablesRes.tables || []).map(t => (t.tableName || t.name).toLowerCase());
    console.log(`Current physical tables: ${existingTableNames.join(', ')}`);

    for (const report of reports) {
      const physicalName = report.tableName;
      if (!physicalName) {
        console.warn(`⚠️ Report [${report.name}] has no tableName defined. Skipping.`);
        continue;
      }

      if (existingTableNames.includes(physicalName.toLowerCase())) {
        console.log(`✅ Table [${physicalName}] already exists. Skipping.`);
        continue;
      }

      console.log(`🔨 Recreating table [${physicalName}] for report [${report.name}]...`);
      
      let columns = [];
      try {
        columns = JSON.parse(report.columns);
      } catch (e) {
        console.error(`❌ Failed to parse columns for report [${report.name}]:`, e.message);
        continue;
      }

      // Map columns to EGDesk schema format
      const schema = columns.map(col => {
          let colObj = typeof col === 'string' ? { name: col, type: 'string' } : col;
          return {
              name: colObj.name,
              type: mapToPhysicalType(colObj.type || 'string'),
              notNull: colObj.isRequired ? true : false
          };
      });

      // Special case: Add 'id' or default columns if missing and expected by UI
      // In this system, 'sheet1' used in ReportDetailPage expects columns from the report definition.

      try {
        await callTool('user_data_create_table', {
          displayName: report.name,
          tableName: physicalName,
          schema: schema,
          description: `Recreated from metadata (Recovery mode)`
        });
        console.log(`✨ Successfully recreated table [${physicalName}]`);
      } catch (err) {
        console.error(`❌ Failed to create table [${physicalName}]:`, err.message);
      }
    }

    console.log('\n✅ All missing tables processed.');

  } catch (e) {
    console.error('❌ Recreate process failed:', e.message);
  }
}

recreate();
