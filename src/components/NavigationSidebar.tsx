'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Compass, 
  Star, 
  LogOut, 
  User as UserIcon, 
  Layers,
  ChevronRight,
  Database,
  Archive
} from 'lucide-react';
import LogoutButton from './LogoutButton';

interface NavigationSidebarProps {
  user: any;
}

export default function NavigationSidebar({ user }: NavigationSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'DASHBOARD',
      href: '/dashboard',
      icon: Star,
      active: pathname === '/dashboard',
      desc: '주요 리포트 한눈에 보기'
    },
    {
      name: 'MY DB',
      href: '/',
      icon: Database,
      active: pathname === '/',
      desc: '데이터 소스 및 테이블 관리'
    },
    {
      name: 'ANALYSIS STUDIO',
      href: '/dashboard/studio',
      icon: Compass,
      active: pathname === '/dashboard/studio',
      desc: 'AI 기반 데이터 시각화'
    },
    {
      name: 'ARCHIVE',
      href: '/archive',
      icon: Archive,
      active: pathname === '/archive',
      desc: '삭제된 테이블 관리'
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-100 flex flex-col z-[100] shadow-2xl shadow-slate-200/50">
      {/* Logo Section */}
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
            <Layers size={24} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase whitespace-nowrap">CEO DASHBOARD</h1>
            <p className="text-[11px] font-black uppercase text-blue-600 tracking-[0.2em] mt-1.5 opacity-80 whitespace-nowrap">WON CONDUCTOR</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-4">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Main Navigation</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${
              item.active 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
              : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${
              item.active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'
            }`}>
              <item.icon size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-tight">{item.name}</p>
              <p className={`text-[9px] font-medium opacity-60 ${
                item.active ? 'text-blue-100' : 'text-slate-400'
              }`}>
                {item.desc}
              </p>
            </div>
            {item.active && (
              <div className="absolute right-4 animate-in fade-in slide-in-from-left-2">
                 <ChevronRight size={14} />
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* User Support / Misc (Optional) */}
      <div className="px-8 py-6 border-b border-dashed border-slate-100">
         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group cursor-help transition-all hover:bg-white hover:shadow-lg">
            <p className="text-[10px] font-black text-slate-800 uppercase mb-1">AI Help Center</p>
            <p className="text-[9px] text-slate-400 font-medium">데이터 분석이 어렵다면 언제든 AI에게 물어보세요.</p>
         </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 bg-slate-50/50">
        <div className="flex items-center gap-4 px-4 py-4 bg-white rounded-[24px] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <UserIcon size={20} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black text-slate-900 truncate uppercase">{user?.username}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user?.role}</p>
          </div>
          <LogoutButton className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors border-none shadow-none text-transparent" />
        </div>
        <div className="mt-4 flex justify-center">
            <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
