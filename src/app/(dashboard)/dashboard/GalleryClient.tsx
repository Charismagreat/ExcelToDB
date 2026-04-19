'use client';

import React, { useState } from 'react';
import { SmartChart } from '@/components/SmartChart';
import { deletePinnedChartAction, refreshIndividualChartAction, updateChartLayoutAction } from '@/app/actions/ai';
import { useRouter } from 'next/navigation';

interface GalleryClientProps {
  initialCharts: any[];
}

export function GalleryClient({ initialCharts }: GalleryClientProps) {
  const router = useRouter();
  const [charts, setCharts] = useState(initialCharts);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // 컴포넌트 마운트 시 자동 새로고침 로직 제거 
  // (서버 사이드에서 getPinnedChartsAction이 이미 최신 데이터를 가져오므로 중복 호출 방지)
  /*
  React.useEffect(() => {
    initialCharts.forEach(chart => {
      if (chart.config?.refreshMetadata) {
        handleRefresh(chart.id);
      }
    });
  }, []);
  */

  const handleDelete = async (id: string) => {
    if (!confirm('이 차트를 갤러리에서 삭제하시겠습니까?')) return;
    const res = await deletePinnedChartAction(id);
    if (res.success) {
      setCharts(charts.filter(c => c.id !== id));
      router.refresh();
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await refreshIndividualChartAction(id);
      if (res.success && res.item) {
        setCharts(charts.map(c => c.id === id ? res.item : c));
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleLayoutChange = async (id: string, layout: any) => {
    // 낙관적 업데이트
    setCharts(charts.map(c => c.id === id ? { ...c, layout } : c));
    try {
      await updateChartLayoutAction(id, layout);
    } catch (e) {
      console.error('Layout update failed:', e);
      // 실패 시 원래대로 복구하거나 알림
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {charts.map((p: any) => (
        <div 
          key={p.id} 
          className={p.layout?.span === 'full' ? 'lg:col-span-2' : 'lg:col-span-1'}
        >
          <SmartChart 
            config={p.config} 
            isPinned={true}
            chartId={p.id}
            onDelete={() => handleDelete(p.id)}
            onRefresh={() => handleRefresh(p.id)}
            refreshedAt={p.refreshedAt || p.updatedAt}
            isRefreshing={refreshingId === p.id}
            layout={p.layout}
            onLayoutChange={(newLayout) => handleLayoutChange(p.id, newLayout)}
          />
        </div>
      ))}
    </div>
  );
}
