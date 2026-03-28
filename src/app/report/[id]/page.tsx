import React from 'react';
import prisma from '@/lib/prisma';
import DynamicTable from '@/components/DynamicTable';
import DynamicForm from '@/components/DynamicForm';
import { addRowAction } from '../../actions';
import Link from 'next/link';
import { ArrowLeft, Plus, User } from 'lucide-react';
import ReportHeader from '@/components/ReportHeader';
import BulkUpload from '@/components/BulkUpload';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Simple internal simulation: Assume a default user
  let user = await prisma.user.findUnique({ where: { username: 'admin_user' } });

  const report = await prisma.report.findUnique({
    where: { id },
    include: { rows: { orderBy: { id: 'desc' } } }
  });

  if (!report) {
    return <div className="p-20 text-center text-gray-500">보고서를 찾을 수 없습니다.</div>;
  }

  const columns = JSON.parse(report.columns);
  const rows = report.rows.map((r: { data: string; id: string }) => ({ ...JSON.parse(r.data), id: r.id }));
  const isOwner = report.ownerId === user?.id;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={18} />
          대시보드로 돌아가기
        </Link>
        <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
          <User size={18} className="text-blue-500" />
          <span>{user?.username} ({isOwner ? '관리자' : '조회자'})</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        <ReportHeader 
            reportId={report.id}
            initialName={report.name}
            sheetName={report.sheetName || '없음'}
            createdAt={report.createdAt.toLocaleDateString()}
            isOwner={isOwner}
            initialColumns={columns}
        />

        {isOwner && (
            <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Plus size={20} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-800">새로운 데이터 추가</h2>
                </div>
                
                <div className="space-y-8">
                    {/* 데이터 직접 추가 섹션 */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-blue-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                방법 1. 직접 하나씩 입력하기
                            </h3>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Manual Entry</span>
                        </div>
                        <div className="p-6">
                            <DynamicForm 
                                columns={columns} 
                                onSubmit={async (data: any) => {
                                    'use server';
                                    await addRowAction(id, data);
                                }} 
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-gray-200 flex-1" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">또는 (OR)</span>
                        <div className="h-px bg-gray-200 flex-1" />
                    </div>

                    {/* 엑셀 일괄 추가 섹션 */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-green-50/50 px-6 py-3 border-b border-green-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-green-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                방법 2. 엑셀 파일로 한꺼번에 올리기
                            </h3>
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-tighter">Bulk Excel Upload</span>
                        </div>
                        <div className="p-6">
                            <BulkUpload reportId={id} columns={columns} />
                        </div>
                    </div>
                </div>
            </section>
        )}

        <section className="space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">데이터 목록 ({rows.length})</h2>
            </div>
            <DynamicTable 
                reportId={id} 
                columns={columns} 
                data={rows} 
                isOwner={isOwner} 
            />
        </section>
      </main>
    </div>
  );
}
