import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { getAllNotificationsAction } from '@/app/actions/notification';
import { redirect } from 'next/navigation';
import { NotificationsClient } from '@/components/workspace/NotificationsClient';

export default async function NotificationsPage() {
    const session = await getSessionAction();
    if (!session) {
        redirect('/login');
    }

    const notifications = await getAllNotificationsAction();

    return <NotificationsClient notifications={notifications} />;
}
