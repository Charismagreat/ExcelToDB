import React from 'react';
import { getSessionAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import { queryTable } from '@/egdesk-helpers';
import DashboardClient from '../DashboardClient';
import { LayoutDashboard, Compass, Star, Bot } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default async function DataAnalysisStudioPage() {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  // Fetch all user-managed reports (tables)
  const reportsData = await queryTable('report', { 
    filters: { isDeleted: '0' },
    orderBy: 'updatedAt',
    orderDirection: 'DESC'
  });

  // Define virtual tables (e.g., FinanceHub)
  const virtualReports = [
    {
      id: 'finance-hub-table',
      name: '금융거래 통합 내역 (FinanceHub)',
      sheetName: 'FinanceHub',
      isReadOnly: true,
      isFinance: true,
      columns: JSON.stringify([
        { name: 'date', type: 'string' },
        { name: 'merchantName', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'status', type: 'string' }
      ])
    }
  ];

  const allTables = [
    ...virtualReports,
    ...reportsData.map((r: any) => ({
      ...r,
      columns: r.columns
    }))
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <main className="max-w-[1600px] mx-auto p-8 md:p-12">
        <DashboardClient 
          allTables={allTables}
          user={user}
        />
      </main>
      
      <footer className="max-w-[1600px] mx-auto px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; 2026 Data Analysis Studio &bull; Creative Builder
      </footer>
    </div>
  );
}
