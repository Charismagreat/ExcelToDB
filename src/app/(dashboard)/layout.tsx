import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import NavigationSidebar from '@/components/NavigationSidebar';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';
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

  return (
    <DashboardLayoutClient 
      sidebar={<NavigationSidebar user={user} />}
    >
      {children}
    </DashboardLayoutClient>
  );
}
