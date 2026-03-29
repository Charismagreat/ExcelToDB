import prisma from '@/lib/prisma';
import DynamicTable from '@/components/DynamicTable';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import ReportHeader from '@/components/ReportHeader';
import ReportDataEditor from '@/components/ReportDataEditor';

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

        {isOwner && <ReportDataEditor reportId={report.id} columns={columns} />}

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
