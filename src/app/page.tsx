import React from 'react';
import { getSessionAction } from '@/app/actions';
import DeleteReportButton from '@/components/DeleteReportButton';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  LayoutDashboard, 
  User, 
  Trash2, 
  ExternalLink, 
  Plus, 
  ShieldCheck, 
  Wallet, 
  Database,
  BarChart3,
  Sparkles,
  ArrowRight,
  Star,
  Compass
} from 'lucide-react';
import NewTableSection from '@/components/NewTableSection';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { queryTable, aggregateTable, listTables } from '@/egdesk-helpers';
import NavigationSidebar from '@/components/NavigationSidebar';
import SyncStatusBadge from '@/components/SyncStatusBadge';

export default async function DashboardPage() {
  // 실제 세션 사용자 정보 가져오기
  const user = await getSessionAction();

  if (!user) {
    redirect('/login');
  }

  // 1. 물리적 시스템 테이블 목록 가져오기
  let systemTables: any[] = [];
  try {
    const res = await listTables();
    systemTables = res?.tables || [];
  } catch (err) {
    console.error('Failed to list system tables:', err);
  }

  // 2. 권한에 따른 보고서 필터링 (가상 테이블)
  let allReports = await queryTable('report', {
    filters: { isDeleted: '0' },
    orderBy: 'createdAt',
    orderDirection: 'DESC'
  });

  // VIEWER 필터링: 본인 소유이거나 접근 권한이 부여된 보고서만
  if (user.role === 'VIEWER') {
    const accessList = await queryTable('report_access', { filters: { userId: String(user.id) } });
    const authorizedIds = new Set(accessList.map((a: any) => a.reportId));
    allReports = allReports.filter((r: any) => r.ownerId === user.id || authorizedIds.has(r.id));
  }

  // 보고서별 데이터 행 개수 추가
  let virtualReports = await Promise.all(allReports.map(async (r: any) => {
    let count: number | string = 0;
    if (r.id === 'test-report-id') {
      count = 133;
    } else if (r.tableName) {
      try {
        const aggr = await aggregateTable(r.tableName, 'id', 'COUNT');
        count = Number(aggr?.value ?? aggr) || 0; 
      } catch (err) {}
    } else {
      try {
        const aggr = await aggregateTable('report_row', 'id', 'COUNT', {
          filters: { reportId: String(r.id), isDeleted: '0' }
        });
        count = Number(aggr?.value ?? aggr) || 0;
      } catch (err) { count = 0; }
    }
    return {
      ...r,
      _count: { rows: count },
      isVirtualReport: true,
      isDirectTable: r.id === 'test-report-id'
    };
  }));

  // 관리자/에디터 권한 판별
  const isAdminOrEditor = user.role === 'ADMIN' || user.role === 'EDITOR';
  let reports: any[] = [];

  // FinanceHub 테이블 추가 (항상 상단)
  if (isAdminOrEditor) {
    reports.push({
      id: 'finance-hub-table',
      name: '금융거래 통합 내역 (FinanceHub)',
      sheetName: 'FinanceHub External',
      _count: { rows: '연동 중' },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true
    });
  }

  // 1. 물리적 시스템 테이블 목록 가져오기 및 2. 가상 리포트 필터링 로직이 위쪽에 있습니다.
  // ... 생략 ...

  // 가상 리포트 중에서 사용 중인 물리적 테이블(tableName) 리스트 추출
  const mappedTableNames = new Set(virtualReports.map(r => r.tableName).filter(Boolean));

  // 시스템 물리 테이블 통합 (어드민/에디터만)
  if (isAdminOrEditor) {
    const mappedSystemTables = systemTables
      .filter((t: any) => !mappedTableNames.has(t.tableName)) // 이미 가상 보고서와 연결된 물리 테이블은 중복 방지를 위해 제외
      .map((t: any) => ({
        id: t.tableName,
        name: t.displayName || t.tableName,
        sheetName: 'System Table',
        _count: { rows: t.rowCount !== null && t.rowCount !== undefined ? t.rowCount : 'N/A' },
        isSystemTable: true,
        ownerId: 'system',
        isReadOnly: true
      }));
    reports = [...reports, ...mappedSystemTables];
  }

  // 가상 리포트 병합
  reports = [...reports, ...virtualReports];

  const isStaff = user.role === 'VIEWER';

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <NavigationSidebar user={user} />
      <div className="flex-1 ml-72 flex flex-col min-w-0 overflow-hidden">
        <main className="max-w-6xl mx-auto p-8 md:p-12 space-y-16 w-full overflow-y-auto">
          {!isStaff && <NewTableSection userId={user.id} />}

          {/* Dashboard Hero Banner */}
          <section className="relative overflow-hidden bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-900/5 group">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
            <div className="relative p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  <Sparkles size={12} />
                  DATA CENTER
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  데이터를 한눈에 통찰하는<br/>
                  <span className="text-blue-600">DASHBOARD</span>
                </h2>
                <p className="text-gray-500 font-medium max-w-lg leading-relaxed">
                  모든 테이블의 데이터를 통합하여 시각화하고 실시간 통계를 확인하세요. 
                  FinanceHub와 연동된 금융 데이터도 함께 분석할 수 있습니다.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/dashboard"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 group/btn shadow-xl shadow-blue-500/20"
                  >
                    DASHBOARD 보기
                    <Star size={18} />
                  </Link>
                  <Link 
                    href="/dashboard/studio"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all active:scale-95 group/btn shadow-xl shadow-gray-200"
                  >
                    ANALYSIS STUDIO 시작
                    <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-auto flex items-center justify-center">
                <div className="relative w-48 h-48 md:w-64 md:h-64 bg-blue-50 rounded-[60px] flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  <BarChart3 size={80} className="text-blue-600 opacity-20" strokeWidth={1} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center animate-pulse">
                       <LayoutDashboard size={48} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reports List */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">{isStaff ? '나의 MY DB' : 'MY DB'}</h2>
              </div>
              <span className="text-sm text-gray-500">총 {reports.length}개</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">


              {reports.map((report: any) => (
                <div key={report.id} className="relative group bg-white border rounded-2xl hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl transition-colors ${report.isFinanceTable ? 'bg-indigo-50 text-indigo-600' :
                          report.isSystemTable ? 'bg-purple-50 text-purple-600' :
                          report.isDirectTable ? 'bg-slate-50 text-slate-600' :
                            (isStaff ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white')
                        }`}>
                        {report.isFinanceTable ? <Wallet size={20} /> :
                          report.isSystemTable ? <Database size={20} /> :
                          report.isDirectTable ? <Database size={20} /> :
                            (isStaff ? <ShieldCheck size={20} /> : <FileSpreadsheet size={20} />)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                              {report.isReadOnly && (
                                <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase tracking-widest border border-amber-100 animate-pulse">
                                  Read-Only
                                </span>
                              )}
                              {isStaff && (
                                <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase tracking-widest border border-amber-100">
                                  Authorized
                                </span>
                              )}
                              {!isStaff && !report.isReadOnly && <DeleteReportButton reportId={report.id} reportName={report.name} />}
                          </div>
                          {!report.isFinanceTable && !report.isSystemTable && !report.isDirectTable && (
                              <SyncStatusBadge reportId={report.id} />
                          )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{report.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase">{report.sheetName || 'Sheet'}</span>
                      <span>•</span>
                      <span>{report._count.rows}개의 데이터</span>
                    </div>
                    <Link
                      href={
                          report.isSystemTable && report.id === 'user' ? '/users' :
                          (report.isSystemTable || report.isDirectTable) ? `/report/${report.id}` :
                            (isStaff ? `/report/${report.id}/input` : `/report/${report.id}`)
                      }
                      className={`block w-full text-center py-2.5 px-4 font-black rounded-xl transition-all text-xs uppercase tracking-[0.1em] border ${
                          report.isSystemTable ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-600' 
                          : (isStaff ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600 shadow-lg shadow-amber-500/20' : 'bg-gray-50 text-blue-600 border-blue-50 group-hover:bg-blue-600 group-hover:text-white')
                        }`}
                    >
                      {
                        report.isSystemTable && report.id === 'user' ? 'Open Management' :
                        report.isSystemTable ? 'View System Table' :
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
    </div>
  );
}
