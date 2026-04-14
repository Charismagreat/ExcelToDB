'use client';

import React, { useState } from 'react';
import { 
    Users, 
    Upload, 
    Download, 
    Search, 
    Building2, 
    UserPlus, 
    User,
    Edit2, 
    Shield, 
    X,
    CheckCircle2,
    AlertCircle,
    Building,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { syncOrganizationExcelAction } from '@/app/actions/organization';

interface OrganizationManagerProps {
    initialDepartments: any[];
    initialMembers: any[];
}

export function OrganizationManager({ initialDepartments, initialMembers }: OrganizationManagerProps) {
    const [departments, setDepartments] = useState(initialDepartments);
    const [members, setMembers] = useState(initialMembers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);

    // Filtered members
    const filteredMembers = members.filter((m: any) => 
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSyncing(true);
        setSyncResult(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const result = await syncOrganizationExcelAction(jsonData);
            if (result.success) {
                setSyncResult({
                    type: 'success',
                    message: `조직 동기화 완료: 신규 ${result.stats?.inserted}명, 수정 ${result.stats?.updated}명, 부서 ${result.stats?.deptsCreated}개 생성`
                });
                // 페이지 새로고침 없이 간단하게 결과 알림 후 나중에 리프레시 유도하거나 리로드
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (err: any) {
            setSyncResult({
                type: 'error',
                message: `동기화 실패: ${err.message}`
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const stats = {
        totalDepts: departments.length,
        totalMembers: members.length,
        admins: members.filter((m: any) => m.role === 'ADMIN').length,
        positions: new Set(members.map((m: any) => m.position).filter(Boolean)).size
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* 1. Stats Grid - Unified with Workflow Hub Design */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: '전체 부서', count: stats.totalDepts, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: '전체 구성원', count: stats.totalMembers, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: '관리자 계정', count: stats.admins, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: '직무 유형', count: stats.positions, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                        </div>
                        <div className={`${s.bg} ${s.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                            <s.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Excel Sync & Search Bar - Unified with Workflow Hub Monitor Bar */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6 border-l-8 border-l-blue-600">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                        <Building size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">전사 조직 동기화 서버</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Organization Master Sync</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-fit">
                    <div className="relative flex-1 xl:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                            type="text"
                            placeholder="이름, 부서 또는 사원번호 검색..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-slate-100 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <label className="relative group cursor-pointer">
                        <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={isSyncing}
                        />
                        <div className={`px-6 py-3 rounded-2xl ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-gray-900 text-white hover:bg-black'} text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2`}>
                            {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                            {isSyncing ? 'Syncing...' : 'Excel Upload'}
                        </div>
                    </label>

                    <div className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> SYNC READY
                    </div>
                </div>
            </div>

            {/* Sync Result Toast-like notification */}
            <AnimatePresence>
                {syncResult && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`p-6 rounded-[24px] flex items-center gap-4 border ${syncResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}
                    >
                        <div className={`p-2 rounded-full ${syncResult.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {syncResult.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        </div>
                        <span className="text-sm font-bold">{syncResult.message}</span>
                        <button onClick={() => setSyncResult(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={16}/></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Member List Table - Premium Refinement */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                <th className="px-10 py-6">Member Information</th>
                                <th className="px-10 py-6">Department</th>
                                <th className="px-10 py-6">Position</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMembers.map((member: any) => (
                                <motion.tr 
                                    layout
                                    key={member.id}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {member.fullName?.[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">{member.fullName}</span>
                                                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                                                        member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID: {member.employeeId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full w-fit border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 transition-colors">
                                            <Building2 size={12} className="text-slate-400 group-hover:text-blue-500" />
                                            <span className="text-[11px] font-black text-slate-600 group-hover:text-blue-700 transition-colors uppercase tracking-wider">{member.departmentName || 'MISC'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                                <Briefcase size={12} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{member.position || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 ml-auto">
                                            <Edit2 size={14} />
                                            Settings
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}

                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <Users size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">검색 결과가 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
