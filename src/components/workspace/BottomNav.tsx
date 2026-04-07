'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Bell, Settings } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const tabs = [
        { name: '홈', href: '/workspace', icon: <Home size={24} /> },
        { name: '할일', href: '/workspace/todo', icon: <ClipboardList size={24} /> },
        { name: '알림', href: '/workspace/notifications', icon: <Bell size={24} /> },
        { name: '설정', href: '/workspace/settings', icon: <Settings size={24} /> },
    ];

    return (
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link 
                            key={tab.name} 
                            href={tab.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-medium">{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
