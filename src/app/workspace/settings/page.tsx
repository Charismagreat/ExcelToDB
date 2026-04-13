'use client';

import React from 'react';
import { User, Bell, MapPin, Shield, HelpCircle, LogOut, Moon, Clock, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import SettingsItem from '@/components/workspace/SettingsItem';
import { useTheme } from '@/components/ThemeProvider';
import { getSessionAction, logoutAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = React.useState<any>(null);
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    React.useEffect(() => {
        getSessionAction().then(setUser);
    }, []);

    const handleLogout = () => {
        alert('로그아웃 버튼이 클릭되었습니다! (이벤트 연결 확인)');
        console.log('[DEBUG] Logout button clicked successfully.');
    };

    const sections = [
        {
            title: '내 계정 (Account)',
            items: [
                { icon: <User size={18} />, title: '프로필 수정', subtitle: '이름, 연락처, 부서 정보 변경' },
                { icon: <Shield size={18} />, title: '비밀번호 및 보안', subtitle: '로그인 보안 및 생체 인증 설정' }
            ]
        },
        {
            title: '화면 설정 (Appearance)',
            items: [
                { 
                    icon: <Moon size={18} />, 
                    title: '다크 모드', 
                    subtitle: '눈이 편안한 어두운 화면 사용', 
                    type: 'toggle', 
                    isOn: isDarkMode,
                    onToggle: () => toggleTheme()
                }
            ]
        },
        {
            title: '알림 설정 (Notifications)',
            items: [
                { icon: <Bell size={18} />, title: '푸시 알림', subtitle: '업무 관련 실시간 알림 받기', type: 'toggle', isOn: true },
                { icon: <Clock size={18} />, title: '근무 시간 알람', subtitle: '출근/퇴근 10분 전 알림 받기', type: 'toggle', isOn: true }
            ]
        },
        {
            title: '워크 환경 (Workspace)',
            items: [
                { icon: <MapPin size={18} />, title: '기본 출근지 설정', subtitle: '📍 현재: 본사 2층 지원팀', type: 'text', value: '변경' }
            ]
        },
        {
            title: '기타 (Others)',
            items: [
                { icon: <Smartphone size={18} />, title: '버전 정보', type: 'text', value: 'v2.1.0' },
                { icon: <HelpCircle size={18} />, title: '고객 센터 및 도움말' }
            ]
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariant = {
        hidden: { y: 10, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="max-w-xl mx-auto pb-24">
            {/* Profile Header */}
            <div className="px-4 pt-4 mb-8">
                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center text-white mb-4 border-4 border-white shadow-xl">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User size={40} />
                        )}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-1 tracking-tight">
                        {user?.fullName || '사용자'} 님
                    </h2>
                    <p className="text-xs font-bold text-gray-500 mb-4">
                        {user?.role === 'ADMIN' ? '관리자' : user?.role === 'EDITOR' ? '편집자' : '사원'} | 사번: {user?.employeeId || '미등록'}
                    </p>
                    
                    <button className="px-6 py-2 bg-white/80 border border-gray-100 rounded-xl text-xs font-black text-gray-600 shadow-sm hover:bg-white transition-all">
                        프로필 관리
                    </button>
                </div>
            </div>

            {/* Settings Sections */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {sections.map((section) => (
                    <div key={section.title} className="px-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                            {section.title}
                        </h3>
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">{section.title}</h3>
                        <div className="space-y-2">
                            {section.items.map((item) => (
                                <SettingsItem key={item.id} {...item} />
                            ))}
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Logout Section */}
            <div className="px-4 mt-8">
                <button 
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full p-4 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center space-x-2 font-bold hover:bg-red-100 transition-all border border-red-100/50 disabled:opacity-50"
                >
                    {isLoggingOut ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                    ) : (
                        <>
                            <LogOut size={18} />
                            <span>원 컨덕터 로그아웃</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
