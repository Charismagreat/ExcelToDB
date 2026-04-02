const API_URL = 'http://localhost:8080/financehub/tools/list'; // Try to list tools
const API_KEY = '7a1e4b57-313f-4597-9866-1bb95f623d97';

async function listTools() {
  console.log('Listing all available FinanceHub tools...');
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });

    if (!response.ok) {
       // Try POST if GET not supported by some MCP wrappers
       const postResponse = await fetch('http://localhost:8080/financehub/tools/list', {
         method: 'POST',
         headers: { 'X-Api-Key': API_KEY }
       });
       if (postResponse.ok) {
          const result = await postResponse.json();
          console.log('Tools:', JSON.stringify(result, null, 2));
          return;
       }
       console.error(`HTTP error! status: ${response.status}`);
       return;
    }

    const result = await response.json();
    console.log('Tools:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

listTools();
