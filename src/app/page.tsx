import React from 'react';
import prisma from '@/lib/prisma';
import { deleteReportAction } from './actions';
import DeleteReportButton from '@/components/DeleteReportButton';
import Link from 'next/link';
import { FileSpreadsheet, User, LayoutDashboard, Trash2 } from 'lucide-react';
import NewTableSection from '@/components/NewTableSection';

export default async function DashboardPage() {
  // Simple internal simulation: Assume a default user for now
  let user = await prisma.user.findUnique({ where: { username: 'admin_user' } });
  if (!user) {
    user = await prisma.user.create({
      data: { username: 'admin_user', role: 'ADMIN' }
    });
  }

  const reports = await prisma.report.findMany({
    where: { isDeleted: false },
    include: { _count: { select: { rows: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My DB</h1>
          </div>
          <Link 
            href="/archive" 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-xs font-black text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
          >
            <Trash2 size={14} />
            DELETED TABLES
          </Link>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
          <User size={18} className="text-blue-500" />
          <span>{user.username} (관리자)</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-16">
        <NewTableSection userId={user.id} />

        {/* Reports List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">My Tables</h2>
            </div>
            <span className="text-sm text-gray-500">총 {reports.length}개</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report: any) => (
              <div key={report.id} className="relative group bg-white border rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-700 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileSpreadsheet size={20} />
                    </div>
                    <DeleteReportButton reportId={report.id} reportName={report.name} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{report.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase">{report.sheetName || 'Sheet'}</span>
                    <span>•</span>
                    <span>{report._count.rows}개의 데이터</span>
                  </div>
                  <Link 
                    href={`/report/${report.id}`}
                    className="block w-full text-center py-2.5 px-4 bg-gray-50 text-blue-600 font-semibold rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-50"
                  >
                    View Table
                  </Link>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="col-span-full py-20 bg-white border border-dashed rounded-3xl flex flex-col items-center justify-center text-gray-400">
                <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">관리 중인 보고서가 없습니다. 엑셀 파일을 업로드해 보세요.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
