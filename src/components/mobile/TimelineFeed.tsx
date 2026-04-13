'use client';

import React from 'react';
import { 
  FileText, 
  MapPin, 
  TrendingUp, 
  UserPlus, 
  MoreVertical, 
  MessageSquare, 
  Share2,
  Image
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineItem {
  id: string;
  type: 'OCR' | 'VISIT' | 'FINANCE' | 'SYSTEM';
  title: string;
  description: string;
  timestamp: string;
  image?: string;
  status?: string;
}

const mockData: TimelineItem[] = [
  {
    id: '1',
    type: 'OCR',
    title: '영수증 인식 완료',
    description: '서울 식당 - 점심 식사비 18,000원이 추출되었습니다.',
    timestamp: '15분 전',
    status: '검수 필요'
  },
  {
    id: '2',
    type: 'VISIT',
    title: '고객사 미팅 종료',
    description: '(주)원컨덕터 박민수 부장님과 미팅이 종료되었습니다.',
    timestamp: '1시간 전',
    status: '회의록 작성'
  },
  {
    id: '3',
    type: 'FINANCE',
    title: '미수금 위험 감지',
    description: '거래처 A사 연체 30일 경과. 위험도가 높음으로 격상되었습니다.',
    timestamp: '3시간 전',
    status: '관리자 보고'
  }
];

export function TimelineFeed() {
  return (
    <div className="px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black tracking-tight">업무 타임라인</h3>
        <button className="text-[10px] font-black text-primary uppercase tracking-widest border-b-2 border-primary/20 pb-0.5">
          모두 보기
        </button>
      </div>

      <div className="space-y-4">
        {mockData.map((item) => (
          <div key={item.id} className="relative group bg-card border rounded-[36px] overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                    item.type === 'OCR' ? "bg-blue-500/10 text-blue-500" :
                    item.type === 'VISIT' ? "bg-indigo-500/10 text-indigo-500" :
                    "bg-rose-500/10 text-rose-500"
                  )}>
                    {item.type === 'OCR' ? <FileText size={20} /> :
                     item.type === 'VISIT' ? <MapPin size={20} /> :
                     <TrendingUp size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
                    <span className="text-[10px] text-foreground/40 font-bold">{item.timestamp}</span>
                  </div>
                </div>
                <button className="p-2 text-foreground/30 hover:text-foreground transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              <p className="text-sm text-foreground/70 font-medium leading-relaxed">
                {item.description}
              </p>

              {item.status && (
                <div className="pt-2 flex items-center justify-between border-t border-dashed">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Action: {item.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-foreground/40 hover:text-primary transition-colors">
                      <MessageSquare size={16} />
                    </button>
                    <button className="p-2 text-foreground/40 hover:text-primary transition-colors">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
