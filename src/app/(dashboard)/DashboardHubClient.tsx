'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  FileSpreadsheet, 
  ExternalLink, 
  ShieldCheck, 
  Wallet,
  History
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { NewTableSection } from '@/components/NewTableSection';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { DeleteReportButton } from '@/components/DeleteReportButton';
import BackupManager from '@/components/BackupManager';

interface DashboardHubClientProps {
  user: any;
  isStaff: boolean;
  reports: any[];
}

export function DashboardHubClient({ user, isStaff, reports }: DashboardHubClientProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'backups'>('reports'); // 탭 상태 추가

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <main className="max-w-[1600px] mx-auto p-8 md:p-12 space-y-12 w-full overflow-y-auto">
        <PageHeader 
          title={isStaff ? "Employee Hub" : (activeTab === 'reports' ? "Data Center" : "Snapshot Center")}
          description={isStaff ? "부서별로 공유된 데이터 테이블과 입력 양식을 확인할 수 있습니다." : 
                      (activeTab === 'reports' ? "조직의 모든 데이터를 관리하고 분석할 수 있는 데이터 센터입니다." : "데이터베이스 전체를 시점별로 저장하고 복구할 수 있는 백업 센터입니다.")}
          icon={activeTab === 'reports' ? Database : History}
          rightElement={
            !isStaff && activeTab === 'reports' && (
              <button 
                onClick={() => setShowManualModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-blue-500/20 text-sm tracking-widest uppercase flex items-center gap-2"
              >
                <Plus size={16} />
                테이블 직접 만들기
              </button>
            )
          }
        />

        {/* Tab Navigation (Premium Style) */}
        {!isStaff && (
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-[22px] w-fit">
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'reports' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              MY DB Repository
            </button>
            <button 
              onClick={() => setActiveTab('backups')}
              className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'backups' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              System Snapshots
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'reports' ? (
          <>
            {!isStaff && (
              <NewTableSection 
                userId={user.id} 
                showManualModal={showManualModal} 
                setShowManualModal={setShowManualModal} 
              />
            )}

            {/* Reports List */}
            <section className="max-w-[1600px] mx-auto">
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
          </>
        ) : (
          <BackupManager />
        )}
      </main>
    </div>
  );
}
