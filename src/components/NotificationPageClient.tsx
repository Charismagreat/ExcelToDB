'use client';

import React, { useState } from 'react';
import { 
    Check, 
    CheckCircle2, 
    Clock, 
    ExternalLink, 
    Inbox, 
    Bell, 
    Search,
    Trash2,
    Users,
    UserCheck,
    Loader2,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
    markNotificationAsReadAction, 
    markAllNotificationsAsReadAction,
    clearOldNotificationsAction,
    getAdminNotificationLogsAction
} from '@/app/actions/notification';

interface NotificationPageClientProps {
    user: any;
    initialNotifications: any[];
    initialAdminLogs?: any[];
}

type TabType = 'personal' | 'organization';

export function NotificationPageClient({ user, initialNotifications, initialAdminLogs = [] }: NotificationPageClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [notifications, setNotifications] = useState(initialNotifications);
    const [adminLogs, setAdminLogs] = useState(initialAdminLogs);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'ADMIN';

    // 개인 알림 처리
    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsReadAction(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await markAllNotificationsAsReadAction();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearRead = async () => {
        if (!confirm('읽은 알림을 모두 삭제하시겠습니까?')) return;
        setLoading(true);
        try {
            await clearOldNotificationsAction();
            setNotifications(prev => prev.filter(n => n.isRead === 0));
        } catch (err) {
            console.error('Failed to clear read notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // 관리자 모니터링 검색
    const handleAdminSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const results = await getAdminNotificationLogsAction({ searchTerm });
            setAdminLogs(results);
        } catch (err) {
            console.error('Admin search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => n.isRead === 0).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tab Navigation (Admin Only) */}
            {isAdmin && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab('personal')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Bell size={14} />
                        내 알림 관리
                    </button>
                    <button 
                        onClick={() => setActiveTab('organization')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'organization' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Users size={14} />
                        전사 알림 모니터링
                    </button>
                </div>
            )}

            {/* Personal View */}
            <AnimatePresence mode="wait">
                {activeTab === 'personal' ? (
                    <motion.div 
                        key="personal"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Bell size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">나의 알림 현황</h2>
                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Total {notifications.length}
                                </span>
                             </div>
                             <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading || unreadCount === 0}
                                    className="px-4 py-2 text-[10px] font-black bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-slate-600 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={12} />
                                    모두 읽음
                                </button>
                                <button 
                                    onClick={handleClearRead}
                                    disabled={loading}
                                    className="px-4 py-2 text-[10px] font-black bg-white border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all uppercase tracking-widest text-slate-600 flex items-center gap-2"
                                >
                                    <Trash2 size={12} />
                                    정리
                                </button>
                             </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-[400px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                                        <Inbox size={32} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">받은 알림이 없습니다</h3>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif.id}
                                            className={`p-6 hover:bg-slate-50/50 transition-all flex gap-5 border-l-4 ${
                                                notif.isRead === 0 ? 'border-blue-600 bg-blue-50/10' : 'border-transparent'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                notif.type === 'ALERT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                <Bell size={22} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 className={`text-sm font-black uppercase truncate ${notif.isRead === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase">
                                                        {new Date(notif.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">{notif.message}</p>
                                                <div className="flex items-center gap-4">
                                                    {notif.link && (
                                                        <Link href={notif.link} onClick={() => handleMarkAsRead(notif.id)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                                                            <ExternalLink size={12} /> 상세 보기
                                                        </Link>
                                                    )}
                                                    {notif.isRead === 0 && (
                                                        <button onClick={() => handleMarkAsRead(notif.id)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-slate-900">
                                                            <Check size={12} /> 읽음 처리
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="organization"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Admin Toolbar & Search */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">전사 알림 관제</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Notification Logs & Monitoring</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleAdminSearch} className="flex-1 max-w-md w-full relative">
                                <input 
                                    type="text" 
                                    placeholder="사원명, 알림 내용 검색..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <button type="submit" className="hidden" />
                            </form>
                        </div>

                        {/* Monitoring List/Table */}
                        <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Target Employee</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Notification content</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Sent Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : adminLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center text-slate-300">
                                                    <p className="text-xs font-black uppercase tracking-widest">일치하는 로그가 없습니다.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            adminLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-[10px] font-black">
                                                                {log.user.fullName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-900 uppercase">{log.user.fullName}</p>
                                                                <p className="text-[9px] font-bold text-slate-400">@{log.user.username} / {log.user.employeeId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-[11px] font-black text-slate-800 uppercase line-clamp-1">{log.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{log.message}</p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {log.isRead === 1 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-lg uppercase border border-green-100">
                                                                <UserCheck size={10} /> Read
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-lg uppercase border border-amber-100 animate-pulse">
                                                                <Bell size={10} /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                            {new Date(log.createdAt).toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
