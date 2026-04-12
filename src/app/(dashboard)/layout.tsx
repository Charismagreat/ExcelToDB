import React from 'react';
import { getSessionAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import NavigationSidebar from '@/components/NavigationSidebar';
import { queryTable } from '@/egdesk-helpers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  // VIEWER 권한은 대시보드 접근 불가 -> 워크스페이스로 리다이렉트
  if (user.role === 'VIEWER') {
    redirect('/workspace');
  }

  // Fetch all departments for sidebar
  let departments: any[] = [];
  try {
    const deptRes = await queryTable('department', { orderBy: 'name' });
    departments = Array.isArray(deptRes) ? deptRes : (deptRes?.rows || []);
  } catch (err) {
    console.error('[Dashboard Layout] Failed to fetch departments:', err);
    // 테이블이 없거나 500 오류가 나도 레이아웃은 렌더링되도록 빈 배열 유지
  }

  /* 시스템 테이블 건정성 보장 (알림, 워크플로우 등 신규 테이블 생성)
  // 데이터 복구 중 무한 초기화 방지를 위해 잠시 주석 처리
  const { ensureSystemTables } = await import('@/app/actions/system');
  ensureSystemTables().catch(console.error);
  */

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <NavigationSidebar user={user} departments={departments} />
      <div className="flex-1 ml-72 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
