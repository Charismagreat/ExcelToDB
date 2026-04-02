const API_URL = 'http://localhost:8080/financehub/tools/call';
const API_KEY = '7a1e4b57-313f-4597-9866-1bb95f623d97';

async function checkSchema() {
  console.log('Fetching card transactions to check schema...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify({
        tool: 'financehub_query_card_transactions',
        arguments: { limit: 1 }
      })
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }

    const result = await response.json();
    if (!result.success) {
      console.error('Tool call failed:', result.error);
      return;
    }

    const content = JSON.parse(result.result.content[0].text);
    const transactions = Array.isArray(content) ? content : (content.transactions || []);
    
    if (transactions.length === 0) {
      console.log('No transactions found.');
      return;
    }

    const firstTx = transactions[0];
    const keys = Object.keys(firstTx);
    console.log('Found', keys.length, 'columns:');
    console.log(JSON.stringify(keys, null, 2));
    console.log('Sample Data:', JSON.stringify(firstTx, null, 2));
  } catch (error) {
    console.error('Error during schema check:', error);
  }
}

checkSchema();
