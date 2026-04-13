import React from 'react';
import { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { NotificationPageClient } from '@/components/NotificationPageClient';
import { getAllNotificationsAction, getAdminNotificationLogsAction } from '@/app/actions/notification';
import { getSessionAction } from '@/app/actions/auth';
import { PageHeader } from '@/components/PageHeader';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Alert Center | Won Conductor',
    description: '시스템 알림 및 전사 업무 배정 내역을 관리합니다.',
};

export default async function NotificationsPage() {
    const user = await getSessionAction();
    if (!user) {
        redirect('/login');
    }

    // 기본 본인 알림 로드
    const myNotifications = await getAllNotificationsAction();
    
    // 관리자인 경우 전사 로그 로드
    let adminLogs: any[] = [];
    if (user.role === 'ADMIN') {
        adminLogs = await getAdminNotificationLogsAction();
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <main className="max-w-[1600px] mx-auto p-8 md:p-12 space-y-12">
                <PageHeader 
                    title="Alert Center"
                    description={user.role === 'ADMIN' 
                        ? "나의 알림 관리 및 전사 사원들의 업무 지시 현황을 모니터링할 수 있습니다." 
                        : "나에게 배정된 업무 알림과 시스템 메시지를 확인합니다."}
                    icon={Bell}
                />

                <NotificationPageClient 
                    user={user}
                    initialNotifications={myNotifications} 
                    initialAdminLogs={adminLogs}
                />
            </main>
        </div>
    );
}
