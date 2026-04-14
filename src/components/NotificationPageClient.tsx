'use client';

import React, { useState, useEffect } from 'react';
// 📦 EXPLICIT IMPORTS: Much more stable in Turbopack/React 19 than name-based strings
import { 
    Briefcase,
    Search,
    Bell,
    ArrowRight,
    FileText,
    CheckCircle2,
    Check,
    Clock,
    Inbox,
    Loader2,
    UserCheck
} from 'lucide-react';
import { 
    markNotificationAsReadAction, 
    markAllNotificationsAsReadAction,
    clearOldNotificationsAction,
    getAdminNotificationLogsAction
} from '@/app/actions/notification';

/**
 * 🛡️ Explicit SafeIcon: Uses actual component references to avoid "undefined" errors.
 * If the component passed is undefined, it returns a diagnostic fallback.
 */
const SafeIcon = ({ icon: Icon, isMounted, ...props }: { icon: any, isMounted: boolean, [key: string]: any }) => {
    if (!isMounted) return null;
    
    if (!Icon) {
        console.error('[DIAGNOSTIC] SafeIcon received UNDEFINED icon component');
        return <div className="w-3 h-3 rounded-full bg-red-500 opacity-50 shrink-0" title="Missing Icon" />;
    }
    
    // Check if Icon is a valid function or object (standard React Component check)
    const isComponent = typeof Icon === 'function' || typeof Icon === 'object';
    if (!isComponent) {
        console.error('[DIAGNOSTIC] Invalid icon type received:', typeof Icon);
        return <div className="w-3 h-3 rounded-full bg-amber-400 opacity-50 shrink-0" title="Invalid component" />;
    }
    
    try {
        return <Icon {...props} />;
    } catch (err) {
        return <div className="w-3 h-3 rounded-full bg-slate-300 opacity-50 shrink-0" />;
    }
};

interface BusinessWorkflowHubProps {
    user: any;
    initialNotifications: any[];
    initialAdminLogs?: any[];
}

/**
 * 🚀 BusinessWorkflowHub
 * Standardized Default Export for Stable Module Resolution
 */
export default function BusinessWorkflowHub({ user, initialNotifications, initialAdminLogs = [] }: BusinessWorkflowHubProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [adminLogs, setAdminLogs] = useState(initialAdminLogs);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setIsMounted(true);
        console.log('[DIAGNOSTIC] BusinessWorkflowHub module mounted recursively');
    }, []);

    const isAdmin = user?.role === 'ADMIN';

    // -- Event Handlers --
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

    // 🛡️ UNYIELDING MOUNT GUARD
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Control Center Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
                        <SafeIcon icon={Briefcase} isMounted={isMounted} size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight">전사 업무 관제 시스템</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Workflow Hub</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-fit">
                    <form onSubmit={handleAdminSearch} className="flex-1 md:w-80 relative">
                        <input 
                            type="text" 
                            placeholder="사원명, 업무 내용 검색..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/10 border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-md"
                        />
                        <SafeIcon icon={Search} isMounted={isMounted} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    </form>
                    <div className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
                    </div>
                </div>
            </div>

            {/* Journey View */}
            <div className="space-y-12">
                {loading ? (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-20 text-center text-slate-300">
                        <SafeIcon icon={Loader2} isMounted={isMounted} size={32} className="animate-spin mb-4 mx-auto" />
                    </div>
                ) : adminLogs.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-20 text-center text-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <SafeIcon icon={Inbox} isMounted={isMounted} size={28} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">분석된 업무 여정이 없습니다.</p>
                    </div>
                ) : (
                    Object.entries(
                        adminLogs.reduce((acc: any, log: any) => {
                            const reportMatch = log.title?.match(/\[(.*?)\]/);
                            const reportName = reportMatch ? reportMatch[1] : 'SYSTEM';
                            const summaryMatch = log.message?.match(/\[(.*?)\]/);
                            const summary = summaryMatch ? summaryMatch[1] : '';
                            const key = `${reportName}_${summary || log.link}`;
                            if (!acc[key]) acc[key] = { reportName, summary, logs: [] };
                            acc[key].logs.push(log);
                            return acc;
                        }, {})
                    ).map(([groupKey, group]: [string, any]) => (
                        <div key={groupKey} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8 px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative z-10">
                                <div className="flex items-center gap-3 text-slate-900 font-black uppercase text-[13px]">
                                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                                        <SafeIcon icon={Briefcase} isMounted={isMounted} size={14} />
                                    </div>
                                    {group.reportName}
                                </div>
                                {group.summary && (
                                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-[11px] font-bold border border-indigo-100">
                                        <SafeIcon icon={FileText} isMounted={isMounted} size={12} /> {group.summary}
                                    </div>
                                )}
                                <div className="ml-auto flex items-center gap-3 border-l pl-4 border-slate-100">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{group.logs.length} Steps Logged</span>
                                </div>
                            </div>

                            <div className="ml-12 border-l-2 border-slate-100 pl-12 space-y-0">
                                {group.logs.map((log: any) => (
                                    <div key={log.id} className="relative pb-12 last:pb-0">
                                        <div className={`absolute -left-[59px] top-0 w-8 h-8 rounded-xl border-4 border-white shadow-lg flex items-center justify-center rotate-45 ${
                                            log.type === 'ACTIVITY' ? 'bg-slate-900' : 'bg-blue-500'
                                        }`}>
                                            <div className="-rotate-45">
                                                <SafeIcon icon={log.type === 'ACTIVITY' ? ArrowRight : Bell} isMounted={isMounted} size={12} className="text-white" />
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-100 rounded-[24px] p-7 shadow-sm">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-sm">
                                                        {log.user.fullName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[13px] font-black text-slate-900">{log.user.fullName}</span>
                                                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                                                                log.type === 'ACTIVITY' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'
                                                            }`}>
                                                                {log.type === 'ACTIVITY' ? 'SENDER' : 'RECEIVER'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] font-bold text-slate-700">{log.title}</p>
                                                        <p className="text-[11px] text-slate-400 mt-1">{log.message}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-2">
                                                    {log.taskStatus && (
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-100">
                                                            {log.taskStatus === 'DONE' ? <SafeIcon icon={CheckCircle2} isMounted={isMounted} size={12} className="text-emerald-500" /> : <SafeIcon icon={Clock} isMounted={isMounted} size={12} />}
                                                            {log.taskStatus}
                                                        </div>
                                                    )}
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
