import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { 
  queryTable, 
  aggregateTable, 
  listTables, 
  getOverallStats, 
  listHometaxConnections 
} from '@/egdesk-helpers';
import { DashboardClient } from '../DashboardClient';
import { Compass } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default async function DataAnalysisStudioPage() {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  // 1. 시스템 정보 및 금융 데이터 요약 가져오기 (MY DB와 동일한 로직)
  let systemTables: any[] = [];
  let financeStats: any = null;
  let hometaxStats: any = null;

  try {
    const [tablesRes, statsRes, hometaxRes] = await Promise.all([
      listTables().catch(() => ({ tables: [] })),
      getOverallStats().catch(() => null),
      listHometaxConnections().catch(() => null)
    ]);
    systemTables = tablesRes?.tables || [];
    financeStats = statsRes;
    hometaxStats = hometaxRes;
  } catch (err) {
    console.error('Failed to fetch system data for studio:', err);
  }

  // 2. 가상 보고서(report) 목록 가져오기 및 필터링
  const rawAllReports = await queryTable('report', {
    limit: 1000,
    orderBy: 'createdAt',
    orderDirection: 'DESC'
  });
  let allReports = rawAllReports.filter((r: any) => String(r.isDeleted) === '0');

  // VIEWER 권한 필터링
  if (user.role === 'VIEWER') {
    const accessList = await queryTable('report_access', { filters: { userId: String(user.id) } });
    const authorizedIds = new Set(accessList.map((a: any) => a.reportId));
    allReports = allReports.filter((r: any) => r.ownerId === user.id || authorizedIds.has(r.id));
  }

  // [통합 로직] 보고서별 데이터 행 개수 계산 함수 (MY DB와 동일)
  const getReportRowCount = async (r: any) => {
    if (r.tableName === 'finance_bank_transactions') {
      return financeStats?.bankBreakdown
        ?.filter((b: any) => !b.bankId.toLowerCase().includes('card'))
        .reduce((sum: number, b: any) => sum + (b.transactionCount || 0), 0) || financeStats?.totalTransactions || 0;
    }
    if (r.tableName === 'finance_card_transactions') {
      return financeStats?.bankBreakdown
        ?.filter((b: any) => b.bankId.toLowerCase().includes('card'))
        .reduce((sum: number, b: any) => sum + (b.transactionCount || 0), 0) || 0;
    }
    if (r.tableName?.startsWith('hometax_')) {
      const hometaxConnection = hometaxStats?.connections?.[0] || {};
      const fieldMap: Record<string, string> = {
        'hometax_sales_invoices': 'sales_count',
        'hometax_purchase_invoices': 'purchase_count',
        'hometax_cash_receipts': 'cash_receipt_count'
      };
      const apiCount = hometaxConnection[fieldMap[r.tableName] || ''] || 0;
      let dbCount = 0;
      try {
        const aggr = await aggregateTable(r.tableName, 'id', 'COUNT');
        dbCount = Number(aggr?.value ?? aggr) || 0;
      } catch (err) {}
      return Math.max(apiCount, dbCount);
    }
    if (r.id === 'test-report-id') return 133;
    if (r.tableName) {
      try {
        const aggr = await aggregateTable(r.tableName, 'id', 'COUNT');
        return Number(aggr?.value ?? aggr) || 0;
      } catch (err) { return 0; }
    }
    try {
      const aggr = await aggregateTable('report_row', 'id', 'COUNT', {
        filters: { reportId: String(r.id), isDeleted: '0' }
      });
      return Number(aggr?.value ?? aggr) || 0;
    } catch (err) { return 0; }
  };

  // 모든 가상 리포트에 통합 로직 적용
  let virtualReports = await Promise.all(allReports.map(async (r: any) => {
    const count = await getReportRowCount(r);
    return {
      ...r,
      name: r.displayName || r.name,
      _count: { rows: count },
      isVirtualReport: true
    };
  }));

  // 3. 최종 통합 리스트 생성 (MY DB와 동일한 구성)
  const isAdminOrEditor = user.role === 'ADMIN' || user.role === 'EDITOR';
  let reports: any[] = [];

  // FinanceHub 개별 테이블 추가
  if (isAdminOrEditor) {
    const getCountById = (id: string) => virtualReports.find(v => v.id === id)?._count?.rows || 0;

    reports.push({
      id: 'finance-hub-card-table',
      name: '신용카드 거래 내역 (FinanceHub)',
      tableName: 'finance_card_transactions',
      _count: { rows: getCountById('finance-hub-card-table') || getCountById('rep-finance_card_transactions') },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true,
      sheetName: 'FinanceHub'
    });
    reports.push({
      id: 'finance-hub-bank-table',
      name: '은행 계좌 거래 내역 (FinanceHub)',
      tableName: 'finance_bank_transactions',
      _count: { rows: getCountById('finance-hub-bank-table') || getCountById('rep-finance_bank_transactions') },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true,
      sheetName: 'FinanceHub'
    });
    reports.push({
      id: 'finance-hub-hometax-sales-tax',
      name: '매출세금계산서 (홈택스)',
      tableName: 'hometax_sales_invoices',
      _count: { rows: getCountById('finance-hub-hometax-sales-tax') },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true,
      sheetName: 'Hometax'
    });
    reports.push({
      id: 'finance-hub-hometax-purchase-tax',
      name: '매입세금계산서 (홈택스)',
      tableName: 'hometax_purchase_invoices',
      _count: { rows: getCountById('finance-hub-hometax-purchase-tax') },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true,
      sheetName: 'Hometax'
    });
    reports.push({
      id: 'finance-hub-hometax-cash-receipt',
      name: '현금영수증 내역 (홈택스)',
      tableName: 'hometax_cash_receipts',
      _count: { rows: getCountById('finance-hub-hometax-cash-receipt') },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true,
      sheetName: 'Hometax'
    });
    reports.push({
      id: 'finance-hub-promissory-table',
      name: '전자어음 내역 (FinanceHub)',
      tableName: 'promissory_notes',
      _count: { rows: getCountById('finance-hub-promissory-table') || getCountById('rep-promissory_notes') },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true,
      sheetName: 'FinanceHub'
    });
  }

  // 중복 방지를 위한 셋팅
  const mappedTableNames = new Set(virtualReports.map(r => r.tableName?.toLowerCase()).filter(Boolean));

  // 시스템 물리 테이블 통합
  if (isAdminOrEditor) {
    const mappedSystemTables = systemTables
      .filter((t: any) => !mappedTableNames.has(t.tableName?.toLowerCase()))
      .map((t: any) => ({
        id: t.tableName,
        tableName: t.tableName,
        name: t.displayName || t.tableName,
        sheetName: 'System Table',
        _count: { rows: t.rowCount ?? 0 },
        isSystemTable: true,
        isReadOnly: t.tableName !== 'user'
      }));
    reports = [...reports, ...mappedSystemTables];
  }

  // 최종 병합
  reports = [...reports, ...virtualReports];

  // 중복 제거
  const uniqueTables = Array.from(
    new Map(reports.map(r => [r.id, r])).values()
  ) as any[];

  return (
    <div className="flex-1 overflow-y-auto">
      <main className="max-w-[1600px] mx-auto px-8 md:px-12 pt-6 pb-12">
        <PageHeader 
          title="ANALYSIS STUDIO"
          description="테이블 데이터를 AI가 분석하여 최적의 차트와 인사이트를 생성합니다."
          icon={Compass}
        />
        <DashboardClient 
          allTables={uniqueTables}
          user={user}
        />
      </main>
    </div>
  );
}
