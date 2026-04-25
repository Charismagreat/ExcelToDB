'use client';

import React, { useState } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Download, 
  Filter, 
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

interface GenericReportProps {
  data: any;
  mapping: any;
  uiSettings: any;
  appName: string;
}

export function GenericReport({ data, mapping, uiSettings, appName }: GenericReportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const rawRows = data?.transactions || data || [];
  
  // AI 매핑 설정이 있으면 해당 컬럼만 추출, 없으면 전체 추출
  const columns = React.useMemo(() => {
    if (mapping && mapping.length > 0) {
      return mapping.map((m: any) => ({
        name: m.sourceColumn,
        displayName: m.displayName || m.sourceColumn,
        type: m.type
      }));
    }
    return data?.columns || (rawRows.length > 0 ? Object.keys(rawRows[0]).map(k => ({ name: k, displayName: k })) : []);
  }, [mapping, data, rawRows]);

  // 테마 컬러 매핑
  const themeColors: Record<string, string> = {
    blue: 'blue-600',
    emerald: 'emerald-600',
    rose: 'rose-600',
    slate: 'slate-700',
    indigo: 'indigo-600',
    amber: 'amber-600'
  };
  
  const themeColor = themeColors[uiSettings?.theme] || 'blue-600';
  const themeBg = themeColor.replace('600', '50').replace('700', '50');
  const themeRing = themeColor.replace('600', '500/5').replace('700', '500/5');

  const filteredRows = rawRows.filter((row: any) => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatValue = (val: any, type?: string) => {
    if (val === null || val === undefined) return '-';
    if (type === 'amount' || typeof val === 'number') {
      return new Intl.NumberFormat('ko-KR').format(val);
    }
    return String(val);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-700">
      {/* Search & Action Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
        <div className="relative w-full sm:w-96 group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-${themeColor} transition-colors`} size={18} />
          <input 
            type="text" 
            placeholder="데이터 내 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-${themeRing} focus:border-${themeColor} transition-all outline-none font-medium`}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={14} /> 필터
          </button>
          <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-${themeColor} text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-${themeColor}/10`}>
            <Download size={14} /> 내보내기
          </button>
        </div>
      </div>

      {/* Data Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <tr>
              {columns.map((col: any, idx: number) => (
                <th key={`${col.name}-${idx}`} className="px-6 py-4">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.displayName}</span>
                    <ArrowUpDown size={12} className={`text-slate-200 group-hover:text-${themeColor} transition-colors`} />
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <TableIcon size={48} className="text-slate-300" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row: any, rowIdx: number) => (
                <tr key={rowIdx} className={`hover:bg-${themeBg}/30 transition-colors group`}>
                  {columns.map((col: any, colIdx: number) => (
                    <td key={`${col.name}-${colIdx}`} className="px-6 py-4">
                      <span className={`text-sm font-bold ${col.type === 'amount' ? 'text-slate-900' : 'text-slate-700'}`}>
                        {formatValue(row[col.name], col.type)}
                      </span>
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <button className="p-2 text-slate-200 hover:text-slate-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 sm:p-6 border-t border-slate-50 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing {Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredRows.length, currentPage * itemsPerPage)} of {filteredRows.length} entries
        </p>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`p-2 text-slate-400 hover:text-${themeColor} disabled:opacity-30 transition-colors`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1 px-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button 
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === pageNum 
                    ? `bg-${themeColor} text-white shadow-lg shadow-${themeColor}/20` 
                    : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 text-slate-400 hover:text-${themeColor} disabled:opacity-30 transition-colors`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
