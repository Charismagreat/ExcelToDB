import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { queryTable } from '@/egdesk-helpers';
import { DashboardClient } from '../DashboardClient';
import { LayoutDashboard, Compass, Star, Bot, Sparkles } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import PageHeader from '@/components/PageHeader';

export default async function DataAnalysisStudioPage() {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  // Fetch all user-managed reports (tables)
  const rawReportsData = await queryTable('report', { 
    limit: 1000,
    orderBy: 'updatedAt',
    orderDirection: 'DESC'
  });
  const reportsData = rawReportsData.filter((r: any) => String(r.isDeleted) === '0');

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
        <PageHeader 
          title="Analysis Studio"
          description="테이블 데이터를 AI가 분석하여 최적의 차트와 인사이트를 생성합니다."
          icon={Bot}
        />
        <DashboardClient 
          allTables={allTables}
          user={user}
        />
      </main>
    </div>
  );
}
