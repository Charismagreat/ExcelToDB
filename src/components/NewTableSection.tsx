'use client';

import React, { useState } from 'react';
import { Plus, Upload, Database, Layout } from 'lucide-react';
import UploadWorkflow from './UploadWorkflow';
import ManualTableModal from './ManualTableModal';

export default function NewTableSection({ userId }: { userId: string }) {
  const [showManualModal, setShowManualModal] = useState(false);

  return (
    <div className="space-y-12">
      {/* METHOD 1: EXCEL SMART INGESTION */}
      <section className="bg-white p-10 border border-gray-100 rounded-[40px] shadow-sm overflow-hidden relative group animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-blue-50 rounded-xl">
             <Upload size={20} className="text-blue-600" />
          </div>
          <div>
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-0.5">System Protocol 01</h2>
             <h3 className="text-lg font-black text-gray-900 tracking-tight">Excel Asset Ingestion</h3>
          </div>
        </div>
        
        <div className="bg-gray-50/80 p-8 lg:p-12 rounded-[32px] border border-gray-100/50 shadow-inner">
           <div className="max-w-3xl mx-auto">
              <UploadWorkflow userId={userId} />
           </div>
        </div>
      </section>
      
      {/* METHOD 2: DIRECT DEFINITION - COMPACT HORIZONTAL */}
      <section className="bg-white p-5 border border-gray-100 rounded-[28px] shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="bg-indigo-600 rounded-[20px] p-4 lg:px-8 text-white relative overflow-hidden shadow-lg shadow-indigo-100 flex items-center justify-between group">
           {/* Decorative Elements - Subtle */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
           
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
                 <Database size={24} strokeWidth={2.5} />
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4">
                 <h4 className="text-lg font-black tracking-tight">직접 테이블 설계하기</h4>
                 <div className="hidden lg:block w-px h-3 bg-white/20" />
                 <p className="text-indigo-100 font-bold text-xs opacity-80">
                    엑셀 파일 없이 원하는 필드를 직접 정의하여 나만의 데이터베이스를 구축하세요.
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-4 relative z-10 shrink-0">
              <button 
                onClick={() => setShowManualModal(true)}
                className="px-8 py-3 bg-white text-indigo-700 font-black rounded-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg text-[10px] tracking-widest uppercase"
              >
                [ START ]
              </button>
           </div>
        </div>
      </section>

      {showManualModal && <ManualTableModal onClose={() => setShowManualModal(false)} />}
    </div>
  );
}
