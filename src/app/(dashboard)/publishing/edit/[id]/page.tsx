import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { getMicroAppProjectAction } from '@/app/actions/micro-app';
import { redirect, notFound } from 'next/navigation';
import { MicroAppStudio } from '@/components/publishing/MicroAppStudio';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default async function EditProjectPage(props: EditProjectPageProps) {
  const params = await props.params;
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  const project = await getMicroAppProjectAction(params.id);
  if (!project) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <MicroAppStudio project={project} user={user} />
    </div>
  );
}
