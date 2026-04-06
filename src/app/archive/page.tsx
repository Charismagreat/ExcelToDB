import React from 'react';
import { queryTable, aggregateTable } from '@/egdesk-helpers';
import Link from 'next/link';
import { FileSpreadsheet, ArrowLeft, Archive } from 'lucide-react';
import ArchiveActions from '@/components/ArchiveActions';

export default async function ArchivePage() {
  const rawAllDeletedReports = await queryTable('report', {
    limit: 1000,
    orderBy: 'deletedAt',
    orderDirection: 'DESC'
  });
  const allDeletedReports = rawAllDeletedReports.filter((r: any) => String(r.isDeleted) === '1');

  const deletedReports = await Promise.all(allDeletedReports.map(async (r: any) => {
    const rowCountResult = await aggregateTable('report_row', 'id', 'COUNT', { 
        filters: { reportId: r.id } 
    });
    return {
        ...r,
        _count: { rows: Number(rowCountResult) || 0 }
    };
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-gray-800 p-2 rounded-lg text-white">
              <Archive size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Deleted Tables</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-gray-400" />
            <h2 className="text-sm font-black text-gray-600 uppercase tracking-widest">Archive List</h2>
          </div>
          <span className="text-xs font-bold text-gray-400">총 {deletedReports.length}개</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedReports.map((report: any) => (
            <div key={report.id} className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-gray-50 text-gray-400 p-3 rounded-2xl">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div className="bg-red-50 text-red-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                    DELETED
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{report.name}</h3>
                <p className="text-[10px] text-gray-400 font-medium mb-6">
                    삭제일: {report.deletedAt ? new Date(report.deletedAt).toLocaleString() : '-'}
                </p>

                <div className="mt-6">
                  <ArchiveActions reportId={report.id} />
                </div>
              </div>
            </div>
          ))}

          {deletedReports.length === 0 && (
            <div className="col-span-full py-32 bg-white border border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center text-gray-300">
              <Archive size={64} className="mb-6 opacity-10" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">Archive is Empty</p>
              <p className="text-[10px] font-medium mt-2">삭제된 테이블이 여기에 보관됩니다</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
