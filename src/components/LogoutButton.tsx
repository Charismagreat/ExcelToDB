'use client';

import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { logoutAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
    className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;
        
        setIsLoading(true);
        try {
            await logoutAction();
            // logoutAction calls redirect(), so code below may not execute
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all text-xs font-black uppercase tracking-widest ${className}`}
            title="로그아웃"
        >
            {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <LogOut size={14} />
            )}
            <span>LOGOUT</span>
        </button>
    );
}
