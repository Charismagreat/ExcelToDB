'use client';

import React, { useState } from 'react';
import { RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { restoreReportAction, permanentDeleteReportAction } from '@/app/actions';

interface ArchiveActionsProps {
  reportId: string;
}

export default function ArchiveActions({ reportId }: ArchiveActionsProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreReportAction(reportId);
    } catch (e) {
      alert('복구 중 오류 발생');
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirm('정말로 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await permanentDeleteReportAction(reportId);
    } catch (e) {
      alert('삭제 중 오류 발생');
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={handleRestore}
        disabled={isRestoring || isDeleting}
        className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 text-blue-600 font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-[11px] uppercase tracking-widest disabled:opacity-50"
      >
        {isRestoring ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
        Restore
      </button>

      <button 
        onClick={handlePermanentDelete}
        disabled={isRestoring || isDeleting}
        className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-400 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[11px] uppercase tracking-widest disabled:opacity-50"
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        Purge
      </button>
    </div>
  );
}
