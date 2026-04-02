import { getSessionAction } from '@/app/actions';
import { queryTable } from '@/egdesk-helpers';
import { queryTransactions, queryCardTransactions } from '@/financehub-helpers';
import ReportDetailClient from '@/components/ReportDetailClient';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;

  // 실제 세션 사용자 정보 가져오기
  const user = await getSessionAction();

  let report: any;
  let rows: any[] = [];
  let columns: any[] = [];

  if (id === 'test-report-id') {
    const { TABLES } = await import('@/egdesk.config');
    const tableDef = TABLES.table1;
    report = {
      id: 'test-report-id',
      name: tableDef.displayName,
      sheetName: 'Main Database',
      columns: JSON.stringify(tableDef.columns.map((c: string) => ({ name: c, type: 'string' }))),
      ownerId: 'system',
    };
    const rowsData = await queryTable(tableDef.name, { limit: 100 });
    rows = rowsData.map((r: any, idx: number) => ({ ...r, id: String(idx), updatedAt: new Date().toISOString() }));
    columns = JSON.parse(report.columns);
  } else if (id === 'finance-hub-table') {
    const txData = await queryCardTransactions({
      limit: 1000, // Fetch more records for client-side pagination/sorting
      orderBy: 'date',
      orderDir: 'desc'
    });
    const transactions = Array.isArray(txData) ? txData : (txData?.transactions || []);

    const financeColumns = [
      { name: 'date', type: 'string' },
      { name: 'time', type: 'string' },
      { name: 'merchantName', type: 'string' },
      { name: 'amount', type: 'currency' },
      { name: 'cardholderName', type: 'string' },
      { name: 'departmentName', type: 'string' },
      { name: 'cardCompanyId', type: 'string' },
      { name: 'cardNumber', type: 'string' },
      { name: 'cardType', type: 'string' },
      { name: 'usageType', type: 'string' },
      { name: 'salesType', type: 'string' },
      { name: 'approvalDate', type: 'string' },
      { name: 'approvalDatetime', type: 'string' },
      { name: 'billingDate', type: 'string' },
      { name: 'approvalNumber', type: 'string' },
      { name: 'transactionBank', type: 'string' },
      { name: 'foreignAmountUsd', type: 'currency' },
      { name: 'category', type: 'string' },
      { name: 'isCancelled', type: 'string' },
      { name: 'memo', type: 'string' },
      { name: 'headquartersName', type: 'string' },
      { name: 'createdAt', type: 'string' },
      { name: 'updatedAt', type: 'string' },
      { name: 'id', type: 'string' },
    ];

    report = {
      id: 'finance-hub-table',
      name: '금융거래 통합 내역 (FinanceHub)',
      sheetName: 'FinanceHub',
      columns: JSON.stringify(financeColumns),
      ownerId: 'system',
      isReadOnly: true, // Mark as Read-Only for UI
    };

    rows = transactions.map((t: any, idx: number) => ({
      ...t,
      id: t.id || `tx-${idx}`,
      updatedAt: new Date().toISOString(),
    }));

    columns = financeColumns;

    // SERVER DEBUG LOG
    console.log('>>> [SERVER DEBUG] FinanceHub Transactions count:', rows.length);
  } else {
    const reports = await queryTable('report', { filters: { id } });
    report = reports[0];

    if (!report) {
      return <div className="p-20 text-center text-gray-500 font-bold">보고서를 찾을 수 없거나 삭제되었습니다.</div>;
    }

    const rowsData = await queryTable('report_row', {
      filters: { reportId: id },
      orderBy: 'updatedAt',
      orderDirection: 'DESC'
    });

    columns = JSON.parse(report.columns);
    rows = rowsData.map((r: any) => ({
      ...JSON.parse(r.data),
      id: r.id,
      updatedAt: r.updatedAt,
      isDeleted: r.isDeleted === 1,
      creatorId: r.creatorId
    }));
  }

  const isOwner = report.ownerId === user?.id || report.ownerId === 'system';
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = (isOwner || isAdmin || user?.role === 'EDITOR') && !report.isReadOnly;

  // 일반 사용자(VIEWER)인 경우 전용 입력 페이지로 리다이렉트
  if (user?.role === 'VIEWER' && !isOwner) {
    redirect(`/report/${id}/input`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={18} />
          My DB로 돌아가기
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
            <User size={18} className="text-blue-500" />
            <span>{user?.username || 'GUEST'} ({user?.role || 'NONE'})</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <ReportDetailClient
        id={id}
        report={report}
        user={user}
        columns={columns}
        rows={rows}
        isOwner={isOwner && !report.isReadOnly}
        isAdmin={isAdmin && !report.isReadOnly}
        canEdit={canEdit}
      />
    </div>
  );
}
