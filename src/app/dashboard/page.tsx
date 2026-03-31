import React from 'react';
import { getSessionAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import { 
  getOverallStats, 
  listAccounts, 
  queryTransactions, 
  getMonthlySummary, 
  getSyncHistory 
} from '@/financehub-helpers';
import DashboardClient from './DashboardClient';
import { LayoutDashboard, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Landmark, History } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default async function FinanceDashboardPage() {
  const user = await getSessionAction();
  if (!user) {
    redirect('/login');
  }

  // Fetch all necessary data in parallel
  const [
    overallStats,
    accounts,
    recentTransactions,
    monthlySummary,
    syncHistory
  ] = await Promise.all([
    getOverallStats(),
    listAccounts(),
    queryTransactions({ limit: 10 }),
    getMonthlySummary({ months: 6 }),
    getSyncHistory(5)
  ]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <LayoutDashboard size={20} />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Excel2DB FinanceHub
              </span>
            </Link>
            
            <nav className="hidden md:flex gap-1">
              <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors">
                Overview
              </Link>
              <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Excel Tables
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Welcome back</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{user.username}</span>
             </div>
             <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <DashboardClient 
          stats={overallStats} 
          accounts={accounts} 
          transactions={recentTransactions} 
          monthlyData={monthlySummary}
          syncHistory={syncHistory}
        />
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 text-sm border-t border-slate-200 dark:border-slate-800 mt-12">
        <p>&copy; 2026 ExcelToDB Finance Hub &bull; Powered by EGDesk MCP</p>
      </footer>
    </div>
  );
}
