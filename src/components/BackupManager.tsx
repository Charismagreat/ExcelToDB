'use client';

import React, { useState, useEffect } from 'react';
import { 
    Database, 
    Upload, 
    Download, 
    Trash2, 
    History, 
    Plus, 
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    FileJson,
    Loader2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getBackupsAction, 
    createBackupAction, 
    restoreBackupAction, 
    deleteBackupAction,
    downloadBackupAction, // 추가
    uploadBackupAction // 추가
} from '@/app/actions/backup';
import { getSystemSettingsAction, updateSystemSettingsAction } from '@/app/actions/system';
import { SystemSettings } from '@/lib/services/system-config-service';
import PageHeader from '@/components/PageHeader';
import { Calendar, Clock } from 'lucide-react';

export default function BackupManager() {
    const [backups, setBackups] = useState<any[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showConfirmRestore, setShowConfirmRestore] = useState<string | null>(null);

    const fetchBackups = async () => {
        setIsLoading(true);
        try {
            const data = await getBackupsAction();
            setBackups(data);
        } catch (error) {
            console.error('백업 목록 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const data = await getSystemSettingsAction();
            setSettings(data);
        } catch (error) {
            console.error('설정 로드 실패:', error);
        }
    };

    useEffect(() => {
        fetchBackups();
        fetchSettings();
    }, []);

    const handleCreateBackup = async () => {
        setIsActionLoading(true);
        try {
            await createBackupAction();
            await fetchBackups();
        } catch (error) {
            alert('백업 생성 실패: ' + (error as any).message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRestore = async (filename: string) => {
        setIsActionLoading(true);
        try {
            const res = await restoreBackupAction(filename);
            if (res.success) {
                alert('시스템이 성공적으로 복구되었습니다. 페이지가 새로고침됩니다.');
                window.location.reload();
            }
        } catch (error) {
            alert('복구 실패: ' + (error as any).message);
        } finally {
            setIsActionLoading(false);
            setShowConfirmRestore(null);
        }
    };

    const handleToggleSchedule = async () => {
        if (!settings) return;
        const newEnabled = !settings.backupScheduleEnabled;
        setIsActionLoading(true);
        try {
            const res = await updateSystemSettingsAction({ backupScheduleEnabled: newEnabled });
            if (res.success) {
                setSettings({ ...settings, backupScheduleEnabled: newEnabled });
            }
        } catch (error) {
            alert('설정 저장 실패');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteBackup = async (filename: string) => {
        if (!confirm('정말 이 백업 파일을 삭제하시겠습니까?')) return;
        setIsActionLoading(true);
        try {
            await deleteBackupAction(filename);
            await fetchBackups();
        } catch (error) {
            alert('삭제 실패');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDownload = async (filename: string) => {
        setIsActionLoading(true);
        try {
            const res = await downloadBackupAction(filename);
            if (res.success && res.content) {
                const blob = new Blob([res.content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            alert('다운로드 실패');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsActionLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                await uploadBackupAction(file.name, content);
                alert('백업 파일이 성공적으로 업로드되었습니다.');
                await fetchBackups();
            } catch (error) {
                alert('업로드 실패: ' + (error as any).message);
            } finally {
                setIsActionLoading(false);
                // input 초기화
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Scheduling Config Section */}
            <div className="bg-slate-900 rounded-[40px] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${settings?.backupScheduleEnabled ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-800 text-slate-50'}`}>
                            <Clock size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Automated Snapshot Schedule</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                {settings?.backupScheduleEnabled 
                                    ? `활성화됨: 매주 월-토 새벽 3시 (최대 10개 보관)` 
                                    : '자동 백업이 비활성화되어 있습니다'}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleToggleSchedule}
                        disabled={isActionLoading || !settings}
                        className={`px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${
                            settings?.backupScheduleEnabled 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                    >
                        {settings?.backupScheduleEnabled ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {settings?.backupScheduleEnabled ? 'Schedule Active' : 'Enable Auto-Backup'}
                    </button>
                </div>
            </div>
            {/* Header / Stats */}
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                        <History size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Database Snapshot Center</h2>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">마지막 백업으로부터 시스템을 안전하게 보호하세요</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <input 
                        type="file" 
                        id="backup-upload" 
                        className="hidden" 
                        accept=".json"
                        onChange={handleFileUpload}
                    />
                    <label 
                        htmlFor="backup-upload"
                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                    >
                        <Upload size={16} />
                        Upload Snapshot
                    </label>

                    <button 
                        onClick={handleCreateBackup}
                        disabled={isActionLoading}
                        className="group relative px-8 py-5 bg-slate-900 hover:bg-black text-white rounded-[24px] font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 overflow-hidden"
                    >
                        <div className="flex items-center gap-3">
                            {isActionLoading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={3} />}
                            <span>Create New Snapshot</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Backup List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-[40px] h-64 animate-pulse border border-slate-50" />
                    ))
                ) : backups.length === 0 ? (
                    <div className="col-span-full bg-slate-50 rounded-[40px] p-20 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <Database size={48} className="text-slate-200 mb-6" />
                        <p className="text-xl font-black text-slate-400 uppercase tracking-tight">저장된 백업이 없습니다</p>
                        <p className="text-sm font-bold text-slate-300 mt-2 uppercase">첫 번째 스냅샷을 생성하여 데이터를 보호하세요</p>
                    </div>
                ) : (
                    backups.map((backup) => (
                        <motion.div 
                            key={backup.name}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-10 transition-colors group-hover:bg-blue-50" />
                            
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-white transition-all duration-500">
                                        <FileJson size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleDownload(backup.name)}
                                            className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Download to PC"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteBackup(backup.name)}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase truncate mb-1">
                                        {backup.name.split('_').slice(1).join('_').replace('.json', '')}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">{formatSize(backup.size)}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span>JSON Format</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 mt-4">
                                        {new Date(backup.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <button 
                                    onClick={() => setShowConfirmRestore(backup.name)}
                                    className="mt-8 w-full py-4 bg-slate-50 hover:bg-blue-600 text-slate-900 hover:text-white rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Upload size={14} strokeWidth={3} />
                                    Restore Data
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Restore Confirmation Modal */}
            <AnimatePresence>
                {showConfirmRestore && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-3xl border border-slate-200"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-red-100 rounded-[28px] flex items-center justify-center text-red-600 mb-8 border-4 border-red-50">
                                    <AlertTriangle size={36} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">Are you absolutely sure?</h2>
                                <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
                                    복구 작업을 시작하면 현재 데이터베이스의 모든 테이블이 삭제되고 <br/>
                                    <span className="text-slate-900 font-black">"{showConfirmRestore}"</span> 시점의 정보로 덮어씌워집니다.<br/>
                                    이 작업은 되돌릴 수 없습니다.
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button 
                                        onClick={() => setShowConfirmRestore(null)}
                                        className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleRestore(showConfirmRestore)}
                                        disabled={isActionLoading}
                                        className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-[20px] text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                                    >
                                        {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} strokeWidth={3} />}
                                        Restore Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
