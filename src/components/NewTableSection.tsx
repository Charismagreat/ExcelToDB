'use client';

import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import UploadWorkflow from './UploadWorkflow';
import ManualTableModal from './ManualTableModal';

export default function NewTableSection({ userId }: { userId: string }) {
  const [showManualModal, setShowManualModal] = useState(false);

  return (
    <section className="bg-white p-8 border border-gray-100 rounded-[32px] shadow-sm overflow-hidden relative">
      <div className="flex items-center gap-2 mb-8">
        <Plus size={20} className="text-blue-600" />
        <h2 className="text-sm font-black text-gray-800 tracking-tight uppercase tracking-[0.2em]">Create New Report</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3">
          <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={16} className="text-blue-500" />
              <h3 className="text-xs font-black text-gray-600 uppercase">Method 1. Excel Upload</h3>
            </div>
            <UploadWorkflow userId={userId} />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-blue-600 p-8 rounded-[24px] flex flex-col items-center text-center text-white h-full justify-center group hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <h3 className="text-lg font-black mb-3">직접 구조 만들기</h3>
            <p className="text-sm text-blue-100 font-medium mb-8 leading-relaxed opacity-80">
              엑셀 파일 없이도 원하는 항목을 직접 정의하여<br/>나만의 테이블을 생성하세요.
            </p>
            <button 
              onClick={() => setShowManualModal(true)}
              className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all text-xs tracking-widest uppercase shadow-lg"
            >
              지금 시작하기
            </button>
          </div>
        </div>
      </div>

      {showManualModal && <ManualTableModal onClose={() => setShowManualModal(false)} />}
    </section>
  );
}
