'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Database, 
  ExternalLink, 
  Trash2, 
  Rocket,
  Eye,
  CheckCircle2,
  Sparkles,
  Palette,
  Settings,
  Edit2,
  Check,
  X,
  ShieldCheck,
  FileText,
  Search,
  Layout,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  addSourcesToProjectAction, 
  removeSourceFromProjectAction,
  publishProjectAction,
  updateMicroAppProjectAction
} from '@/app/actions/micro-app';
import { getAISuggestedProjectSetupAction } from '@/app/actions/publishing';
import { SourceSelectorModal } from './SourceSelectorModal';
import { TemplateRenderer } from './TemplateRenderer';

interface MicroAppStudioProps {
  project: any;
  user: any;
}

export function MicroAppStudio({ project, user }: MicroAppStudioProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const [pending, setPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'code'>('general');
  const [customHtml, setCustomHtml] = useState(project.uiSettings.customHtml || '');
  const [customCss, setCustomCss] = useState(project.uiSettings.customCss || '');
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveName = async () => {
    if (name.trim() === '' || name === project.name) {
      setIsEditingName(false);
      setName(project.name);
      return;
    }

    setPending(true);
    try {
      await updateMicroAppProjectAction(project.id, { name });
      setIsEditingName(false);
    } catch (error) {
      alert('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  const handleAddTag = async (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if (e.type === 'blur' || (e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter')) {
      const tagInput = e.currentTarget as HTMLInputElement;
      const tagValue = tagInput.value.trim().replace(/^#/, '');
      if (tagValue && !project.tags.includes(tagValue)) {
        const newTags = [...project.tags, tagValue];
        setPending(true);
        try {
          const res = await updateMicroAppProjectAction(project.id, { tags: newTags });
          if (res.success) {
            tagInput.value = '';
            router.refresh();
          } else {
            alert(`태그 추가 실패: ${res.error}`);
          }
        } catch (error: any) {
          alert('태그 추가 중 통신 오류가 발생했습니다.');
        } finally {
          setPending(false);
        }
      } else if (tagValue === '') {
        // 비어있는 상태로 Blur 시 입력창 초기화
        tagInput.value = '';
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = project.tags.filter((t: string) => t !== tagToRemove);
    setPending(true);
    try {
      const res = await updateMicroAppProjectAction(project.id, { tags: newTags });
      if (res.success) {
        router.refresh();
      } else {
        alert(`태그 삭제 실패: ${res.error}`);
      }
    } catch (error: any) {
      alert('태그 삭제 중 통신 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  const handleDesignRefresh = async () => {
    if (!window.confirm('현재 데이터 매핑은 유지한 채, 디자인 스타일(테마, 설명 등)만 새롭게 제안받으시겠습니까?')) return;
    
    setPending(true);
    try {
      const { getAIDesignRefreshAction } = await import('@/app/actions/publishing');
      const suggestion = await getAIDesignRefreshAction(project.id);
      
      if (suggestion.success) {
        alert(`디자인 리프레시 완료: ${suggestion.data.uiSettings.description}`);
        
        await updateMicroAppProjectAction(project.id, {
          uiSettings: { 
            ...suggestion.data.uiSettings, 
            tags: project.tags 
          }
        });
        router.refresh();
      } else {
        alert(`디자인 추천 실패: ${suggestion.error}`);
      }
    } catch (e) {
      alert('디자인 리프레시 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  const handleAISuggest = async () => {
    if (project.sources.length === 0) {
      alert('AI 디자인 추천을 받으려면 최소 하나 이상의 데이터 소스를 먼저 추가해야 합니다.');
      return;
    }

    if (!window.confirm('AI가 현재 소스를 분석하여 가장 적합한 디자인과 매핑을 추천합니다. 계속하시겠습니까?')) return;
    
    console.log('[MicroAppStudio] AI Suggestion Started');
    setPending(true);
    try {
      const suggestion = await getAISuggestedProjectSetupAction(project.id);
      console.log('[MicroAppStudio] AI Suggestion Result:', suggestion);
      
      if (suggestion.success) {
        alert(`AI 추천 완료: ${suggestion.data.uiSettings.description}\n\n추천된 디자인과 매핑이 프로젝트에 적용되었습니다. 이제 'PUBLISH MICRO APP' 버튼을 눌러 발행하세요!`);
        
        // AI 추천 설정을 프로젝트에 저장 (태그 정보 포함)
        await updateMicroAppProjectAction(project.id, {
          templateId: suggestion.data.templateId,
          mappingConfig: suggestion.data.mappingConfig,
          uiSettings: { 
            ...suggestion.data.uiSettings, 
            tags: project.tags 
          }
        });
      } else {
        console.error('[MicroAppStudio] AI Suggestion Failed:', suggestion.error);
        alert(`AI 추천 실패: ${suggestion.error || '알 수 없는 오류가 발생했습니다.'}`);
      }
      
      router.refresh();
    } catch (e) {
      alert('AI 추천 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    if (!confirm('이 데이터 소스를 프로젝트에서 제거하시겠습니까?')) return;
    try {
      await removeSourceFromProjectAction(project.id, sourceId);
    } catch (e) {
      alert('소스 제거에 실패했습니다.');
    }
  };

  const handlePublish = async () => {
    if (project.sources.length === 0) {
      alert('최소 하나 이상의 데이터 소스가 필요합니다.');
      return;
    }

    setIsPublishing(true);
    try {
      const res = await publishProjectAction(project.id);
      if (res.success) {
        alert('앱이 성공적으로 발행되었습니다!');
        router.push('/publishing');
      } else {
        alert(`발행 실패: ${res.error}`);
      }
    } catch (e) {
      alert('발행 중 통신 오류가 발생했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddSources = async (sources: any[]) => {
    await addSourcesToProjectAction(project.id, sources);
    setIsModalOpen(false);
    router.refresh();
  };

  const openInMyDB = (tableId: string) => {
    window.open(`/report/${tableId}`, '_blank');
  };

  if (!isMounted) return null;

  return (
    <main className="max-w-[1600px] mx-auto px-8 md:px-12 pt-6 pb-32 space-y-10 animate-in fade-in duration-700">
      
      {/* 1. Header Area - Matched with MY DB Table View */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex flex-col gap-2 w-full max-w-xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4">
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    placeholder="앱 이름 (예: 자금보고서 #CEO #심플)"
                    className="text-3xl font-bold text-slate-900 border-b-4 border-blue-500 bg-transparent outline-none py-1 w-full"
                    disabled={pending}
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveName} disabled={pending} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-90"><Check size={20} strokeWidth={3} /></button>
                    <button onClick={() => { setIsEditingName(false); setName(project.name); }} disabled={pending} className="p-3 bg-slate-100 text-slate-400 rounded-2xl transition-all active:scale-90"><X size={20} strokeWidth={3} /></button>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-blue-500/70 flex items-center gap-1.5 px-1">
                  <Sparkles size={12} />
                  이름 뒤에 #태그를 넣어보세요. AI가 디자인과 정보를 맞춤형으로 추천합니다.
                </p>
              </div>
            ) : (
              <div className="group">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 font-[family-name:var(--font-geist-sans)] leading-tight uppercase">
                    {project.name}
                    <Rocket className="text-blue-600 shrink-0" size={24} />
                    <button onClick={() => setIsEditingName(true)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100" title="이름 수정"><Edit2 size={24} /></button>
                  </h1>
                  <div className="px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-[0.25em] rounded-full border border-amber-200 shadow-sm shrink-0">
                    Project Draft
                  </div>
                </div>

                {/* 2. New Dedicated Tag Section */}
                <div className="flex flex-wrap items-center gap-2 mt-4 animate-in slide-in-from-left-2 duration-500">
                  <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Context Tags</span>
                  </div>
                  
                  {project.tags?.map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-rose-200 hover:text-rose-600 transition-all group cursor-default">
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  
                  <div className="relative group">
                    <input 
                      type="text"
                      placeholder="+ 태그 추가 (예: CEO용)"
                      onKeyDown={handleAddTag}
                      onBlur={handleAddTag}
                      disabled={pending}
                      className="px-3 py-1.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:border-solid transition-all w-32 focus:w-48 shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <div className="text-slate-500 font-bold leading-relaxed flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-xl">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Environment</span>
                        <span className="text-slate-900 font-black text-xs uppercase">Micro App Studio</span>
                    </div>
                    <span className="text-slate-300 font-normal">|</span>
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        <span>Last modified at {new Date(project.updatedAt).toLocaleDateString()}</span>
                        <span className="text-slate-200">|</span>
                        <span className="text-blue-600">{project.sources.length} Data Sources Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          Data & Preview
        </button>
        <button 
          onClick={() => setActiveTab('code')}
          className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'code' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          Custom HTML/CSS
        </button>
      </div>

      {/* 2. Main Content Card */}
      <section className="space-y-6">
        <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
          
          {/* Top Action Bar Inside Card - Matched with Table Export/Search bar */}
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-white">
            <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Connected source search..."
                    className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    readOnly
                />
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={handleAISuggest}
                  disabled={pending}
                  className="px-6 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 border border-indigo-100 disabled:opacity-50 group"
                  title="전체 구성(매핑+디자인) 추천"
                >
                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                  AI Full Suggest
                </button>

                <button 
                  onClick={handleDesignRefresh}
                  disabled={pending}
                  className="px-6 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 border border-slate-100 disabled:opacity-50 group"
                  title="디자인 스타일만 추천"
                >
                  <Palette size={18} className="group-hover:scale-110 transition-transform" />
                  Design Refresh
                </button>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  disabled={pending}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={18} />
                  데이터 소스 추가
                </button>

                <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-xl shadow-slate-900/20 disabled:opacity-50"
                >
                    <Rocket size={16} strokeWidth={2.5} />
                    {isPublishing ? 'Publishing...' : 'Publish Micro App'}
                </button>
            </div>
          </div>

          {/* Source List Section */}
          <div className="p-0">
            {activeTab === 'general' ? (
              <div className="space-y-0">
                {/* 1. Source List (Original) */}
                <div className="p-4 md:p-8 border-b border-slate-50">
                  <div className="flex items-center gap-3 mb-6 px-2">
                    <Database className="text-slate-400" size={18} />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Connected Sources</h4>
                  </div>
                  {project.sources.length === 0 ? (
                      <div className="py-20 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mb-4 text-slate-200 border border-slate-100 shadow-inner">
                              <Database size={32} />
                          </div>
                          <h4 className="text-lg font-black text-slate-900 mb-1">데이터 소스를 추가해 주세요</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">No sources detected</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {project.sources.map((source: any, index: number) => (
                              <div 
                                  key={`${source.id}-${index}`}
                                  className="p-4 flex items-center justify-between gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg transition-all group"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-white text-slate-300 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-slate-100">
                                          {index + 1}
                                      </div>
                                      <div>
                                          <h4 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{source.name}</h4>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => handleRemoveSource(source.id)}
                                      className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                </div>

                {/* 2. Template Selection & Preview */}
                <div className="p-8 md:p-12 space-y-12 bg-slate-50/30">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                      <Layout className="text-slate-400" size={18} />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Template</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'cash-report', name: '자금일보', icon: '💰', desc: '은행 거래 및 자산 현황' },
                        { id: 'custom-app', name: '범용 리포트', icon: '📊', desc: '모든 테이블 범용 시각화' },
                        { id: 'custom-html', name: '커스텀 HTML', icon: '🌐', desc: '직접 제작한 HTML/CSS' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={async () => {
                            await updateMicroAppProjectAction(project.id, { templateId: t.id });
                            router.refresh();
                          }}
                          className={`p-8 rounded-[40px] border-2 transition-all text-left flex flex-col relative overflow-hidden group ${project.templateId === t.id ? 'border-blue-600 bg-white shadow-2xl shadow-blue-900/10' : 'border-white bg-white/50 hover:bg-white hover:border-blue-100'}`}
                        >
                          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{t.icon}</div>
                          <div className="text-lg font-black text-slate-900 mb-1">{t.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t.desc}</div>
                          {project.templateId === t.id && (
                            <div className="absolute top-6 right-6 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-12 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-8 px-2">
                      <div className="flex items-center gap-3">
                        <Eye className="text-slate-400" size={18} />
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Live Preview</h4>
                      </div>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">WYSIWYG Mode</span>
                    </div>
                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden min-h-[600px]">
                      <TemplateRenderer 
                        templateId={project.templateId}
                        sourceTableId={project.sources.map((s: any) => s.id)}
                        mappingConfig={project.mappingConfig}
                        uiSettings={project.uiSettings}
                        appName={project.name}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 md:p-12 space-y-10">
                <div className="flex items-start gap-6 bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                    <Bot size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white font-black text-lg">커스텀 코드 인젝션 모드</h4>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                      외부 디자인 도구에서 추출한 HTML과 CSS를 아래에 붙여넣으세요. 
                      <code className="mx-1 px-1.5 py-0.5 bg-slate-800 text-blue-400 rounded font-mono text-[10px]">{"{{totalBalance}}"}</code>와 같은 플레이스홀더를 사용하면 실시간 데이터가 자동으로 매핑됩니다.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HTML Architecture</label>
                      <span className="text-[9px] font-bold text-emerald-500 uppercase">React-Safe DSL</span>
                    </div>
                    <textarea 
                      value={customHtml}
                      onChange={(e) => setCustomHtml(e.target.value)}
                      placeholder="<!-- Paste your HTML here -->"
                      className="w-full h-[600px] p-8 bg-slate-900 text-emerald-400 font-mono text-xs rounded-[40px] border border-slate-800 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Styling (CSS)</label>
                      <span className="text-[9px] font-bold text-blue-400 uppercase">Scoped Styles</span>
                    </div>
                    <textarea 
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      placeholder="/* Paste your CSS here */"
                      className="w-full h-[600px] p-8 bg-slate-900 text-blue-300 font-mono text-xs rounded-[40px] border border-slate-800 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={async () => {
                      setPending(true);
                      try {
                        await updateMicroAppProjectAction(project.id, {
                          templateId: 'custom-html',
                          uiSettings: { 
                            ...project.uiSettings, 
                            customHtml, 
                            customCss 
                          }
                        });
                        alert('커스텀 디자인이 저장되었습니다! [Data & Preview] 탭에서 결과를 확인하세요.');
                        setActiveTab('general');
                        router.refresh();
                      } catch (e) {
                        alert('저장 중 오류가 발생했습니다.');
                      } finally {
                        setPending(false);
                      }
                    }}
                    disabled={pending}
                    className="group px-12 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <CheckCircle2 size={20} />
                    Deploy Custom Design
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Footer Guardrail - Refined Style */}
      <footer className="pt-12 text-center opacity-40">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Enterprise Intelligent Orchestration Engine</p>
      </footer>

      {isModalOpen && (
        <SourceSelectorModal 
          onClose={() => setIsModalOpen(false)} 
          onSelect={handleAddSources}
        />
      )}
    </main>
  );
}
