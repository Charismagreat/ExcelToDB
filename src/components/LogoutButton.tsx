'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
    className?: string;
}

/**
 * 🚀 LogoutButton
 * Standardized Default Export for Absolute Module Resolution
 */
export default function LogoutButton({ className }: LogoutButtonProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = async () => {
        if (!confirm('정말 로그아웃 하시겠습니까?')) return;
        
        setIsLoading(true);
        try {
            await logoutAction();
            localStorage.clear();
            sessionStorage.clear();
            router.replace('/login');
            router.refresh();
        } catch (error) {
            console.error('[CLIENT DEBUG] LogoutButton error:', error);
            router.replace('/login');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all text-xs font-black uppercase tracking-widest ${className}`}
            title="로그아웃"
        >
            {isLoading ? (
                <Loader2 size={14} className="animate-spin text-red-500" />
            ) : (
                <LogOut size={14} />
            )}
            <span>로그아웃</span>
        </button>
    );
}
