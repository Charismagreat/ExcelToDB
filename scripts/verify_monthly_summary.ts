import { getMonthlySummary } from '../egdesk-helpers';

async function main() {
  try {
    const result = await getMonthlySummary({ months: 6 });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
