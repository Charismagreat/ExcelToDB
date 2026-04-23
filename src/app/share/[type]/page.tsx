import React from 'react';
import { SmartChart } from '@/components/SmartChart';
import { getPinnedChartsAction } from '@/app/actions/ai';
import { notFound } from 'next/navigation';

export default async function SharedChartPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const allCharts = await getPinnedChartsAction();
  
  // 기존 [id] 슬러그가 [type]으로 변경됨
  const chartData = allCharts.find((c: any) => c.id === type);

  if (!chartData) {
    notFound();
  }

  // 이 페이지는 Public 으로 보일 것이므로 여백과 중앙 정렬 처리
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Shared Insight</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">이 차트는 FinanceHub 플랫폼에서 공유되었습니다.</p>
        </div>
        
        <div className="shadow-2xl shadow-blue-900/10 rounded-[40px]">
          <SmartChart 
            config={chartData.config} 
            refreshedAt={chartData.refreshedAt || chartData.updatedAt}
            chartId={chartData.id}
          />
        </div>
      </div>
    </div>
  );
}
