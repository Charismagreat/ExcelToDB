import React from 'react';
import { getSessionAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import NavigationSidebar from '@/components/NavigationSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <NavigationSidebar user={user} />
      <div className="flex-1 ml-72 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
