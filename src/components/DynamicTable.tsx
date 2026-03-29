'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, FilterX, FileDown, Table as TableIcon, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { deleteRowsAction } from '@/app/actions';
import * as XLSX from 'xlsx';

interface Column {
  name: string;
  type: string;
}

interface DynamicTableProps {
  reportId: string;
  columns: Column[];
  data: any[];
  isOwner?: boolean;
}

export default function DynamicTable({ reportId, columns, data, isOwner = false }: DynamicTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [isExportingMenuOpen, setIsExportingMenuOpen] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 검색어나 정렬이 바뀌면 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  // 1. 데이터 필터링 및 정렬
  const processedData = useMemo(() => {
    let filtered = [...data];

    // 검색 필터링
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(row => 
            Object.values(row).some(val => 
                val?.toString().toLowerCase().includes(lowerSearch)
            )
        );
    }

    // 정렬 처리
    if (sortConfig.key && sortConfig.direction) {
        filtered.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            
            const result = aVal > bVal ? 1 : -1;
            return sortConfig.direction === 'asc' ? result : -result;
        });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // 2. 페이지네이션 계산
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const exportToExcel = () => {
    const exportData = processedData.map(row => {
        const rowObj: any = {};
        columns.forEach(col => {
            let val = row[col.name];
            if (col.type === 'date' && typeof val === 'number') {
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                val = date.toISOString().split('T')[0];
            }
            rowObj[col.name] = val;
        });
        return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `export_${reportId}_${new Date().getTime()}.xlsx`);
    setIsExportingMenuOpen(false);
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.name).join(',');
    const csvRows = processedData.map(row => 
        columns.map(col => {
            let val = row[col.name]?.toString() || '';
            if (col.type === 'date' && typeof row[col.name] === 'number') {
                const date = new Date(Math.round((Number(row[col.name]) - 25569) * 86400 * 1000));
                val = date.toISOString().split('T')[0];
            }
            return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
    );
    const csvContent = "\uFEFF" + [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${reportId}_${new Date().getTime()}.csv`;
    link.click();
    setIsExportingMenuOpen(false);
  };

  const toggleSort = (key: string) => {
    setSortConfig(prev => {
        if (prev.key === key) {
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key: '', direction: null };
        }
        return { key, direction: 'asc' };
    });
  };

  const toggleSelectAll = () => {
    // 페이지네이션이 있으므로 현재 페이지의 아이템만 선택하거나 전체를 선택하는 기획이 필요함. 
    // 여기서는 직관성을 위해 현재 '필터링된 전체 데이터'를 선택하는 방식을 유지하되, 
    // UI상으로는 현재 페이지 데이터만 우선 선택 제안할 수도 있음.
    if (selectedIds.length === processedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedData.map(row => row.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length}개의 데이터를 삭제하시겠습니까?`)) return;

    setIsDeleting(true);
    try {
      await deleteRowsAction(reportId, selectedIds);
      setSelectedIds([]);
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="데이터 내 검색..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
            <div className="relative">
                <button
                    onClick={() => setIsExportingMenuOpen(!isExportingMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 font-black rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all text-[11px] uppercase"
                >
                    <FileDown size={14} />
                    내보내기 (Export)
                </button>
                {isExportingMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <button onClick={exportToExcel} className="w-full px-4 py-3 text-left text-xs font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 border-b border-gray-50">
                            <TableIcon size={14} /> 엑셀 파일 (.xlsx)
                        </button>
                        <button onClick={exportToCSV} className="w-full px-4 py-3 text-left text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                            <FileText size={14} /> CSV 파일 (.csv)
                        </button>
                    </div>
                )}
            </div>
            
            {isOwner && selectedIds.length > 0 && (
               <div className="bg-blue-50/50 flex items-center gap-1 pl-3 pr-1 py-1 rounded-2xl border border-blue-100/50 animate-in fade-in slide-in-from-right-4 duration-300">
                 <span className="text-[10px] font-black text-blue-700 uppercase mr-2">{selectedIds.length} SELECTED</span>
                 <button
                   onClick={handleDeleteSelected}
                   disabled={isDeleting}
                   className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[11px] font-black rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                 >
                   <Trash2 size={12} />
                   삭제
                 </button>
               </div>
            )}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-[24px] shadow-sm bg-white min-h-[400px]">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              {isOwner && (
                <th className="px-6 py-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={processedData.length > 0 && selectedIds.length === processedData.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => toggleSort(col.name)}
                  className={`
                    px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest cursor-pointer group transition-all
                    ${sortConfig.key === col.name ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {col.name}
                    <span className={`transition-all ${sortConfig.key === col.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {sortConfig.key === col.name ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                            <ArrowUpDown size={12} />
                        )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className={`
                    hover:bg-blue-50/20 transition-colors group
                    ${selectedIds.includes(row.id) ? 'bg-blue-50/40' : ''}
                `}
              >
                {isOwner && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const val = row[col.name];
                  let displayValue = val?.toString() || '-';
                  
                  if (col.type === 'number' || col.type === 'currency') {
                      displayValue = val !== null && val !== undefined ? val.toLocaleString() : '-';
                  } else if (col.type === 'date' && val) {
                      if (typeof val === 'number') {
                          try {
                              const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                              displayValue = date.toISOString().split('T')[0];
                          } catch (e) {
                              displayValue = val.toString();
                          }
                      } else {
                          displayValue = val.toString();
                      }
                  }

                  return (
                    <td key={col.name} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (isOwner ? 1 : 0)} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FilterX className="text-gray-200" size={48} />
                    <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">
                       {searchTerm ? '검색 결과가 없습니다' : '표시할 데이터가 없습니다'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 UI */}
      {processedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">목록 개수</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-xs font-black text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}개씩 보기</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            >
              <ChevronsLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-black text-blue-600">{currentPage}</span>
              <span className="text-xs font-bold text-gray-300">/</span>
              <span className="text-xs font-bold text-gray-400">{totalPages}</span>
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            >
              <ChevronsRight size={18} />
            </button>
          </div>

          <div className="hidden sm:block">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total {processedData.length} records
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
