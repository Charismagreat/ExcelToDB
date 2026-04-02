const API_URL = 'http://localhost:8080/financehub/tools/call';
const API_KEY = '7a1e4b57-313f-4597-9866-1bb95f623d97';

async function checkTotalCount() {
  console.log('Checking total count of card transactions...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify({
        tool: 'financehub_query_card_transactions',
        arguments: { limit: 1000 } // Try large limit
      })
    });

    const result = await response.json();
    const content = JSON.parse(result.result.content[0].text);
    
    // Check if result is wrapped
    if (content.transactions) {
       console.log('Total Count (metadata):', content.total);
       console.log('Transactions length:', content.transactions.length);
    } else if (Array.isArray(content)) {
       console.log('Result is a flat array. Length:', content.length);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTotalCount();
