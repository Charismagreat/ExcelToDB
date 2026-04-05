'use client';

import React, { useEffect, useState } from 'react';
import { checkSyncStatusAction, repairVirtualTableAction } from '@/app/actions';
import { CheckCircle2, AlertTriangle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

interface SyncStatusBadgeProps {
  reportId: string;
}

type SyncStatus = 'loading' | 'synced' | 'mismatch' | 'no-physical' | 'error';

interface SyncData {
  status: SyncStatus;
  virtualCount?: number;
  physicalCount?: number;
  diff?: number;
  message?: string;
}

export default function SyncStatusBadge({ reportId }: SyncStatusBadgeProps) {
  const [data, setData] = useState<SyncData>({ status: 'loading' });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const fetchStatus = () => {
    checkSyncStatusAction(reportId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setData({ status: 'error', message: '확인 중 오류' });
      });
  };

  useEffect(() => {
    fetchStatus();
  }, [reportId]);

  const handleRepair = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('물리 테이블을 기준으로 가상 DB 데이터를 강제로 맞추시겠습니까?\n물리에 없는 가상 데이터는 영구 삭제됩니다.')) return;

    setIsRepairing(true);
    try {
      const result = await repairVirtualTableAction(reportId);
      alert(result.message);
      fetchStatus(); // 상태 재조회
    } catch (err: any) {
      alert(err.message || '정합 중 오류가 발생했습니다.');
    } finally {
      setIsRepairing(false);
    }
  };

  if (data.status === 'no-physical') {
    // 물리적 테이블이 없는 일반 가상 보고서는 표시하지 않음
    return null;
  }

  if (data.status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400">
        <Loader2 size={10} className="animate-spin" />
        Checking Sync...
      </div>
    );
  }

  const isSynced = data.status === 'synced';
  const isError = data.status === 'error';
  const isMismatch = data.status === 'mismatch';

  const badgeClass = isSynced
    ? 'bg-green-50 border-green-100 text-green-600 shadow-sm'
    : isMismatch
    ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-md animate-pulse cursor-pointer'
    : 'bg-red-50 border-red-100 text-red-500 shadow-sm cursor-pointer';

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
          if (isMismatch || isError) {
              e.preventDefault();
              setShowTooltip(!showTooltip);
          }
      }}
    >
      <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${badgeClass}`}>
        {isSynced ? (
          <CheckCircle2 size={10} strokeWidth={3} />
        ) : isMismatch ? (
          <AlertTriangle size={10} strokeWidth={3} />
        ) : (
          <AlertCircle size={10} strokeWidth={3} />
        )}
        <span>{isSynced ? 'Synced' : isMismatch ? 'Sync Issue' : 'Sync Error'}</span>
      </div>

      {showTooltip && (isMismatch || isError) && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 bg-gray-900 text-white rounded-xl shadow-2xl p-4 text-xs animate-in fade-in zoom-in-95 duration-200 text-left before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2">
          <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-900 rotate-45" />
          <p className="font-black mb-3 text-white border-b border-gray-700 pb-2 flex items-center gap-2 text-sm">
            <AlertTriangle size={14} className="text-amber-400" />
            동기화 불일치 감지
          </p>
          {isMismatch ? (
            <div className="space-y-1 font-medium text-gray-300">
              <div className="flex justify-between">
                <span>MY DB 데이터 (가상):</span>
                <span className="text-white font-black">{data.virtualCount}행</span>
              </div>
              <div className="flex justify-between">
                <span>이지데스크 원본 (물리):</span>
                <span className="text-white font-black">{data.physicalCount}행</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700 flex flex-col gap-2">
                <div className="text-[10px] text-amber-300 font-bold bg-amber-900/30 p-1.5 rounded text-center">
                  수동 확인 및 조치가 필요합니다
                </div>
                <button
                  onClick={handleRepair}
                  disabled={isRepairing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-black rounded-lg transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
                >
                  {isRepairing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RotateCcw size={12} strokeWidth={3} />
                  )}
                  가상 DB 정정하기 (Resync Physical)
                </button>
              </div>
            </div>
          ) : (
            <p className="text-red-300 font-medium">{data.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
