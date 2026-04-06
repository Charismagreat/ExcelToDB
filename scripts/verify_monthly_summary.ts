import { callFinanceHubTool } from '../src/financehub-helpers';

async function main() {
  try {
    const result = await callFinanceHubTool('financehub_get_monthly_summary', { months: 6 });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
