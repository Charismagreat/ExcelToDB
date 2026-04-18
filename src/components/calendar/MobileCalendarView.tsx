'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Bell,
  CheckCircle2,
  PartyPopper,
  PlaneTakeoff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent, CalendarEventType } from '@/lib/services/calendar-service';

interface MobileCalendarViewProps {
  events: CalendarEvent[];
}

const TYPE_CONFIG: Record<CalendarEventType, { icon: any, color: string, bg: string, label: string }> = {
  TASK: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', label: '업무' },
  NOTICE: { icon: Bell, color: 'text-red-600', bg: 'bg-red-50', label: '공지' },
  EVENT: { icon: PartyPopper, color: 'text-yellow-600', bg: 'bg-yellow-50', label: '행사' },
  VACATION: { icon: PlaneTakeoff, color: 'text-green-600', bg: 'bg-green-50', label: '휴가' },
};

export default function MobileCalendarView({ events }: MobileCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr || e.date.startsWith(dateStr));
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Month Picker */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b shadow-sm">
        <h2 className="text-xl font-black text-slate-900">
          {year}년 <span className="text-blue-600">{month + 1}월</span>
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full border">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full border">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Mini Grid */}
      <div className="bg-white px-2 pt-2 pb-4 shadow-sm">
        <div className="grid grid-cols-7 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, idx) => {
            const hasEvents = day ? getEventsForDay(day).length > 0 : false;
            const isSelected = day === selectedDay;
            const isToday = day && 
              new Date().getDate() === day && 
              new Date().getMonth() === month && 
              new Date().getFullYear() === year;

            return (
              <div key={idx} className="flex flex-col items-center justify-center p-1">
                {day && (
                  <button 
                    onClick={() => setSelectedDay(day)}
                    className={`
                      relative w-10 h-10 flex flex-col items-center justify-center rounded-2xl transition-all
                      ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'hover:bg-slate-100'}
                      ${isToday && !isSelected ? 'text-blue-600 font-black ring-2 ring-blue-100' : 'text-slate-600'}
                    `}
                  >
                    <span className="text-sm font-bold">{day}</span>
                    {hasEvents && (
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            {month + 1}월 {selectedDay}일 일정 ({selectedDayEvents.length})
          </h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event) => {
                const config = TYPE_CONFIG[event.type];
                const Icon = config.icon;
                return (
                  <div key={event.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
                    <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${config.bg} ${config.color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{event.status}</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 leading-tight mb-1">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <CalendarIcon size={48} strokeWidth={1} className="opacity-20 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">일정이 없습니다</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
