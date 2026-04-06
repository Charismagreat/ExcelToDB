import { getOverallStats, getMonthlySummary, getSyncHistory, getStatistics } from '../src/financehub-helpers';

async function main() {
  try {
    const overall = await getOverallStats();
    
    // Get last 6 months summary
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthly = await getMonthlySummary({ year: currentYear, months: 6 });
    
    // Get sync history
    const syncHistory = await getSyncHistory(5);
    
    // Get stats for this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const thisMonthStats = await getStatistics({ startDate: thisMonthStart, endDate: thisMonthEnd });

    const result = {
      overall,
      monthly,
      syncHistory,
      thisMonthStats
    };
    
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error fetching detailed stats:', e);
  }
}

main();
