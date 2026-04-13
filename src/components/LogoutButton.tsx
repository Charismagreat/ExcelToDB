'use client';

import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
    className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        if (!confirm('정말 로그아웃 하시겠습니까?')) return;
        
        setIsLoading(true);
        console.log('[CLIENT DEBUG] Shared LogoutButton: starting process...');
        try {
            // 1. 서버 세션 종료 (쿠키 파기)
            await logoutAction();
            
            // 2. 클라이언트 사이드 보조 청소
            localStorage.clear();
            sessionStorage.clear();

            // 3. 리다이렉트 및 새로고침
            console.log('[CLIENT DEBUG] Shared LogoutButton: redirecting...');
            router.replace('/login');
            router.refresh();
        } catch (error) {
            console.error('[CLIENT DEBUG] Shared LogoutButton error:', error);
            // 에러가 발생해도 세션 만료를 가정하고 로그인 페이지로 시도
            router.replace('/login');
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
            <span>로그아웃</span>
        </button>
    );
}


