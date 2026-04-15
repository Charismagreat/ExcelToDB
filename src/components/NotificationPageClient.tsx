'use client';

import React, { useState, useEffect } from 'react';
// 📦 EXPLICIT IMPORTS: Much more stable in Turbopack/React 19 than name-based strings
import { 
    TrendingUp,
    Mic,
    Camera,
    Plus,
    ChevronRight,
    ArrowLeft,
    FastForward,
    Compass,
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
    getAdminNotificationLogsAction,
    previewWorkspaceTestDataPurgeAction,
    purgeWorkspaceTestDataAction
} from '@/app/actions/notification';
import { FieldReportSection } from '@/components/FieldReportSection';
import { Filter } from 'lucide-react';

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
    departments?: any[];
}

/**
 * 🚀 BusinessWorkflowHub
 * Standardized Default Export for Stable Module Resolution
 */
export default function BusinessWorkflowHub({ user, initialNotifications, initialAdminLogs = [], departments = [] }: BusinessWorkflowHubProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [adminLogs, setAdminLogs] = useState(initialAdminLogs);
    const [loading, setLoading] = useState(false);
    const [isPurgingTestData, setIsPurgingTestData] = useState(false);
    const [isPreviewingPurge, setIsPreviewingPurge] = useState(false);
    const [purgeDays, setPurgeDays] = useState(30);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('ALL');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = async (key: string, latestLog?: any) => {
        const isOpening = !expandedGroups[key];
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

        if (isOpening && latestLog) {
            try {
                // [중요] 상세 히스토리를 확인하는 순간 해당 작업(link)의 모든 로그를 읽음 처리함
                await markNotificationAsReadAction(latestLog.id, latestLog.link);
                window.dispatchEvent(new Event('notification:updated'));
                
                // 로컬 상태 즉시 업데이트로 실시간 반응성 확보
                if (latestLog.link) {
                    setNotifications(prev => prev.map(n => 
                        n.link === latestLog.link ? { ...n, isRead: '1' } : n
                    ));
                    setAdminLogs(prev => prev.map(n => 
                        n.link === latestLog.link ? { ...n, isRead: '1' } : n
                    ));
                }
            } catch (err) {
                console.error('Failed to mark group as read:', err);
            }
        }
    };

    const getFileTypeInfo = (text: string) => {
        const t = (text || '').toLowerCase();
        if (t.includes('.png') || t.includes('.jpg') || t.includes('.jpeg') || t.includes('.gif') || t.includes('사진') || t.includes('이미지')) {
            return { icon: Camera, color: 'text-blue-600', bg: 'bg-blue-50', label: '이미지' };
        }
        if (t.includes('.xlsx') || t.includes('.xls') || t.includes('.csv') || t.includes('엑셀')) {
            return { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '데이터' };
        }
        if (t.includes('.pdf') || t.includes('문서')) {
            return { icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50', label: '문서' };
        }
        if (t.includes('.mp3') || t.includes('.wav') || t.includes('.m4a') || t.includes('녹음') || t.includes('음성')) {
            return { icon: Mic, color: 'text-purple-600', bg: 'bg-purple-50', label: '음성' };
        }
        return { icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-50', label: '업무' };
    };

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

    const handlePurgeWorkspaceTestData = async () => {
        if (!isAdmin || isPurgingTestData) return;

        setIsPreviewingPurge(true);
        let preview: any = null;
        try {
            preview = await previewWorkspaceTestDataPurgeAction(purgeDays);
        } catch (err: any) {
            alert(err?.message || '삭제 대상 미리보기에 실패했습니다.');
            setIsPreviewingPurge(false);
            return;
        }
        setIsPreviewingPurge(false);

        const ok = window.confirm(
            `최근 ${preview.days}일 기준 삭제 미리보기\n` +
            `- 대상 항목: ${preview.targetItems}건\n` +
            `- 연관 알림: ${preview.targetNotifications}건\n` +
            `- 연관 파일: ${preview.targetFiles}건\n\n` +
            '정말 일괄 삭제하시겠습니까?'
        );
        if (!ok) return;

        setIsPurgingTestData(true);
        try {
            const result = await purgeWorkspaceTestDataAction(purgeDays);
            if (result?.success) {
                const refreshed = await getAdminNotificationLogsAction({ searchTerm });
                setAdminLogs(refreshed);
                window.dispatchEvent(new Event('notification:updated'));
                alert(
                    `최근 ${result.days}일 테스트 데이터 정리 완료\n` +
                    `- 삭제된 항목: ${result.deletedItems}건\n` +
                    `- 삭제된 알림: ${result.deletedNotifications}건\n` +
                    `- 삭제된 파일: ${result.deletedFiles}건`
                );
            } else {
                alert('테스트 데이터 삭제 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert(err?.message || '테스트 데이터 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsPurgingTestData(false);
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

    // -- Stats Calculation (Option 1: Summarize from loaded data) --
    const logsToSummarize = isAdmin ? adminLogs : notifications;
    
    // Filtered Logs
    const filteredLogs = logsToSummarize.filter((log: any) => {
        if (selectedDept === 'ALL') return true;
        // In this PoC, we check if title contains the department name in brackets
        const dept = departments.find(d => d.id === selectedDept);
        return log.title?.includes(`[${dept?.name}]`) || log.message?.includes(`[${dept?.name}]`);
    });

    // 1. 로그 그룹화 (동일 작업 단위)
    const logGroups = Object.entries(
        filteredLogs.reduce((acc: any, log: any) => {
            const openItemMatch = typeof log.link === 'string' ? log.link.match(/[?&]openItem=([^&]+)/) : null;
            const wsItemId = openItemMatch ? decodeURIComponent(openItemMatch[1]) : null;
            const reportMatch = log.title?.match(/\[(.*?)\]/);
            const reportName = reportMatch ? reportMatch[1] : 'SYSTEM';
            const summaryMatch = log.message?.match(/\[(.*?)\]/) || log.message?.match(/([^\s]+?\.(png|jpg|jpeg|gif|pdf|xlsx|xls|mp3|wav|m4a))/i);
            const summary = summaryMatch ? (summaryMatch[1] || summaryMatch[0]) : '';
            
            // [수정] userId를 키에서 제외합니다. 한 작업(wsItemId)에 여러 명(기안자, 관리자)이 알림을 받아도 
            // 관리자 화면에서는 하나의 카드(작업 단위)로 병합하여 보여주기 위함입니다.
            const key = wsItemId ? `ws_${wsItemId}` : summary ? `${reportName}_${summary}` : `${reportName}_${log.link}`;
            if (!acc[key]) acc[key] = { reportName, summary, logs: [] };
            acc[key].logs.push(log);
            return acc;
        }, {} as Record<string, any>)
    ).map(([groupKey, group]: [string, any]) => {
        const sortedLogs = [...group.logs].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        // [수정] 상세 내역 내 중복 제거: 동일한 내용(title+message)의 로그는 수신자가 달라도 하나만 표시합니다.
        const seen = new Set();
        const dedupedLogs = sortedLogs.filter((log: any) => {
            const contentKey = `${log.title}_${log.message}`;
            if (seen.has(contentKey)) return false;
            seen.add(contentKey);
            return true;
        });

        const fileLog = dedupedLogs.find((l: any) => l.link && l.link.includes('/uploads/'));
        return { groupKey, ...group, sortedLogs: dedupedLogs, latestLog: fileLog || dedupedLogs[0] };
    });

    // 2. 고유 작업 단위 기반 통계 계산
    const stats = {
        total: logGroups.length,
        todo: logGroups.filter((g: any) => g.latestLog.taskStatus === 'TODO').length,
        inProgress: logGroups.filter((g: any) => g.latestLog.taskStatus === 'IN_PROGRESS').length,
        done: logGroups.filter((g: any) => g.latestLog.taskStatus === 'DONE').length,
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* 1. Field Report Section (Consolidated from Workspace) */}
            {user.role !== 'CEO' && user.role !== 'ADMIN' && (
                <FieldReportSection deptId={user.departmentId || 'GENERAL'} />
            )}

            {/* 2. Stats Grid - Unified with Department Workspace Design */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: '전체 소식', count: stats.total, icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: '진행 대기', count: stats.todo, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: '진행 중', count: stats.inProgress, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: '완료됨', count: stats.done, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                        </div>
                        <div className={`${s.bg} ${s.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                            <SafeIcon icon={s.icon} isMounted={isMounted} size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Search & Filter Bar */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-l-blue-600">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                        <SafeIcon icon={Briefcase} isMounted={isMounted} size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">지능형 업무 관제 서버</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Workflow Hub Live Monitor</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full md:w-fit">
                    {/* Department Filter (Replaces Workspace Sidebar) */}
                    <div className="relative min-w-[160px]">
                        <select 
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer"
                        >
                            <option value="ALL">전체 부서 관제</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        <SafeIcon icon={Filter} isMounted={isMounted} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    </div>

                    <form onSubmit={handleAdminSearch} className="flex-1 md:w-80 relative">
                        <input 
                            type="text" 
                            placeholder="사원명, 업무 내용 검색..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-slate-100 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <SafeIcon icon={Search} isMounted={isMounted} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </form>
                    <div className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </div>
                    {isAdmin && (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">최근</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={purgeDays}
                                    onChange={(e) => setPurgeDays(Math.max(1, Math.min(365, Number(e.target.value) || 30)))}
                                    className="w-16 px-2 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-700"
                                />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">일</span>
                            </div>
                            <button
                                onClick={async () => {
                                    if (isPreviewingPurge || isPurgingTestData) return;
                                    setIsPreviewingPurge(true);
                                    try {
                                        const preview = await previewWorkspaceTestDataPurgeAction(purgeDays);
                                        alert(
                                            `삭제 미리보기 (최근 ${preview.days}일)\n` +
                                            `- 대상 항목: ${preview.targetItems}건\n` +
                                            `- 연관 알림: ${preview.targetNotifications}건\n` +
                                            `- 연관 파일: ${preview.targetFiles}건`
                                        );
                                    } catch (err: any) {
                                        alert(err?.message || '삭제 대상 미리보기에 실패했습니다.');
                                    } finally {
                                        setIsPreviewingPurge(false);
                                    }
                                }}
                                disabled={isPreviewingPurge || isPurgingTestData}
                                className="px-4 py-2 rounded-xl bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-500/20 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                                title="삭제 대상 미리보기"
                            >
                                {isPreviewingPurge ? '미리보기...' : '삭제 미리보기'}
                            </button>
                            <button
                                onClick={handlePurgeWorkspaceTestData}
                                disabled={isPurgingTestData || isPreviewingPurge}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                                title="사원이 등록한 워크스페이스 테스트 데이터 일괄 삭제"
                            >
                                {isPurgingTestData ? '삭제 중...' : '테스트 데이터 일괄 삭제'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Journey View */}
            <div className="space-y-12">
                {loading ? (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-20 text-center text-slate-300">
                        <SafeIcon icon={Loader2} isMounted={isMounted} size={32} className="animate-spin mb-4 mx-auto" />
                    </div>
                ) : logGroups.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-20 text-center text-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <SafeIcon icon={Inbox} isMounted={isMounted} size={28} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">분석된 업무 여정이 없습니다.</p>
                    </div>
                ) : (
                    logGroups.map((group: any) => {
                        const { groupKey, sortedLogs, latestLog } = group;
                        
                        const isExpanded = !!expandedGroups[groupKey];
                        const fileInfo = getFileTypeInfo(latestLog.title + latestLog.message);
                        
                        return (
                            <div key={groupKey} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* 🛡️ 마스터 통합 카드 (Consolidated Job Card) */}
                                <div className={`bg-white border transition-all duration-300 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl ${isExpanded ? 'ring-2 ring-blue-500/10 border-blue-500/20' : 'border-slate-100'}`}>
                                    {/* 1. 카드 상단: 작업 정보 & 파일 타입 아이콘 */}
                                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-white to-slate-50/50">
                                        <div className="flex items-center gap-6">
                                            {/* 파일 타입 아이콘 (클릭 시 링크 이동) */}
                                            {(() => {
                                                const basePath = process.env.NEXT_PUBLIC_EGDESK_BASE_PATH || '';
                                                const finalLink = latestLog.link 
                                                    ? (latestLog.link.startsWith('http') ? latestLog.link : `${basePath}${latestLog.link.startsWith('/') ? '' : '/'}${latestLog.link}`) 
                                                    : '#';
                                                return (
                                                    <a 
                                                        href={finalLink} 
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`${fileInfo.bg} ${fileInfo.color} w-16 h-16 rounded-2xl flex items-center justify-center border border-white shadow-inner group/icon hover:scale-105 transition-transform active:scale-95`}
                                                        title={`${fileInfo.label} 보기`}
                                                    >
                                                        <SafeIcon icon={fileInfo.icon} isMounted={isMounted} size={28} />
                                                    </a>
                                                );
                                            })()}
                                            
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-blue-100">
                                                        {group.reportName}
                                                    </span>
                                                    {group.summary && (
                                                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                                                            {group.summary}
                                                        </span>
                                                    )}
                                                    {/* 사원 정보 (상단으로 이동하여 카드 크기 최적화) */}
                                                    <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                                                        <div className="w-5 h-5 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[8px]">
                                                            {latestLog.user.fullName?.[0]}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-700">{latestLog.user.fullName}</span>
                                                    </div>

                                                    {/* 진행 단계 요약 */}
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100/50 rounded-lg border border-slate-100 ml-2">
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">
                                                            {sortedLogs.length} STEPS
                                                        </span>
                                                    </div>

                                                    {latestLog.taskStatus && (
                                                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1.5 border ml-1 ${
                                                            latestLog.taskStatus === 'DONE' 
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                            <div className={`w-1 h-1 rounded-full ${latestLog.taskStatus === 'DONE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                            {latestLog.taskStatus}
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                                                    {latestLog.title}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1 italic">
                                                    {latestLog.message}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">최종 업데이트</p>
                                                <p className="text-xs font-bold text-slate-600">
                                                    {new Date(latestLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => toggleGroup(groupKey, latestLog)}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                                    isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                            >
                                                <SafeIcon icon={isExpanded ? ChevronRight : ChevronRight} isMounted={isMounted} size={20} className={isExpanded ? "rotate-90" : "rotate-90"} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. 확장 영역: 컴팩트 히스토리 (Accordion) */}
                                    {isExpanded && (
                                        <div className="bg-slate-50/50 border-t border-slate-100 p-8 pt-6 animate-in slide-in-from-top-2 duration-300">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전체 처리 이력 (Audit Trail)</h4>
                                                <div className="h-px bg-slate-100 flex-1 ml-4" />
                                            </div>
                                            <div className="space-y-3">
                                                {sortedLogs.map((log: any, idx: number) => (
                                                    <div key={log.id} className="flex gap-4 relative">
                                                        {idx !== sortedLogs.length - 1 && (
                                                            <div className="absolute left-[7px] top-4 w-0.5 h-full bg-slate-200/50" />
                                                        )}
                                                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0 z-10 mt-1 ${
                                                            idx === 0 ? 'bg-blue-500' : 'bg-slate-300'
                                                        }`} />
                                                        <div className="flex-1 pb-4">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className={`text-[11px] font-bold ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                                                    {log.title}
                                                                </span>
                                                                <span className="text-[9px] font-medium text-slate-400">
                                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{log.message}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
