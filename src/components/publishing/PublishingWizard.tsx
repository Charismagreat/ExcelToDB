'use client';

import React, { useState, useEffect } from 'react';
import { 
  getProactivePublishingSuggestionsAction, 
  publishMicroAppAction 
} from '@/app/actions/publishing';
import { TemplateRenderer } from './TemplateRenderer';
import { 
  Sparkles, MessageSquare, Send, CheckCircle2, ArrowRight,
  Layout, Database, Info, ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PublishingWizard() {
  const [step, setStep] = useState<'discovery' | 'adjustment' | 'success'>('discovery');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [mappingConfig, setMappingConfig] = useState<any>(null);
  const [uiSettings, setUiSettings] = useState<any>({ showChart: true });
  const [appName, setAppName] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuggestions() {
      const data = await getProactivePublishingSuggestionsAction();
      setSuggestions(data);
    }
    loadSuggestions();
  }, []);

  const handleSelectSuggestion = (s: any) => {
    setSelectedSuggestion(s);
    setAppName(`${s.tableName} 리포트`);
    // Initial default mapping (will be refined by AI later)
    setMappingConfig({
      date: '날짜',
      inflow: '입금액',
      outflow: '출금액',
      description: '적요',
      category: '구분'
    });
    setStep('adjustment');
    
    setChatMessages([
      { role: 'assistant', content: `안녕하세요! '${s.tableName}' 테이블을 기반으로 ${s.templateId === 'cash-report' ? '자금일보' : '분석'} 앱을 구성했습니다. 오른쪽 미리보기를 확인해 보세요. 수정하고 싶은 부분이 있다면 말씀해 주세요!` }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const newMessages = [...chatMessages, { role: 'user', content: inputMessage }];
    setChatMessages(newMessages);
    setInputMessage('');
    setIsAIProcessing(true);

    try {
      // Mocking AI response for now - in real implementation, call getPublishingAIAdjustment
      setTimeout(() => {
        setChatMessages([...newMessages, { role: 'assistant', content: "알겠습니다. 매핑 설정을 최적화했습니다. 변경된 내용이 미리보기에 반영되었습니다." }]);
        setIsAIProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('AI Processing error:', error);
      setIsAIProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSuggestion) return;
    const result = await publishMicroAppAction({
      name: appName,
      templateId: selectedSuggestion.templateId,
      sourceTableId: selectedSuggestion.tableId,
      mappingConfig,
      uiSettings
    });

    if (result.success) {
      setPublishedId(result.id);
      setStep('success');
    }
  };

  if (step === 'discovery') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            AI Discovery
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">마이크로 앱 발행하기</h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">이지데스크 AI가 워크스페이스를 스캔하여 가장 적합한 비즈니스 템플릿을 찾아냈습니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestions.map((s, idx) => (
            <button 
              key={idx}
              onClick={() => handleSelectSuggestion(s)}
              className="text-left bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-500 hover:shadow-blue-500/10 transition-all group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{s.templateId === 'cash-report' ? '자금일보 템플릿' : '데이터 리포트'}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 font-medium">
                  <Database className="w-4 h-4" />
                  {s.tableName}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {s.reason}
                </p>
                <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm">
                  이 템플릿으로 시작하기
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            </button>
          ))}
          
          <div className="p-8 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-800">다른 테이블 직접 선택</p>
              <p className="text-sm text-slate-400">모든 테이블 목록에서 직접 고르기</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'adjustment') {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] gap-6 animate-in fade-in duration-700">
        {/* Settings & Chat Panel */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">AI Mapping Agent</span>
            </div>
            <input 
              type="text" 
              value={appName} 
              onChange={(e) => setAppName(e.target.value)}
              placeholder="앱 이름 입력"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={cn(
                "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                msg.role === 'assistant' 
                  ? "bg-slate-100 text-slate-700 self-start" 
                  : "bg-blue-600 text-white self-end ml-auto shadow-lg shadow-blue-600/20"
              )}>
                {msg.content}
              </div>
            ))}
            {isAIProcessing && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">AI가 매핑을 조정 중입니다...</span>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="질문을 입력하세요..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isAIProcessing}
                className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={handlePublish}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-black shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              전용 페이지로 발행하기
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="flex-1 bg-slate-50 rounded-[40px] border border-slate-200 overflow-y-auto p-8 relative group">
          <div className="sticky top-0 right-0 flex justify-end mb-4 z-20">
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</span>
            </div>
          </div>
          
          <TemplateRenderer 
            templateId={selectedSuggestion.templateId}
            sourceTableId={selectedSuggestion.tableId}
            mappingConfig={mappingConfig}
            uiSettings={uiSettings}
            appName={appName}
          />
          
          {/* Mobile frame decoration (optional visual touch) */}
          <div className="absolute inset-0 border-[12px] border-slate-200/20 rounded-[40px] pointer-events-none" />
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const fullUrl = `${window.location.origin}/share/${selectedSuggestion.templateId}/${publishedId}`;
    
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-20 animate-in zoom-in-95 fade-in duration-1000">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">발행 완료!</h2>
          <p className="text-lg text-slate-500 font-medium">마이크로 앱이 성공적으로 생성되었습니다.<br />이제 보안 링크를 통해 대표님께 보고하세요.</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl space-y-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 break-all font-mono text-sm text-blue-600 font-bold">
            {fullUrl}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigator.clipboard.writeText(fullUrl)}
              className="py-4 rounded-2xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition-colors"
            >
              링크 복사하기
            </button>
            <a 
              href={fullUrl} 
              target="_blank"
              className="py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              페이지 방문하기
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={() => setStep('discovery')}
            className="text-slate-400 font-bold hover:text-slate-600 transition-colors underline underline-offset-8"
          >
            새로운 마이크로 앱 만들기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
