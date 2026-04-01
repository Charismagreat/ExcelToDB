'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  Search, 
  ChevronRight, 
  Sparkles, 
  Send,
  BarChart3,
  PieChart,
  LineChart,
  Plus,
  X,
  Bot
} from 'lucide-react';
import { getVisualizationRecommendationAction } from '@/app/actions';
import SmartChart from '@/components/SmartChart';

interface DashboardClientProps {
  allTables: any[];
  user: any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'suggestion' | 'chart';
  chartConfig?: any;
}

export default function DashboardClient({ allTables, user }: DashboardClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 테이블 분석 AI 스튜디오에 오신 것을 환영합니다. 분석하고 싶은 테이블을 왼쪽 목록에서 선택해 주세요. 선택하신 데이터의 특성에 맞춰 최적의 시각화와 분석 방향을 제안해 드릴게요.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [charts, setCharts] = useState<any[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  const filteredTables = allTables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sheetName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTable = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSend = async (customPrompt?: string) => {
    let textToSend = customPrompt || input;
    if (!textToSend.trim() || selectedIds.length === 0) return;
    
    // 선택된 차트 정보를 프롬프트에 포함
    const selectedChart = charts.find(c => c.id === selectedChartId);
    if (selectedChartId && selectedChart) {
      textToSend = `[대상 차트: "${selectedChart.title}"] ${textToSend}`;
    }
    
    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    // 메시지가 발송되면 선택은 해제
    setSelectedChartId(null);

    try {
      const data = await getVisualizationRecommendationAction(
        selectedIds, 
        [...chatHistory, userMsg].map(m => ({ role: m.role, content: m.content }))
      );
      
      if (data.chartConfigs && data.chartConfigs.length > 0) {
        // 기존 차트와 합치되, 고유 ID 부여 (최신이 위로)
        const newConfigs = data.chartConfigs.map((c: any) => ({
          ...c,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        setCharts(prev => [...newConfigs, ...prev]);
      }

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.content
      }]);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 분석 중 오류가 발생했습니다. 테이블 선택 상태를 확인하시고 다시 한 번 말씀해 주세요.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteChart = (id: string) => {
    setCharts(prev => prev.filter(c => c.id !== id));
    if (selectedChartId === id) {
      setSelectedChartId(null);
    }
  };

  const selectedTables = allTables.filter(t => selectedIds.includes(t.id));
  const currentTargetedChart = charts.find(c => c.id === selectedChartId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-12rem)]">
      {/* 1. Left Sidebar: Table Picker */}
      <aside className="w-full lg:w-80 flex flex-col gap-6">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TableIcon size={16} className="text-blue-600" />
              Analyze Data Sources
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search tables..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px] p-2 space-y-1">
            {filteredTables.map(table => (
              <button
                key={table.id}
                onClick={() => toggleTable(table.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                  selectedIds.includes(table.id) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedIds.includes(table.id) ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'
                }`}>
                  <BarChart3 size={14} />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-xs font-black truncate">{table.name}</p>
                  <p className={`text-[9px] uppercase tracking-tighter opacity-60 ${
                    selectedIds.includes(table.id) ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {table.sheetName || 'Workspace Table'}
                  </p>
                </div>
                {selectedIds.includes(table.id) && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Tables</p>
            <div className="flex flex-wrap gap-2">
              {selectedIds.length === 0 ? (
                 <span className="text-[10px] font-medium text-slate-300 italic">No tables selected</span>
              ) : (
                selectedIds.map(id => {
                  const table = allTables.find(t => t.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase">
                      {table?.name.slice(0, 8)}...
                      <X size={10} className="cursor-pointer" onClick={() => toggleTable(id)} />
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Area: AI Analysis Studio */}
      <div className="flex-1 flex flex-col gap-8">
         {/* Top Promo/Status */}
         <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-2xl shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center animate-pulse">
                <Sparkles size={32} className="text-blue-200" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">AI Analysis Hub</h2>
                <p className="text-blue-100/80 text-sm font-medium mt-1 uppercase tracking-widest text-[10px] font-black">
                   Collaborate with AI to visualize your data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-bold text-blue-50">
                  {selectedIds.length} Tables Active
               </div>
               {selectedIds.length > 0 && (
                 <button 
                  onClick={() => handleSend("현재 선택한 테이블들의 데이터를 분석해서 시각화 차트를 추천해줘.")}
                  disabled={isTyping}
                  className="px-5 py-2.5 bg-white text-blue-600 rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
                 >
                    {isTyping ? '분석 중...' : '추천 분석 생성하기'}
                 </button>
               )}
            </div>
         </div>

         {/* Content View */}
         <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 2a. Chat Interface */}
            <div className="xl:col-span-1 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden max-h-[700px]">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">AI Assistant</h3>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Studio</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                         msg.role === 'user' 
                         ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20' 
                         : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                       }`}>
                          {msg.content}
                       </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 p-4 rounded-3xl rounded-tl-none border border-slate-100 flex gap-1">
                        <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
               </div>

               <div className="p-6 bg-slate-50 border-t border-slate-100">
                  {/* Targeted Chart Indicator */}
                  {selectedChartId && currentTargetedChart && (
                    <div className="mb-3 px-4 py-2 bg-blue-600 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2">
                       <div className="flex items-center gap-2 overflow-hidden">
                          <BarChart3 size={12} className="text-white shrink-0" />
                          <span className="text-[10px] font-black text-white uppercase truncate">수정 중: {currentTargetedChart.title}</span>
                       </div>
                       <button onClick={() => setSelectedChartId(null)} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors">
                          <X size={12} />
                       </button>
                    </div>
                  )}

                  <div className="relative group">
                    <textarea 
                      placeholder={selectedIds.length === 0 ? "테이블을 먼저 선택해 주세요" : "AI에게 시각화 추천을 요청해 보세요..."}
                      disabled={selectedIds.length === 0}
                      rows={2}
                      className="w-full p-4 pr-14 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={!input.trim() || selectedIds.length === 0}
                      className="absolute right-3 bottom-3 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="mt-3 text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">Shift + Enter to add a new line</p>
               </div>
            </div>

            {/* 2b. Visualization Area */}
            <div className="xl:col-span-2 space-y-8">
               {selectedIds.length === 0 ? (
                 <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-slate-200 text-center p-12">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                     <PieChart size={48} className="text-slate-200" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase tracking-widest">No Analysis Context</h3>
                   <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                     왼쪽 목록에서 분석하고 싶은 테이블을 선택하면 AI가 데이터를 검토하여 최적의 시각화를 추천해 드립니다.
                   </p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {charts.length === 0 && !isTyping && (
                      <div className="md:col-span-2 h-[400px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-slate-100 text-center">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
                           <Sparkles size={24} />
                         </div>
                         <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Ready to Visualize</h4>
                         <p className="text-xs text-slate-400 font-medium">상단 버튼이나 채팅을 통해 분석을 시작해 보세요.</p>
                      </div>
                    )}
                    
                    {charts.map((chart) => (
                      <div key={chart.id} className="md:col-span-2 last:md:col-span-2">
                        <SmartChart 
                          config={chart} 
                          isSelected={selectedChartId === chart.id}
                          onSelect={() => setSelectedChartId(prev => prev === chart.id ? null : chart.id)}
                          onDelete={() => handleDeleteChart(chart.id)}
                        />
                      </div>
                    ))}

                    {isTyping && (
                      <div className="md:col-span-2 bg-white/50 backdrop-blur-sm p-12 rounded-[40px] border border-dashed border-blue-200 flex flex-col items-center justify-center">
                         <div className="relative w-12 h-12 mb-4">
                            <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                         </div>
                         <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">AI가 데이터를 분석하며 차트를 구성 중입니다...</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
