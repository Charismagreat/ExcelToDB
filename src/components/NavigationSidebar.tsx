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
import { LogoutButton } from './LogoutButton';
import { NotificationCenter } from './NotificationCenter';

interface NavigationSidebarProps {
  user: any;
  departments: any[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function NavigationSidebar({ user, departments, isCollapsed = false, onToggle }: NavigationSidebarProps) {
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
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col z-[100] shadow-2xl shadow-slate-200/50 transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-blue-600 hover:text-white transition-all z-[110]"
          title={isCollapsed ? "펼치기" : "접기"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <div className="rotate-180"><ChevronRight size={14} /></div>}
        </button>
      )}

      {/* Logo Section */}
      <div className={`p-8 pb-4 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
            <Layers size={24} strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-in fade-in slide-in-from-left-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase whitespace-nowrap">CEO DASHBOARD</h1>
              <p className="text-[11px] font-black uppercase text-blue-600 tracking-[0.2em] mt-1.5 opacity-80 whitespace-nowrap">WON CONDUCTOR</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 px-4 space-y-2 overflow-y-auto pt-4 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Main Navigation</p>}
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.name : ""}
            className={`flex items-center gap-4 py-4 rounded-2xl transition-all duration-300 group relative ${
              isCollapsed ? 'px-0 justify-center' : 'px-4'
            } ${
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
            {!isCollapsed && (
              <div className="flex-1 animate-in fade-in slide-in-from-left-2">
                <p className="text-xs font-black uppercase tracking-tight">{item.name}</p>
                <p className={`text-[9px] font-medium opacity-60 ${
                  item.active ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {item.desc}
                </p>
              </div>
            )}
            {item.active && !isCollapsed && (
              <div className="absolute right-4 animate-in fade-in slide-in-from-left-2">
                 <ChevronRight size={14} />
              </div>
            )}
          </Link>
        ))}

        {/* Departments (ORG) Section */}
        <div className={`pt-8 pb-4 ${isCollapsed ? 'pt-4' : ''}`}>
            {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Work Office (ORG)</p>}
            <div className="space-y-1">
                {(Array.isArray(departments) ? departments : []).map((dept) => {
                    const isActive = pathname === `/workspace/${dept.id}`;
                    return (
                        <Link
                            key={dept.id}
                            href={`/workspace/${dept.id}`}
                            title={isCollapsed ? dept.name : ""}
                            className={`flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group ${
                                isCollapsed ? 'px-0 justify-center' : 'px-4'
                            } ${
                                isActive 
                                ? 'bg-indigo-50 text-indigo-700 font-bold' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                            }`}>
                                <Layers size={14} />
                            </div>
                            {!isCollapsed && <span className="text-[11px] uppercase tracking-tight font-black animate-in fade-in slide-in-from-left-2">{dept.name}</span>}
                            {isActive && !isCollapsed && <div className="ml-auto w-1 h-1 bg-indigo-600 rounded-full" />}
                        </Link>
                    );
                })}
            </div>
        </div>
      </nav>

      {/* User Support / Misc */}
      <div className={`px-6 py-6 space-y-4 border-t border-slate-50 ${isCollapsed ? 'px-2' : ''}`}>
         {isCollapsed ? (
             <div className="flex justify-center">
                 <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Compass size={18} />
                 </div>
             </div>
         ) : (
             <>
                <NotificationCenter variant="card" />
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group cursor-help transition-all hover:bg-white hover:shadow-lg flex flex-col">
                    <p className="text-[10px] font-black text-slate-800 uppercase mb-1">AI Help Center</p>
                    <p className="text-[9px] text-slate-400 font-medium leading-tight">데이터 분석이 어렵다면 언제든 AI에게 물어보세요.</p>
                </div>
             </>
         )}
      </div>

      {/* User Profile Section */}
      <div className={`p-6 bg-slate-50/50 ${isCollapsed ? 'p-2' : ''}`}>
        <div className={`flex items-center bg-white rounded-[24px] border border-slate-100 shadow-sm transition-all duration-300 ${
          isCollapsed ? 'justify-center p-2' : 'gap-4 px-4 py-4'
        }`}>
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <UserIcon size={20} />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2">
                <p className="text-xs font-black text-slate-900 truncate uppercase">{user?.username}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user?.role}</p>
              </div>
              <LogoutButton className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border-none" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}


