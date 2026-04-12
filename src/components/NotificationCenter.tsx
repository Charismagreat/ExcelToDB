'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUnreadNotificationsAction } from '@/app/actions/notification';

interface NotificationCenterProps {
    variant?: 'icon' | 'card';
}

export default function NotificationCenter({ variant = 'icon' }: NotificationCenterProps) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const data = await getUnreadNotificationsAction();
            setUnreadCount(data.length);
        } catch (err) {
            console.error('Failed to fetch notification status:', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(fetchStatus, 60000); // 1분마다 갱신
        return () => clearInterval(timer);
    }, []);

    const isActive = pathname === '/notifications';

    if (variant === 'icon') {
        return (
            <Link 
                href="/notifications"
                className={`relative p-3 rounded-2xl transition-all duration-300 group ${
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                }`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-4 ring-white shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Link>
        );
    }

    return (
        <Link 
            href="/notifications"
            className={`w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group transition-all hover:bg-white hover:shadow-lg relative overflow-hidden ${
                isActive ? 'ring-2 ring-blue-500/20 bg-white shadow-lg border-blue-100' : ''
            }`}
        >
            <div className="flex items-center justify-between mb-1">
                <p className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                    Alert Center
                </p>
                <Bell size={12} className={unreadCount > 0 ? 'text-blue-600 fill-blue-600 animate-pulse' : 'text-slate-300'} />
            </div>
            <p className="text-[9px] text-slate-400 font-medium leading-normal">
                {unreadCount > 0 
                    ? `새로운 알림이 ${unreadCount}건 있습니다.` 
                    : '현재 새로운 알림이 없습니다.'}
            </p>
            {unreadCount > 0 && (
                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            )}
        </Link>
    );
}
