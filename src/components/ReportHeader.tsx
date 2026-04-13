'use client';

import React, { useState } from 'react';
import { FileText, Edit2, Check, X, Settings, ShieldCheck, Share2, Bell, Loader2, Link } from 'lucide-react';
import { renameReportAction, updateReportWebhookAction } from '@/app/actions/report';
import { ColumnDefinition } from '@/lib/excel-parser';
import { SchemaEditor } from './SchemaEditor';
import { WorkflowSettingsModal } from './WorkflowSettingsModal';

interface ReportHeaderProps {
  reportId: string;
  initialName: string;
  sheetName: string;
  createdAt: string;
  isOwner: boolean;
  isAdmin?: boolean;
  canEdit?: boolean;
  isReadOnly?: boolean;
  initialColumns: ColumnDefinition[];
  initialSlackWebhookUrl?: string | null;
  assigneeId?: string | null;
  autoTodo?: number;
  dueDays?: number;
  onToggleAccessManager?: () => void;
}

export function ReportHeader({ 
  reportId, 
  initialName, 
  sheetName, 
  createdAt, 
  isOwner, 
  isAdmin, 
  canEdit,
  isReadOnly = false,
  initialColumns, 
  initialSlackWebhookUrl,
  assigneeId,
  autoTodo,
  dueDays,
  onToggleAccessManager
}: ReportHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showSlackConfig, setShowSlackConfig] = useState(false);
  const [showWorkflowConfig, setShowWorkflowConfig] = useState(false);
  const [slackUrl, setSlackUrl] = useState(initialSlackWebhookUrl || '');
  const [isSavingSlack, setIsSavingSlack] = useState(false);
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveSlackUrl = async () => {
    setIsSavingSlack(true);
    try {
      await updateReportWebhookAction(reportId, slackUrl.trim() || null);
      setShowSlackConfig(false);
    } catch (error) {
      alert('슬랙 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingSlack(false);
    }
  };

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
    const currentPath = window.location.pathname;
    const basePath = currentPath.replace(/\/(dashboard|report|share).*$/, '');
    const shareUrl = `${window.location.origin}${basePath}/report/${reportId}/input`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('URL 복사에 실패했습니다.');
    }
  };

  return (
    <>
      <section className="bg-white p-8 border rounded-[32px] shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 relative">
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
                  {isReadOnly && (
                    <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-200 shadow-sm animate-pulse">
                      Read-Only
                    </div>
                  )}
                  {isOwner && !isReadOnly && (
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
            {!isReadOnly && canEdit && (
              <div className="flex items-center gap-3">
                {(isAdmin || isOwner) && (
                    <button 
                        onClick={onToggleAccessManager}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white text-gray-500 font-black rounded-[18px] border border-gray-100 hover:text-amber-600 hover:border-amber-100 hover:bg-amber-50/30 transition-all shadow-sm active:scale-95 text-[11px] uppercase tracking-widest"
                    >
                        <ShieldCheck size={16} strokeWidth={2.5} />
                        Access Permissions
                    </button>
                )}

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
                            <Link size={16} />
                            워크스페이스 URL 복사
                        </>
                    )}
                </button>
              </div>
            )}
            
            {!isReadOnly && (isOwner || isAdmin) && (
              <div className="flex items-center gap-3 ml-2 relative">
                <div className="w-px h-8 bg-gray-100 mx-1" />
                
                <button 
                  onClick={() => setShowSlackConfig(!showSlackConfig)}
                  className={`flex items-center gap-2 px-4 py-3.5 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border ${
                    showSlackConfig 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' 
                      : 'bg-white text-gray-500 border-gray-100 hover:text-emerald-600 hover:border-emerald-100'
                  }`}
                  title="슬랙 알림 설정"
                >
                  <Bell size={18} className={showSlackConfig ? 'animate-bounce' : ''} />
                  알림 설정
                </button>

                <button 
                  onClick={() => setShowWorkflowConfig(true)}
                  className="flex items-center gap-2 px-4 py-3.5 bg-white text-gray-500 font-black rounded-[18px] border border-gray-100 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/30 transition-all shadow-sm active:scale-95 text-[11px] uppercase tracking-widest"
                  title="담당자 및 사후 프로세스 설정"
                >
                  <Share2 size={18} className="text-gray-400 group-hover:text-blue-500" />
                  사후 프로세스
                </button>

                {showSlackConfig && (
                  <div className="absolute top-full mt-4 right-0 w-80 bg-white border border-gray-100 shadow-2xl rounded-[24px] p-6 z-[100] animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Slack Webhook URL</h4>
                      <button onClick={() => setShowSlackConfig(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        이 테이블의 데이터를 위한 **전용 슬랙 채널** 웹후크 URL을 입력하세요. 
                        설정하지 않으면 시스템 공통 채널로 발송됩니다.
                      </p>
                      <input 
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={slackUrl}
                        onChange={(e) => setSlackUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                      <button 
                        onClick={handleSaveSlackUrl}
                        disabled={isSavingSlack}
                        className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSavingSlack ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                        설정 저장하기
                      </button>
                      {initialSlackWebhookUrl && (
                        <button 
                          onClick={() => { setSlackUrl(''); }}
                          className="w-full py-2.5 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                        >
                          설정 초기화 (삭제)
                        </button>
                      )}
                    </div>
                  </div>
                )}

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
          initialName={name}
          initialColumns={initialColumns}
          onClose={() => setShowConfig(false)}
        />
      )}

      {showWorkflowConfig && (
        <WorkflowSettingsModal 
          report={{ 
            id: reportId, 
            name: name, 
            assigneeId, 
            autoTodo, 
            dueDays 
          }}
          onClose={() => setShowWorkflowConfig(false)}
        />
      )}
    </>
  );
}

