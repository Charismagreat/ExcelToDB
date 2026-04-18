import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { getCalendarEvents } from '@/lib/services/calendar-service';
import MobileCalendarView from '@/components/calendar/MobileCalendarView';

/**
 * 🗓️ Workspace Calendar Page (Employee App)
 */
export default async function WorkspaceCalendarPage() {
  // 1. Check Session
  const session = await getSessionAction();
  if (!session) {
    redirect('/login');
  }

  // 2. Fetch Filtered Data
  const events = await getCalendarEvents({
    userId: session.id,
    userRole: session.role,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header (Mobile Style) */}
      <div className="px-2 mb-4">
        <h3 className="font-black text-gray-900 border-l-4 border-blue-600 pl-3 uppercase">
          전사 캘린더
        </h3>
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 rounded-[32px] overflow-hidden border border-slate-100 shadow-sm bg-white">
        <MobileCalendarView events={events} />
      </div>

      {/* Legend / Info */}
      <div className="mt-4 px-4 py-3 bg-blue-50/50 rounded-2xl flex items-center justify-between">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
          💡 공지와 업무가 자동으로 표시됩니다.
        </span>
      </div>
    </div>
  );
}
