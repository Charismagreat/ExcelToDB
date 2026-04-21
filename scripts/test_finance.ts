import { listBanks, listAccounts } from '../egdesk-helpers';

async function test() {
  try {
    // Get some transactions from March 2026 (assuming current time is April 1st)
    const tx = await queryCardTransactions({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      limit: 5
    });
    console.log('Sample Transactions:', JSON.stringify(tx, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
