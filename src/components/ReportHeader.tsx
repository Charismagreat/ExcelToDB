'use client';

import React, { useState } from 'react';
import { FileText, Edit2, Check, X, Settings } from 'lucide-react';
import { renameReportAction } from '@/app/actions';
import { ColumnDefinition } from '@/lib/excel-parser';
import SchemaEditor from './SchemaEditor';

interface ReportHeaderProps {
  reportId: string;
  initialName: string;
  sheetName: string;
  createdAt: string;
  isOwner: boolean;
  initialColumns: ColumnDefinition[];
}

export default function ReportHeader({ reportId, initialName, sheetName, createdAt, isOwner, initialColumns }: ReportHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  const handleSave = async () => {
    if (name.trim() === '' || name === initialName) {
      setIsEditing(false);
      setName(initialName);
      return;
    }

    setPending(true);
    try {
      await renameReportAction(reportId, name);
      setIsEditing(false);
    } catch (error) {
      alert('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <section className="bg-white p-8 border rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-100">
              <FileText size={28} />
            </div>
            <div className="flex flex-col">
              {isEditing ? (
                <div className="flex items-center gap-2 group">
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="text-3xl font-black text-gray-900 border-b-4 border-blue-500 bg-transparent outline-none py-1 transition-all w-full max-w-md"
                    disabled={pending}
                  />
                  <button 
                    onClick={handleSave}
                    disabled={pending}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setName(initialName); }}
                    disabled={pending}
                    className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{name}</h1>
                  {isOwner && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
              )}
              <p className="flex items-center gap-2 text-gray-400 text-sm font-bold mt-2">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-gray-500">Sheet</span>
                <span className="text-gray-600">{sheetName}</span>
                <span className="text-gray-200">|</span>
                <span className="text-gray-500">Created at {createdAt}</span>
              </p>
            </div>
          </div>

          {isOwner && (
            <button 
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm active:scale-95 group"
            >
              <Settings size={18} className="text-gray-400 group-hover:rotate-90 transition-transform duration-500" />
              테이블 설정 수정
            </button>
          )}
        </div>
      </section>

      {showConfig && (
        <SchemaEditor 
          reportId={reportId}
          initialColumns={initialColumns}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
}
