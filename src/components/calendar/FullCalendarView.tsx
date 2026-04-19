'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent, CalendarEventType } from '@/lib/services/calendar-service';

interface FullCalendarViewProps {
  events: CalendarEvent[];
  isAdmin?: boolean;
}

const TYPE_COLORS: Record<CalendarEventType, string> = {
  TASK: 'bg-blue-100 text-blue-700 border-blue-200',
  NOTICE: 'bg-red-100 text-red-700 border-red-200',
  EVENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  VACATION: 'bg-green-100 text-green-700 border-green-200',
};

export default function FullCalendarView({ events, isAdmin }: FullCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const days = [];
  // Previous month padding
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr || e.date.startsWith(dateStr));
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Calendar Header */}
      <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={prevMonth}
              className="p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all active:scale-95 text-slate-400 hover:text-blue-600"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all active:scale-95 text-slate-400 hover:text-blue-600"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">{year} Archive</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {month + 1}월
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={goToToday}
            className="px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-100 transition-all active:scale-95"
          >
            Today
          </button>
          
          {isAdmin && (
            <button className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 group">
              <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">일정 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Weekdays Labels */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div key={day} className={`py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-[140px]">
        {days.map((day, idx) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const isToday = day && 
            new Date().getDate() === day && 
            new Date().getMonth() === month && 
            new Date().getFullYear() === year;

          return (
            <div 
              key={idx} 
              className={`border-r border-b border-slate-100 p-3 transition-all relative group ${!day ? 'bg-slate-50/10' : 'hover:bg-blue-50/20'}`}
            >
              {day && (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`
                      text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all
                      ${isToday ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/10' : 'text-slate-400 group-hover:text-slate-900'}
                      ${idx % 7 === 0 ? 'text-red-400' : idx % 7 === 6 ? 'text-blue-400' : ''}
                    `}>
                      {day}
                    </span>
                  </div>
                  
                  {/* Event List */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[90px] pr-1 scrollbar-hide">
                    {dayEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={`
                          px-2 py-1.5 text-[9px] font-bold rounded-lg border-l-4 shadow-sm truncate cursor-pointer
                          transition-all hover:translate-x-1 active:scale-95
                          ${TYPE_COLORS[event.type]}
                        `}
                        title={event.title}
                      >
                        {event.type === 'NOTICE' && '📢 '}{event.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
