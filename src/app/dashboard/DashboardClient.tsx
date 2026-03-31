'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search,
  Filter,
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Landmark, 
  Download,
  Calendar,
  History,
  CheckCircle2,
  AlertCircle,
  Tag,
  CreditCard,
  ChevronRight
} from 'lucide-react';

import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  stats: any;
  accounts: any;
  transactions: any;
  monthlyData: any;
  syncHistory: any;
  currentPage: number;
}

const formatCurrency = (val: number | string) => {
  if (val === undefined || val === null) return '₩0';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '₩0';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(num);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ko-KR', {
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
  syncHistory,
  currentPage = 1
}: DashboardClientProps) {
  const router = useRouter();
  
  // Debug log to trace data structure
  console.log('DEBUG: FinanceHub Input Data', { stats, accounts, transactions, monthlyData, syncHistory });

  // Handle Pagination
  const handlePageChange = (newPage: number) => {
    router.push(`/dashboard?page=${newPage}`);
  };

  // Determine total count from stats
  const totalCount = stats?.totalTransactions || stats?.counts?.transactions || stats?.transactionCount || 1000;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Safely extract arrays and normalize numbers
  const accountsArray = useMemo(() => {
    const raw = Array.isArray(accounts) ? accounts : (accounts?.accounts || []);
    return raw.map((acc: any) => ({
      ...acc,
      balance: typeof acc.balance === 'number' ? acc.balance : Number(String(acc.balance || '0').replace(/[^0-9.-]/g, ''))
    }));
  }, [accounts]);

  const transactionsArray = useMemo(() => {
    const raw = Array.isArray(transactions) ? transactions : (transactions?.transactions || []);
    return raw.map((tx: any) => {
      // Calculate virtual amount: deposit is positive, withdrawal is negative
      const deposit = typeof tx.deposit === 'number' ? tx.deposit : Number(String(tx.deposit || '0').replace(/[^0-9.-]/g, ''));
      const withdrawal = typeof tx.withdrawal === 'number' ? tx.withdrawal : Number(String(tx.withdrawal || '0').replace(/[^0-9.-]/g, ''));
      
      return {
        ...tx,
        amount: deposit - withdrawal,
        // Ensure other fields are present
        description: tx.description || tx.counterparty || tx.memo || 'Untitled Transaction'
      };
    });
  }, [transactions]);

  const syncHistoryArray = useMemo(() => Array.isArray(syncHistory) ? syncHistory : (syncHistory?.syncOperations || []), [syncHistory]);

  // Derived Values
  const totalBalance = accountsArray.reduce((sum: number, acc: any) => sum + acc.balance, 0);
  
  // Unique Categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactionsArray.forEach((tx: any) => {
      if (tx.category) cats.add(tx.category);
    });
    return Array.from(cats);
  }, [transactionsArray]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactionsArray.filter((tx: any) => {
      const matchesSearch = (tx.description || tx.memo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAccount = selectedAccount === 'all' || tx.accountId === selectedAccount || tx.bankId === selectedAccount;
      const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
      return matchesSearch && matchesAccount && matchesCategory;
    });
  }, [transactionsArray, searchTerm, selectedAccount, selectedCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Top Summary Stats - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
           <div className="bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Landmark size={28} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Combined Balance</p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(totalBalance)}
              </h2>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
           <div className="bg-emerald-50 dark:bg-emerald-900/40 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={28} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Active Accounts</p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {accountsArray.length} <span className="text-sm font-bold text-slate-400">Connected</span>
              </h2>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
           <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-slate-600 dark:text-slate-400">
              <History size={28} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Last Synchronized</p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {syncHistoryArray[0] ? formatDateTime(syncHistoryArray[0].startTime) : 'No data'}
              </h2>
           </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
        
        {/* Table Header & Filters */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Transaction Ledger</h3>
              <p className="text-sm text-slate-500 font-medium">Viewing {filteredTransactions.length} of {transactionsArray.length} total entries</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search transactions..."
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Account Filter */}
              <select 
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="all">All Accounts</option>
                {accountsArray.map((acc: any) => (
                  <option key={acc.accountId} value={acc.accountId}>{acc.accountName || acc.accountNumber}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select 
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5 text-right">Amount</th>
                <th className="px-8 py-5">Account</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx: any, idx: number) => (
                  <tr key={idx} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(tx.date)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{tx.time || '12:00'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                          tx.amount < 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                        }`}>
                          {tx.amount < 0 ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{tx.description || tx.memo}</p>
                          <p className="text-xs text-slate-400 font-semibold">{tx.branchName || 'Online Transaction'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-base font-black tracking-tighter ${
                        tx.amount < 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[11px]">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-300" />
                        {tx.bankId}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700/50">
                        {tx.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tx.status || 'Pending'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <AlertCircle size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold">Matching transactions not found</p>
                      <button 
                        onClick={() => {setSearchTerm(''); setSelectedAccount('all'); setSelectedCategory('all');}}
                        className="mt-4 text-indigo-500 text-xs font-black uppercase hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary & Pagination */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                 <div className="w-3 h-3 rounded-full bg-emerald-500" /> Income
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                 <div className="w-3 h-3 rounded-full bg-rose-500" /> Expenses
              </div>
           </div>

           {/* Pagination Controls */}
           <div className="flex items-center gap-3">
              <button 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="rotate-180" size={18} />
              </button>
              
              <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
                Page <span className="text-indigo-600">{currentPage}</span> of {totalPages}
              </div>

              <button 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
           </div>

           <p className="text-xs font-bold text-slate-400 italic">
              Showing source data from FinanceHub total of {totalCount.toLocaleString()} records.
           </p>
        </div>
      </div>

      {/* Account Cards - Compact Grid at the bottom */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <Tag size={18} className="text-indigo-500" />
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Connected Accounts</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accountsArray.map((acc: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex justify-between items-center group cursor-default">
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{acc.bankId}</p>
                 <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase">{acc.accountName || acc.accountNumber}</p>
               </div>
               <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                 {formatCurrency(acc.balance)}
               </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
