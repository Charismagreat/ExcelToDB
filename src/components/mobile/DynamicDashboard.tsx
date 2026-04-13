'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Coffee, 
  Briefcase, 
  Home as HomeIcon,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DynamicDashboardProps {
  user: any;
}

export function DynamicDashboard({ user }: DynamicDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  
  let greeting = "오늘도 힘찬 하루 시작하세요!";
  let subGreeting = "당신의 본업에 집중하세요. 기록은 AI가 합니다.";
  let Icon = Coffee;

  if (hour >= 5 && hour < 11) {
    greeting = `${user.name}님, 좋은 아침입니다!`;
    subGreeting = "커피 한 잔과 함께 오늘의 주요 일정을 확인해 보세요.";
    Icon = Coffee;
  } else if (hour >= 11 && hour < 17) {
    greeting = "점심 시간 이후, 업무에 집중할 시간입니다.";
    subGreeting = "결재 대기 중인 문서가 3건 있습니다.";
    Icon = Briefcase;
  } else if (hour >= 17 && hour < 22) {
    greeting = "오늘 하루도 수고 많으셨습니다!";
    subGreeting = "내일의 효율적인 시작을 위해 오늘을 깔끔하게 마무리할까요?";
    Icon = HomeIcon;
  } else {
    greeting = "편안한 밤 되세요.";
    subGreeting = "오늘의 모든 업무 기록이 안전하게 저장되었습니다.";
    Icon = Clock;
  }

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Dynamic Greeting Section */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
          <Sparkles size={12} />
          PRE-ACTIVE AI
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              {greeting}
            </h2>
            <p className="text-foreground/60 text-sm font-medium leading-relaxed">
              {subGreeting}
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-[28px] flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon size={32} className="text-white" />
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-[32px] space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-tighter">Tasks</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black">12</div>
            <div className="text-[10px] font-bold text-foreground/40">오늘 완료한 할 일</div>
          </div>
        </div>

        <div className="glass p-5 rounded-[32px] space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <AlertCircle size={18} />
            </div>
            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-tighter">Pending</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-amber-500">3</div>
            <div className="text-[10px] font-bold text-foreground/40">결재 대기 중 문서</div>
          </div>
        </div>
      </section>

      {/* AI Recommendation Card */}
      <section className="relative overflow-hidden glass p-6 rounded-[40px] border border-primary/20 group animate-in slide-in-from-bottom duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/20 transition-colors" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-primary uppercase tracking-[0.15em]">AI 제안</h3>
            <p className="text-base font-bold leading-tight">
              법인카드 결제 내역 1건이 확인되었습니다.<br/>
              <span className="text-primary underline decoration-2 underline-offset-4">지출결의서</span>를 작성하시겠습니까?
            </p>
          </div>
          <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30">
            <ChevronRight size={24} />
          </div>
        </div>
      </section>
    </div>
  );
}
