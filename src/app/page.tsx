import React from 'react';
import { getSessionAction } from '@/app/actions';
import DeleteReportButton from '@/components/DeleteReportButton';
import Link from 'next/link';
import { FileSpreadsheet, User, LayoutDashboard, Trash2, ShieldCheck, ExternalLink, Wallet, Database } from 'lucide-react';
import NewTableSection from '@/components/NewTableSection';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { queryTable, aggregateTable } from '@/egdesk-helpers';

export default async function DashboardPage() {
  // 실제 세션 사용자 정보 가져오기
  const user = await getSessionAction();

  if (!user) {
    redirect('/login');
  }

  // 권한에 따른 보고서 필터링
  let allReports = await queryTable('report', {
    filters: { isDeleted: '0' },
    orderBy: 'createdAt',
    orderDirection: 'DESC'
  });

  // VIEWER 필터링: 본인 소유이거나 접근 권한이 부여된 보고서만
  if (user.role === 'VIEWER') {
    const accessList = await queryTable('report_access', { filters: { userId: user.id } });
    const authorizedIds = new Set(accessList.map((a: any) => a.reportId));
    allReports = allReports.filter((r: any) => r.ownerId === user.id || authorizedIds.has(r.id));
  }

  // 보고서별 데이터 행 개수 추가
  let reports = await Promise.all(allReports.map(async (r: any) => {
    if (r.id === 'test-report-id') {
      return { ...r, _count: { rows: 133 }, isDirectTable: true };
    }
    const rowCountResult = await aggregateTable('report_row', 'id', 'COUNT', { 
        filters: { reportId: r.id, isDeleted: '0' } 
    });
    return {
        ...r,
        _count: { rows: Number(rowCountResult) || 0 }
    };
  }));

  // FinanceHub 테이블만 수기 추가
  reports = [
    {
      id: 'finance-hub-table',
      name: '금융거래 통합 내역 (FinanceHub)',
      sheetName: 'Transactions',
      columns: '[]',
      _count: { rows: '연동 중' },
      isFinanceTable: true
    },
    ...reports
  ];

  const isStaff = user.role === 'VIEWER';

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Excel to DB</h1>
          </div>
          {!isStaff && (
            <Link 
              href="/archive" 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-xs font-black text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
            >
              <Trash2 size={14} />
              DELETED TABLES
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
            <User size={18} className="text-blue-500" />
            <span>{user.username} ({user.role})</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-16">
        {!isStaff && <NewTableSection userId={user.id} />}

        {/* Reports List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">{isStaff ? '나의 업무 테이블' : 'My Tables'}</h2>
            </div>
            <span className="text-sm text-gray-500">총 {reports.length}개</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* System Users Table (Admin/Editor only) */}
            {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
              <div className="relative group bg-indigo-600 border border-indigo-500 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-200 transition-all duration-300">
                <div className="p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/20 text-white p-2.5 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase tracking-widest border border-white/10">System Table</span>
                  </div>
                  <h3 className="text-lg font-black mb-1 truncate">시스템 사용자 관리</h3>
                  <div className="flex items-center gap-2 text-sm text-indigo-100 mb-4 opacity-80 font-semibold">
                    <span>직원 계정 보관소</span>
                    <span>•</span>
                    <span>관리자 전용</span>
                  </div>
                  <Link 
                    href="/users"
                    className="block w-full text-center py-2.5 px-4 bg-white text-indigo-600 font-black rounded-xl hover:bg-indigo-50 transition-all text-xs uppercase tracking-widest"
                  >
                    Open Management
                  </Link>
                </div>
              </div>
            )}

            {reports.map((report: any) => (
              <div key={report.id} className="relative group bg-white border rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      report.isFinance ? 'bg-indigo-50 text-indigo-600' :
                      report.isDirectTable ? 'bg-slate-50 text-slate-600' :
                      (isStaff ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white')
                    }`}>
                      {report.isFinance ? <Wallet size={20} /> :
                       report.isDirectTable ? <Database size={20} /> :
                       (isStaff ? <ShieldCheck size={20} /> : <FileSpreadsheet size={20} />)}
                    </div>
                    {!isStaff && <DeleteReportButton reportId={report.id} reportName={report.name} />}
                    {isStaff && (
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase tracking-widest border border-amber-100">
                        Authorized
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{report.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase">{report.sheetName || 'Sheet'}</span>
                    <span>•</span>
                    <span>{report._count.rows}개의 데이터</span>
                  </div>
                  <Link 
                    href={
                      report.isFinance ? '/dashboard' : 
                      report.isDirectTable ? `/report/${report.id}` :
                      (isStaff ? `/report/${report.id}/input` : `/report/${report.id}`)
                    }
                    className={`block w-full text-center py-2.5 px-4 font-black rounded-xl transition-all text-xs uppercase tracking-[0.1em] border ${
                        report.isFinance 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600' 
                        : (isStaff ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600 shadow-lg shadow-amber-500/20' : 'bg-gray-50 text-blue-600 border-blue-50 group-hover:bg-blue-600 group-hover:text-white')
                    }`}
                  >
                    {report.isFinance ? 'Open Finance Hub' : 
                     report.isDirectTable ? 'View Raw Table' :
                     (isStaff ? (
                        <span className="flex items-center justify-center gap-2">
                           Open Data Entry <ExternalLink size={14} />
                        </span>
                    ) : 'View Table')}
                  </Link>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="col-span-full py-20 bg-white border border-dashed rounded-3xl flex flex-col items-center justify-center text-gray-400">
                {isStaff ? (
                    <>
                        <ShieldCheck size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">배정된 업무 테이블이 없습니다. 관리자에게 문의해 주세요.</p>
                    </>
                ) : (
                    <>
                        <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">관리 중인 보고서가 없습니다. 엑셀 파일을 업로드해 보세요.</p>
                    </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
