'use client';

import React, { useState } from 'react';
import { 
    Zap, 
    MessageSquare, 
    CheckCircle2, 
    XCircle, 
    User, 
    Calendar, 
    ArrowRight,
    Loader2,
    ShieldAlert,
    BrainCircuit,
    Bell
} from 'lucide-react';
import { decideSteeringActionAction } from '@/app/actions/workflow-steering';

interface SteeringHubClientProps {
    initialPendings: any[];
    users: any[];
}

export function SteeringHubClient({ initialPendings, users }: SteeringHubClientProps) {
    const [pendings, setPendings] = useState(initialPendings);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
        setProcessingId(id);
        try {
            await decideSteeringActionAction(id, decision);
            setPendings(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert('조치 처리 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    if (pendings.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] p-20 flex flex-col items-center justify-center text-center gap-6">
                <div className="p-6 bg-white rounded-full shadow-xl shadow-gray-200">
                    <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">대기 중인 지휘 조치가 없습니다.</h3>
                    <p className="text-gray-500 font-medium max-w-sm">모든 데이터 등록에 대한 사후 분석 및 추천 조치가 완료되었습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {pendings.map((item) => {
                const rec = item.recommendation;
                const assignee = users.find(u => u.id === rec.task?.assigneeId);
                
                return (
                    <div 
                        key={item.id} 
                        className="bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-gray-900/5 overflow-hidden flex flex-col group transition-all hover:border-blue-200"
                    >
                        {/* Header: Report Info */}
                        <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Source Report</span>
                                    <h4 className="text-lg font-black text-gray-900 tracking-tight">{item.reportName}</h4>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-50">
                                {new Date(item.createdAt).toLocaleString()}
                            </div>
                        </div>

                        {/* Analysis Section */}
                        <div className="p-8 space-y-8 flex-1">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit size={16} className="text-blue-500" />
                                    <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">AI 추천 사유 (Reasoning)</h5>
                                </div>
                                <p className="text-sm font-bold text-gray-700 leading-relaxed bg-blue-50/50 p-5 rounded-[24px] border border-blue-100/50">
                                    {item.reasoning}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Notification Card */}
                                <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Bell size={16} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Notification</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-amber-600 text-white text-[8px] font-black rounded-lg">
                                            {rec.notifyRecipients?.length || 0} RECIPIENTS
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-amber-900/70 leading-normal">
                                        {rec.notificationMessage}
                                    </p>
                                </div>

                                {/* Task Card */}
                                <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-600">
                                            <CheckCircle2 size={16} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Next Task</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h6 className="text-[11px] font-black text-indigo-900">{rec.task?.title}</h6>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400">
                                            <User size={12} />
                                            {assignee?.fullName || 'Unassigned'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Actions */}
                        <div className="p-8 pt-0 flex items-center gap-4">
                            <button 
                                onClick={() => handleDecision(item.id, 'APPROVED')}
                                disabled={!!processingId}
                                className="flex-1 py-4 bg-gray-900 text-white rounded-[20px] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processingId === item.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                승인 및 실행 (EXECUTE)
                            </button>
                            <button 
                                onClick={() => handleDecision(item.id, 'REJECTED')}
                                disabled={!!processingId}
                                className="px-6 py-4 bg-white border border-gray-100 text-gray-400 rounded-[20px] font-black text-[12px] uppercase tracking-[0.2em] hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
