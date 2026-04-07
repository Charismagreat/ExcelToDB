const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '3931f0ae-064f-41f4-b63d-367dbf249e37',
};

async function callTool(tool, args) {
  const response = await fetch(`${EGDESK_CONFIG.apiUrl}/user-data/tools/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': EGDESK_CONFIG.apiKey
    },
    body: JSON.stringify({ tool, arguments: args })
  });
  return response.json();
}

async function cleanup() {
  const tables = ['user', 'report', 'report_access', 'report_row', 'report_row_history', 'ai_studio_session'];
  console.log('Cleaning up system tables metadata...');

  for (const table of tables) {
    console.log(`Deleting table: ${table}...`);
    try {
      const res = await callTool('user_data_delete_table', { tableName: table });
      console.log(`Result: ${JSON.stringify(res)}`);
    } catch (e) {
      console.error(`Error deleting ${table}:`, e.message);
    }
  }
  console.log('Cleanup finished.');
}

cleanup();
