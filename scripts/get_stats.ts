import { getOverallStats } from '../egdesk-helpers';

async function main() {
  try {
    const stats = await getOverallStats();
    console.log(JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error('Error fetching stats:', e);
  }
}

main();
