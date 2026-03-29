'use client';

import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteReportAction } from '@/app/actions';

interface DeleteReportButtonProps {
  reportId: string;
  reportName: string;
}

export default function DeleteReportButton({ reportId, reportName }: DeleteReportButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteReportAction(reportId);
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200">
        <AlertTriangle className="text-red-500 mb-2" size={24} />
        <p className="text-xs font-bold text-gray-900 mb-1 leading-tight">
          보고서를 삭제하시겠습니까?
        </p>
        <p className="text-[10px] text-gray-500 mb-3 truncate w-full px-2">
          {reportName}
        </p>
        <div className="flex gap-2 w-full max-w-[160px]">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-1.5 px-3 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 shadow-sm shadow-red-100"
          >
            {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
            삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setShowConfirm(true)}
      className="text-gray-400 hover:text-red-500 transition-colors p-1"
      title="삭제"
    >
      <Trash2 size={16} />
    </button>
  );
}
