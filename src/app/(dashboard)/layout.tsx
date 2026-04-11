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
  const deptRes = await queryTable('department', { orderBy: 'name' });
  const departments = Array.isArray(deptRes) ? deptRes : (deptRes?.rows || []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <NavigationSidebar user={user} departments={departments} />
      <div className="flex-1 ml-72 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
