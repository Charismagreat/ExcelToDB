'use client';

import React, { useState } from 'react';
import { FileText, Edit2, Check, X, Settings, ShieldCheck, Share2 } from 'lucide-react';
import { renameReportAction } from '@/app/actions';
import { ColumnDefinition } from '@/lib/excel-parser';
import SchemaEditor from './SchemaEditor';

interface ReportHeaderProps {
  reportId: string;
  initialName: string;
  sheetName: string;
  createdAt: string;
  isOwner: boolean;
  isAdmin?: boolean;
  canEdit?: boolean;
  initialColumns: ColumnDefinition[];
  onToggleAccessManager?: () => void;
}

export default function ReportHeader({ 
  reportId, 
  initialName, 
  sheetName, 
  createdAt, 
  isOwner, 
  isAdmin, 
  canEdit,
  initialColumns, 
  onToggleAccessManager
}: ReportHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/report/${reportId}/input`;
    const shareData = {
      title: `${name} - 데이터 입력`,
      text: `${name} 보고서의 데이터 입력을 위한 전용 페이지 링크입니다.`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled or share failed, fallback to copy
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <section className="bg-white p-8 border rounded-[32px] shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 text-white p-4 rounded-[20px] shadow-xl shadow-blue-500/20 shrink-0">
              <FileText size={32} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-1.5">
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
                  <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sheet</span>
                  <span className="text-gray-600">{sheetName}</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="text-gray-400 font-medium">Created at {createdAt}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <div className="flex items-center gap-3">
                {/* Access Permissions (Moved back to header) */}
                {(isAdmin || isOwner) && (
                    <button 
                        onClick={onToggleAccessManager}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white text-gray-500 font-black rounded-[18px] border border-gray-100 hover:text-amber-600 hover:border-amber-100 hover:bg-amber-50/30 transition-all shadow-sm active:scale-95 text-[11px] uppercase tracking-widest"
                    >
                        <ShieldCheck size={16} strokeWidth={2.5} />
                        Access Permissions
                    </button>
                )}

                {/* Copy Input URL (Moved back to header) */}
                <button 
                    onClick={handleShare}
                    className={`
                        flex items-center gap-2 px-6 py-3.5 font-black rounded-[18px] transition-all text-[11px] uppercase tracking-widest active:scale-95 border
                        ${copied 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-lg shadow-indigo-100 scale-105' 
                            : 'bg-white border-gray-100 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 shadow-sm'
                        }
                    `}
                >
                    {copied ? (
                        <>
                            <Check size={16} strokeWidth={3} className="text-indigo-600" />
                            Link Copied!
                        </>
                    ) : (
                        <>
                            <Share2 size={16} strokeWidth={2.5} />
                            Copy Input URL
                        </>
                    )}
                </button>
              </div>
            )}
            
            {isOwner && (
              <div className="flex items-center gap-3 ml-2">
                <div className="w-px h-8 bg-gray-100 mx-1" />
                <button 
                  onClick={() => setShowConfig(true)}
                  className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 text-gray-500 font-black rounded-[18px] hover:bg-white border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all text-[11px] uppercase tracking-widest active:scale-95 group"
                >
                  <Settings size={18} className="text-gray-400 group-hover:rotate-90 transition-transform duration-500" />
                  테이블 설정 수정
                </button>
              </div>
            )}
          </div>
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
