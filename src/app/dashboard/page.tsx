import React from 'react';
import { getSessionAction, getPinnedChartsAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Compass, Star, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import GalleryClient from './GalleryClient';

export default async function ReportGalleryPage() {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  const pinnedCharts = await getPinnedChartsAction();

  return (
    <div className="flex-1 overflow-y-auto">
      <main className="max-w-[1600px] mx-auto p-8 md:p-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               My Finalized Insights
               <Sparkles className="text-blue-500" />
            </h1>
            <p className="text-slate-500 font-medium mt-2">분석 스튜디오에서 완성하여 핀으로 고정한 핵심 차트 리포트입니다.</p>
          </div>
          <Link 
            href="/dashboard/studio" 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} />
            새 분석 도구 시작하기
          </Link>
        </div>

        {pinnedCharts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <ImageIcon size={40} className="text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">갤러리가 비어 있습니다</h2>
            <p className="text-slate-400 font-medium max-w-sm">Data Analysis Studio에서 차트를 분석하고 핀 아이콘을 눌러 이곳에 나만의 리포트를 구성해 보세요.</p>
          </div>
        ) : (
          <GalleryClient initialCharts={pinnedCharts} />
        )}
      </main>
      
      <footer className="max-w-[1600px] mx-auto px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; 2026 Interactive Report Gallery &bull; Final Insights
      </footer>
    </div>
  );
}
