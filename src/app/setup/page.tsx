'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Rocket, 
    CheckCircle2, 
    Building2, 
    Sparkles, 
    ArrowRight, 
    Database, 
    LayoutDashboard,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { createScaffoldTableAction } from '@/app/actions/setup';

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        companyName: '',
        logoUrl: '',
        themeColor: '#2563eb',
        businessContext: ''
    });

    const [aiSchema, setAiSchema] = useState<any>(null);
    const [suggestedTableName, setSuggestedTableName] = useState('');
    const [tableCreated, setTableCreated] = useState(false);

    const handleAnalyzeExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');
        const formDataPayload = new FormData();
        formDataPayload.append('file', file);

        try {
            const res = await fetch('/api/setup/analyze-excel', {
                method: 'POST',
                body: formDataPayload
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setAiSchema(data.schema);
            setSuggestedTableName(data.tableName);
            setStep(4); // Move to review step
        } catch (err: any) {
            setError('엑셀 분석 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateScaffold = async () => {
        if (!suggestedTableName || !aiSchema) return;
        
        setLoading(true);
        setError('');
        
        try {
            const res = await createScaffoldTableAction(suggestedTableName, aiSchema);
            if (!res.success) throw new Error(res.error);
            
            setTableCreated(true);
            setStep(3); // To Summary
        } catch (err: any) {
            setError('테이블 생성 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/setup/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Initialization failed');

            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">
            {/* Header / Logo */}
            <div className="mb-12 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-primary p-3 rounded-2xl text-white shadow-xl shadow-primary/30">
                    <Rocket size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic">EGDesk SETUP</h1>
            </div>

            <main className="w-full max-w-xl bg-white border border-slate-100 rounded-[48px] shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Progress Bar */}
                <div className="flex h-1.5 w-full bg-slate-100">
                    <div 
                        className="bg-primary transition-all duration-500" 
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <div className="p-12 space-y-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">회사의 이름을 알려주세요</h2>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">준비된 기업 환경에서 당신의 비즈니스를 시작해 보세요.</p>
                            </div>
                            
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">COMPANY NAME</label>
                                    <input 
                                        type="text"
                                        placeholder="예: 원컨덕터 (OneConductor)"
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-bold placeholder:text-slate-300 transition-all"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={() => setStep(2)}
                                disabled={!formData.companyName}
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-95 disabled:opacity-30"
                            >
                                NEXT STEP <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">기존 데이터를 연결할까요?</h2>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">준비된 엑셀 파일이 있다면 AI가 구조를 즉시 분석해 드립니다.</p>
                            </div>

                            <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[40px] p-12 hover:border-primary/30 transition-all group cursor-pointer relative min-h-[240px]">
                                {loading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 size={48} className="text-primary animate-spin" />
                                        <p className="font-black text-primary animate-pulse uppercase tracking-widest">AI 분석 중...</p>
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="file" 
                                            accept=".xlsx, .xls, .csv"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleAnalyzeExcel}
                                        />
                                        <div className="bg-slate-50 p-6 rounded-full text-slate-300 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                            <Database size={48} />
                                        </div>
                                        <p className="mt-4 font-black text-slate-400 group-hover:text-primary text-center">여기에 파일을 드래그하거나<br/>클릭하여 업로드하세요</p>
                                    </>
                                )}
                            </div>

                            <button 
                                onClick={() => setStep(3)}
                                className="w-full py-5 text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-all"
                            >
                                파일 없이 일단 시작하기
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI 분석 설계도</h2>
                                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">GEMINI 2.0</div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">AI가 업로드한 파일을 분석하여 최적의 테이블 스펙을 제안했습니다.</p>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {aiSchema?.map((col: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-primary border">
                                                {col.type.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">{col.name}</p>
                                                <p className="font-bold text-slate-800">{col.displayName}</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black opacity-30 uppercase">{col.type}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setStep(2)}
                                    className="px-6 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    RETRY
                                </button>
                                <button 
                                    onClick={handleCreateScaffold}
                                    disabled={loading}
                                    className="flex-1 py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? '생성 중...' : '테이블 구축 승인'} <CheckCircle2 size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">준비가 완료되었습니다!</h2>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">환영합니다. 당신만을 위한 비즈니스 허브가 준비되었습니다.</p>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-[32px] border border-dashed space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COMPANY</p>
                                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{formData.companyName}</p>
                                    </div>
                                </div>
                                {tableCreated && (
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">DATA ASSET</p>
                                            <p className="text-sm font-bold text-slate-700">지능형 테이블 구축이 완료되었습니다.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-red-500 text-[10px] font-black p-4 bg-red-50 rounded-2xl text-center italic">{error}</p>}

                            <button 
                                onClick={handleInitialize}
                                disabled={loading}
                                className="w-full py-6 bg-slate-900 text-white rounded-[40px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl shadow-slate-900/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Launching...' : 'LAUNCH DASHBOARD'} <LayoutDashboard size={24} />
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <footer className="mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-2">
                POWERED BY EGDesk AI ARCHITECTURE <Sparkles size={12} />
            </footer>
        </div>
    );
}
