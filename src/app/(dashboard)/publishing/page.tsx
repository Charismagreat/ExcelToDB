import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { listMicroAppsAction } from '@/app/actions/publishing';
import { listMicroAppProjectsAction } from '@/app/actions/micro-app';
import { redirect } from 'next/navigation';
import { PublishingHubClient } from '@/components/publishing/PublishingHubClient';

export const metadata = {
  title: 'APP STUDIO | CEO Dashboard',
  description: '전사 데이터를 기반으로 비즈니스 앱을 조립하고 발행합니다.',
};

export default async function PublishingHubPage() {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  const [microApps, projects] = await Promise.all([
    listMicroAppsAction(),
    listMicroAppProjectsAction()
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <PublishingHubClient initialApps={microApps} initialProjects={projects} user={user} />
    </div>
  );
}
