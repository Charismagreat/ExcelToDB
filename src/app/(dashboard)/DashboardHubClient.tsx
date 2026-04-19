'use client';

import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  FileSpreadsheet, 
  ExternalLink, 
  ShieldCheck, 
  Wallet,
  History,
  Search,
  Filter,
  Check
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { NewTableSection } from '@/components/NewTableSection';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { DeleteReportButton } from '@/components/DeleteReportButton';
import BackupManager from '@/components/BackupManager';
import UpcomingEventsWidget from '@/components/dashboard/UpcomingEventsWidget';
import { CalendarEvent } from '@/lib/services/calendar-service';

interface DashboardHubClientProps {
  user: any;
  isStaff: boolean;
  reports: any[];
  events: CalendarEvent[];
}

export function DashboardHubClient({ user, isStaff, reports, events }: DashboardHubClientProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'backups'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // 카테고리 추출 및 정리
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    reports.forEach(r => {
      // 1. 직접 부여된 category 확인
      if (r.category) {
        cats.add(r.category);
      } 
      // 2. uiConfig 내의 category 확인
      else if (r.uiConfig) {
        try {
          const config = JSON.parse(r.uiConfig);
          if (config.category) cats.add(config.category);
        } catch (e) {}
      }
    });
    return Array.from(cats).sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    });
  }, [reports]);

  // 필터링 로직
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // 카테고리 필터
      let rCat = r.category || 'Uncategorized';
      if (!r.category && r.uiConfig) {
        try {
          const config = JSON.parse(r.uiConfig);
          if (config.category) rCat = config.category;
        } catch (e) {}
      }

      const matchesCategory = selectedCategory === 'All' || rCat === selectedCategory;
      
      // 검색어 필터
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        r.name.toLowerCase().includes(searchLower) || 
        (r.tableName && r.tableName.toLowerCase().includes(searchLower)) ||
        (r.description && r.description.toLowerCase().includes(searchLower));

      return matchesCategory && matchesSearch;
    });
  }, [reports, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <main className="max-w-[1600px] mx-auto px-8 md:px-12 pt-6 pb-12 space-y-12 w-full overflow-y-auto">
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
            
            {/* Upcoming Schedule Widget (NEW) */}
            <UpcomingEventsWidget events={events} />

            {/* Smart Toolbox (Search & Filters) */}
            <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                    <Filter size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">지능형 탐색</h2>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">키워드 또는 카테고리로 테이블을 검색하세요.</p>
                  </div>
                </div>

                <div className="relative flex-1 lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="테이블 이름, 설명 또는 DB 식별자로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Category Chips */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      selectedCategory === cat 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {selectedCategory === cat && <Check size={12} />}
                    {cat}
                  </button>
                ))}
              </div>
            </section>


            {/* Reports List */}
            <section className="max-w-[1600px] mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-blue-600" />
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{isStaff ? 'My Workspace' : 'MY DB Repository'}</h2>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Matching Results: <span className="text-blue-600 text-sm ml-1">{filteredReports.length}</span> / {reports.length}
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredReports.map((report: any) => {
                   const rCat = report.category || (report.uiConfig ? JSON.parse(report.uiConfig).category : 'Uncategorized');
                   
                   return (
                    <div key={report.id} className="relative group bg-white border border-slate-100 rounded-[32px] hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden">
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl transition-all duration-500 ${
                              report.isFinanceTable ? 'bg-indigo-50 text-indigo-600' :
                              report.isSystemTable ? 'bg-purple-50 text-purple-600' :
                              report.isDirectTable ? 'bg-slate-50 text-slate-600' :
                              (isStaff ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 shadow-sm')
                            }`}>
                            {report.isFinanceTable ? <Wallet size={24} /> :
                              report.isSystemTable ? <Database size={24} /> :
                              report.isDirectTable ? <Database size={24} /> :
                                (isStaff ? <ShieldCheck size={24} /> : <FileSpreadsheet size={24} />)}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                              <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">
                                {rCat}
                              </span>
                              <div className="flex items-center gap-2">
                                  {report.isReadOnly && (
                                    <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-rose-100">
                                      Locked
                                    </span>
                                  )}
                                  {!isStaff && !report.isReadOnly && <DeleteReportButton reportId={report.id} reportName={report.name} />}
                              </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-6">
                          <h3 className="text-lg font-bold text-slate-900 truncate leading-snug group-hover:text-blue-600 transition-colors">
                            {report.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-1 font-medium">
                            {report.description || 'No description available for this table.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            <span className="text-blue-600">ID:</span> {report.tableName}
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 rounded-xl text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                            {report._count?.rows ?? '0'} Rows
                          </div>
                        </div>

                        <Link
                          href={
                              report.isSystemTable && report.id === 'user' ? '/users' :
                              (report.isSystemTable || report.isDirectTable) ? `/report/${report.id}` :
                                (isStaff ? `/report/${report.id}/input` : `/report/${report.id}`)
                          }
                          className={`flex items-center justify-center w-full py-4 px-6 font-black rounded-2xl transition-all text-xs uppercase tracking-[0.2em] border shadow-sm ${
                              report.isSystemTable ? 'bg-purple-600 text-white hover:bg-slate-900 border-purple-600 shadow-purple-200' 
                              : (isStaff ? 'bg-amber-600 text-white hover:bg-slate-900 border-amber-600 shadow-amber-200' : 'bg-white text-blue-600 border-blue-50 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-slate-100')
                            }`}
                        >
                          {
                            report.isSystemTable && report.id === 'user' ? 'Manage Users' :
                            report.isSystemTable ? 'System View' :
                            report.isDirectTable ? 'Raw View' :
                              (isStaff ? 'Open Entry' : 'Open Explorer')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
                
                {filteredReports.length === 0 && (
                  <div className="col-span-full py-32 bg-slate-50 border border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center text-slate-400">
                    <Search size={64} className="mb-6 opacity-10" />
                    <p className="text-base font-bold text-slate-500 mb-2">검색 결과가 없습니다.</p>
                    <p className="text-sm font-medium opacity-60">다른 키워드나 카테고리를 선택해 보세요.</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                      className="mt-6 px-6 py-3 bg-white text-blue-600 text-xs font-black uppercase tracking-widest rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all"
                    >
                      필터 초기화
                    </button>
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
