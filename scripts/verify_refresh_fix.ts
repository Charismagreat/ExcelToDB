import { refreshIndividualChartAction } from '../src/app/actions';
import fs from 'fs/promises';

async function verify() {
  const chartId = '1775090908153-3gu6j9fgn';
  console.log('Refreshing chart:', chartId);
  
  try {
    const res = await refreshIndividualChartAction(chartId);
    console.log('Refresh result:', res.success ? 'Success' : 'Failed');
    
    if (res.success) {
      const fileContent = await fs.readFile('pinned_charts.json', 'utf-8');
      const pinned = JSON.parse(fileContent);
      const chart = pinned.find((p: any) => p.id === chartId);
      console.log('Updated data for 2026-04:', chart.config.data.find((d: any) => d.label === '2026-04')?.value);
    }
  } catch (e) {
    console.error('Error during verification:', e);
  }
}

verify();
