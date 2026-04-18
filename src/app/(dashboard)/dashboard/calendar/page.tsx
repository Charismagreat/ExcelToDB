import React from 'react';
import PageHeader from '@/components/PageHeader';
import { Calendar } from 'lucide-react';
import { getCalendarEvents } from '@/lib/services/calendar-service';
import FullCalendarView from '@/components/calendar/FullCalendarView';

/**
 * 🗓️ System Calendar Page (Dashboard/Admin)
 */
export default async function CalendarPage() {
  // 1. Fetch data from service (Admin role sees everything)
  const events = await getCalendarEvents({
    userRole: 'ADMIN'
  });

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <PageHeader 
        title="SYSTEM CALENDAR"
        description="전사 공지사항, 프로젝트 마감 기한 및 사원들의 주요 일정을 한눈에 관리하세요."
        icon={Calendar}
      />

      <div className="mt-8">
        <FullCalendarView 
          events={events} 
          isAdmin={true} 
        />
      </div>
      
      {/* Legend / Key */}
      <div className="mt-8 flex flex-wrap gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest w-full mb-2">Calendar Legend</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-bold text-slate-600">업무 마감 (TASK)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
          <span className="text-xs font-bold text-slate-600">전사 공지 (NOTICE)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
          <span className="text-xs font-bold text-slate-600">회사 행사 (EVENT)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
          <span className="text-xs font-bold text-slate-600">휴가/부재 (VACATION)</span>
        </div>
      </div>
    </div>
  );
}
