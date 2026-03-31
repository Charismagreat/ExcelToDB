'use client';

import React from 'react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Landmark, 
  Calendar, 
  ArrowRight,
  MoreVertical,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  History as HistoryIcon
} from 'lucide-react';

interface DashboardClientProps {
  stats: any;
  accounts: any;
  transactions: any;
  monthlyData: any;
  syncHistory: any;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(val);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function DashboardClient({ 
  stats, 
  accounts, 
  transactions, 
  monthlyData,
  syncHistory
}: DashboardClientProps) {

  // Safely extract arrays from potential object responses
  const monthlySummaryArray = Array.isArray(monthlyData) ? monthlyData : (monthlyData?.summary || []);
  const accountsArray = Array.isArray(accounts) ? accounts : (accounts?.accounts || []);
  const transactionsArray = Array.isArray(transactions) ? transactions : (transactions?.transactions || []);
  const syncHistoryArray = Array.isArray(syncHistory) ? syncHistory : (syncHistory?.syncOperations || []);

  const chartData = [...monthlySummaryArray].reverse().map((d: any) => ({
    name: d.month,
    in: d.totalDeposits,
    out: d.totalWithdrawals,
    net: d.netChange
  }));

  const totalBalance = accountsArray.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
  const recentSync = syncHistoryArray[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Balance Card */}
        <div className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Landmark size={64} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex flex-col h-full justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">Total Combined Balance</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {formatCurrency(totalBalance)}
              </h2>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
               <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-bold">
                 {accountsArray.length} Accounts
               </span>
               <span className="text-slate-400">across {stats?.bankCount || 0} Banks</span>
            </div>
          </div>
        </div>

        {/* Recent Monthly Summary Stats */}
        {chartData.length > 0 && (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                   <TrendingUp size={24} />
                </div>
                <span className="text-xs font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">+8.2%</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Monthly Income</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                 {formatCurrency(chartData[chartData.length-1].in)}
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-2xl text-rose-600 dark:text-rose-400">
                   <TrendingDown size={24} />
                </div>
                <span className="text-xs font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full">-3.4%</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Monthly Expense</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                 {formatCurrency(chartData[chartData.length-1].out)}
              </h2>
            </div>
          </>
        )}

        {/* Sync Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
           <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${recentSync?.status === 'SUCCESS' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'bg-amber-50 text-amber-600'}`}>
                 <Activity size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Connection Status</p>
                <div className="flex items-center gap-1.5">
                   <div className={`w-2 h-2 rounded-full ${recentSync?.status === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                   <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Services</p>
                </div>
              </div>
           </div>
           <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock size={12} />
              Synced {recentSync ? formatDate(recentSync.startTime) : 'Recently'}
           </p>
           <button className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">
             Sync Now
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Cash Flow Trends</h3>
                    <p className="text-sm text-slate-400 font-medium">Income and expenses over the last 6 months</p>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-indigo-500" />
                       <span className="text-slate-500">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-400" />
                       <span className="text-slate-500">Expense</span>
                    </div>
                 </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}}
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}}
                        tickFormatter={(value) => `${value / 10000}만`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                          backgroundColor: '#0f172a',
                          color: '#fff'
                        }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="in" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                      <Area type="monotone" dataKey="out" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Recent Transactions List */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Activity</h3>
                <Link href="#" className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                  View Full History <ArrowRight size={14} />
                </Link>
             </div>
             <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
               {transactionsArray.map((tx: any, idx: number) => (
                 <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl ${tx.amount < 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'} group-hover:scale-110 transition-transform`}>
                        {tx.amount < 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                     </div>
                     <div>
                       <p className="font-bold text-slate-900 dark:text-white tracking-tight">{tx.description || tx.memo}</p>
                       <p className="text-xs text-slate-400 font-semibold">{formatDate(tx.date)} &bull; {tx.bankId}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className={`font-black tracking-tighter ${tx.amount < 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                     </p>
                     <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{tx.category || 'Lifestyle'}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Sidebar: Account List & Sync History */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Your Accounts</h3>
             <div className="space-y-4">
                {accountsArray.map((acc: any, idx: number) => (
                  <div key={idx} className="relative group p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer">
                    <div className="flex justify-between items-center">
                       <div>
                         <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{acc.accountName || acc.accountNumber}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{acc.bankId}</p>
                       </div>
                       <p className="font-black text-slate-700 dark:text-slate-300 text-sm">
                         {formatCurrency(acc.balance)}
                       </p>
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl transition-all text-xs font-black uppercase tracking-widest">
                <CreditCard size={18} /> Add New Account
             </button>
           </div>

           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
             <div className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white mb-6">
                <HistoryIcon className="text-slate-400" size={24} />
                <h3>Sync History</h3>
             </div>
             <div className="space-y-6">
                {syncHistoryArray.map((h: any, idx: number) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== syncHistory.length - 1 && (
                      <div className="absolute top-8 left-4 w-px h-8 bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${h.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                       <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                         {h.message || (h.status === 'SUCCESS' ? 'Successfully Synchronized' : 'Sync Partial Failure')}
                      </p>
                      <p className="text-xs text-slate-400 font-semibold">{formatDate(h.startTime)}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative group">
              <div className="absolute -right-8 -bottom-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                 <Landmark size={180} />
              </div>
              <h3 className="text-xl font-black mb-2 relative z-10">Advanced Analytics</h3>
              <p className="text-indigo-100 text-sm font-medium mb-6 relative z-10 leading-relaxed uppercase tracking-wider text-xs opacity-80">
                Unlock deeper insights with AI-powered forecasting and categorisation.
              </p>
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors relative z-10 shadow-lg">
                 Learn More
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
