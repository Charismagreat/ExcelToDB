'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight,
  Filter, Download, Share2, MoreHorizontal
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CashReportProps {
  data: any[];
  mapping: {
    date: string;
    inflow: string;
    outflow: string;
    description: string;
    category?: string;
  };
  uiSettings: any;
  appName: string;
}

export function CashReport({ data, mapping, uiSettings, appName }: CashReportProps) {
  // 1. Data Transformation
  const formattedData = data.map(item => ({
    date: item[mapping.date],
    inflow: Number(item[mapping.inflow] || 0),
    outflow: Number(item[mapping.outflow] || 0),
    description: item[mapping.description],
    category: item[mapping.category || ''],
    balance: Number(item[mapping.inflow] || 0) - Number(item[mapping.outflow] || 0)
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Calculations
  const totalInflow = formattedData.reduce((sum, item) => sum + item.inflow, 0);
  const totalOutflow = formattedData.reduce((sum, item) => sum + item.outflow, 0);
  const currentBalance = totalInflow - totalOutflow;
  
  // Recent transactions (last 10)
  const recentTransactions = [...formattedData].reverse().slice(0, 10);

  return (
    <div className="space-y-8 pb-20">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{appName}</h1>
          <p className="text-slate-500 font-medium">실시간 자금 흐름 리포트</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
            <Download className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
            <Share2 className="w-5 h-5 text-slate-600" />
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
            전체 내역 보기
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="현재 가용 자금" 
          value={currentBalance} 
          icon={<Wallet className="w-6 h-6 text-blue-600" />}
          trend="+4.2%"
          trendUp={true}
          color="blue"
        />
        <SummaryCard 
          title="금월 총 수입" 
          value={totalInflow} 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          trend="+12.5%"
          trendUp={true}
          color="emerald"
        />
        <SummaryCard 
          title="금월 총 지출" 
          value={totalOutflow} 
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
          trend="-2.1%"
          trendUp={false}
          color="rose"
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">자금 흐름 추이</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last 30 Days</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="inflow" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorInflow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-900/20 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-6 opacity-90">지출 카테고리 분석</h3>
            <div className="space-y-6">
              <CategoryProgress label="임대료" percentage={45} color="bg-blue-400" />
              <CategoryProgress label="인건비" percentage={30} color="bg-emerald-400" />
              <CategoryProgress label="마케팅" percentage={15} color="bg-purple-400" />
              <CategoryProgress label="기타" percentage={10} color="bg-slate-400" />
            </div>
            <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-sm opacity-60 mb-1">AI 브리핑</p>
              <p className="text-sm font-medium leading-relaxed">
                현재 지출에서 임대료 비중이 가장 높습니다. 전월 대비 고정비가 5% 감소하여 가용 자금이 안정적으로 유지되고 있습니다.
              </p>
            </div>
          </div>
          {/* Decorative gradients */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            최근 거래 타임라인
          </h3>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
            필터
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {recentTransactions.map((tx, idx) => (
            <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                  tx.inflow > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {tx.inflow > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{tx.description}</p>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">{tx.date} • {tx.category || '기타'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-lg font-black tracking-tight",
                  tx.inflow > 0 ? "text-emerald-600" : "text-slate-900"
                )}>
                  {tx.inflow > 0 ? '+' : '-'}{new Intl.NumberFormat('ko-KR').format(Math.max(tx.inflow, tx.outflow))}
                </p>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 text-center bg-slate-50/30">
          <button className="text-sm font-bold text-blue-600 hover:underline">거래 내역 더보기</button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, trendUp, color }: { 
  title: string, value: number, icon: React.ReactNode, trend: string, trendUp: boolean, color: string 
}) {
  const formattedValue = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  
  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-100 transition-all duration-500 hover:shadow-blue-500/10 group">
      <div className="flex items-center justify-between mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12",
          color === 'blue' ? 'bg-blue-50' : color === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50'
        )}>
          {icon}
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1",
          trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{formattedValue}</p>
      </div>
    </div>
  );
}

function CategoryProgress({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold opacity-80">{label}</span>
        <span className="font-black opacity-60">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
