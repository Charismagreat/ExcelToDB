import prisma from '@/lib/prisma';
import DynamicTable from '@/components/DynamicTable';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, User, Trash2, Edit3, Search, ArrowUpDown, ArrowUp, ArrowDown, FilterX, FileDown, Table as TableIcon, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, XCircle, ExternalLink, Eye, MoreHorizontal, Image, Mail, Phone, History as HistoryIcon } from 'lucide-react';
import { getSessionAction } from '@/app/actions';
import LogoutButton from '@/components/LogoutButton';
import ReportDetailClient from '@/components/ReportDetailClient';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 실제 세션 사용자 정보 가져오기
  const user = await getSessionAction();

  const report = await prisma.report.findUnique({
    where: { id },
    include: { rows: { orderBy: { updatedAt: 'desc' } } }
  });

  if (!report) {
    return <div className="p-20 text-center text-gray-500 font-bold">보고서를 찾을 수 없거나 삭제되었습니다.</div>;
  }

  const columns = JSON.parse(report.columns);
  const rows = report.rows.map((r: any) => ({ 
    ...JSON.parse(r.data), 
    id: r.id, 
    updatedAt: r.updatedAt,
    isDeleted: r.isDeleted,
    creatorId: r.creatorId
  }));
  const isOwner = report.ownerId === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin || user?.role === 'EDITOR';

  // 일반 사용자(VIEWER)인 경우 전용 입력 페이지로 리다이렉트
  if (user?.role === 'VIEWER' && !isOwner) {
    redirect(`/report/${id}/input`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={18} />
          My DB로 돌아가기
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
            <User size={18} className="text-blue-500" />
            <span>{user?.username || 'GUEST'} ({user?.role || 'NONE'})</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <ReportDetailClient 
            id={id}
            report={report}
            user={user}
            columns={columns}
            rows={rows}
            isOwner={isOwner}
            isAdmin={isAdmin}
            canEdit={canEdit}
      />
    </div>
  );
}
