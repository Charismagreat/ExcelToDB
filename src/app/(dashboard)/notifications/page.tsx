import React from 'react';
import { Metadata } from 'next';
import { Bell } from 'lucide-react';
import BusinessWorkflowHub from '@/components/NotificationPageClient';
import { getAllNotificationsAction, getAdminNotificationLogsAction } from '@/app/actions/notification';
import { getSessionAction } from '@/app/actions/auth';
import { PageHeader } from '@/components/PageHeader';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: '전사 업무 관제 허브 | Won Conductor',
    description: '전사 사원들의 업무 흐름과 시스템 상태를 실시간으로 모니터링합니다.',
};

export default async function NotificationsPage() {
    const user = await getSessionAction();
    if (!user) {
        redirect('/login');
    }

    // [DIAGNOSTIC] Verify module resolution before rendering
    console.log('🔍 [RUNTIME DIAGNOSTIC] BusinessWorkflowHub component type:', typeof BusinessWorkflowHub);
    const isComponentValid = BusinessWorkflowHub && (typeof BusinessWorkflowHub === 'function' || typeof BusinessWorkflowHub === 'object');

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
                    title="Enterprise Workflow Hub"
                    description={user.role === 'ADMIN' 
                        ? "전사 업무 여정을 실시간으로 관제하고 진행 상태를 모니터링합니다." 
                        : "본인에게 할당된 업무 흐름과 실시간 알림을 확인합니다."}
                    icon={Bell}
                />

                {!isComponentValid ? (
                    <div className="p-20 bg-red-50 border-2 border-dashed border-red-200 rounded-[32px] text-center">
                        <p className="text-red-600 font-black uppercase tracking-tight">Component Resolution Failure</p>
                        <p className="text-red-400 text-xs mt-2 font-bold">BusinessWorkflowHub is undefined. Please check export/import consistency.</p>
                    </div>
                ) : (
                    <BusinessWorkflowHub 
                        user={user}
                        initialNotifications={myNotifications} 
                        initialAdminLogs={adminLogs}
                    />
                )}
            </main>
        </div>
    );
}
