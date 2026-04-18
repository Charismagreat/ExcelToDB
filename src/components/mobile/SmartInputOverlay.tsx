'use client';

import React, { useState } from 'react';
import { X, Check, Save, Table as TableIcon, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createScaffoldTableAction } from '@/app/actions/setup';
import { insertRows } from '@/egdesk-helpers';

interface SmartInputOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    analysisResult: any | null; // result from processSmartInput
    isAnalyzing: boolean;
}

export function SmartInputOverlay({ isOpen, onClose, analysisResult, isAnalyzing }: SmartInputOverlayProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!analysisResult) return;
        setIsSaving(true);
        try {
            const { match, data } = analysisResult;

            if (match.type === 'template') {
                // 1. Create table first
                const createRes = await createScaffoldTableAction(match.id, match.schema);
                if (!createRes.success) throw new Error('Table creation failed');
            }

            // 2. Insert row
            await insertRows(match.type === 'template' ? match.id : match.id, [data]);
            
            setSaveStatus('success');
            setTimeout(() => {
                onClose();
                setSaveStatus('idle');
            }, 1500);
        } catch (error) {
            console.error('[SmartInputOverlay] Save error:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl px-6 pt-12 pb-8 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles size={18} />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900">AI 스마트 입력</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className="animate-spin text-primary" />
                        <p className="text-sm font-bold text-slate-500 animate-pulse">지능형 분석 및 전표 파싱 중...</p>
                    </div>
                ) : analysisResult ? (
                    <div className="flex-1 overflow-y-auto space-y-8 pr-1 custom-scrollbar">
                        {/* Match Info Card */}
                        <div className="bg-primary/5 border border-primary/20 p-5 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TableIcon size={64} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1 block">
                                {analysisResult.match.type === 'template' ? '표준 템플릿 제안' : '기존 테이블 매칭'}
                            </span>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{analysisResult.match.displayName}</h3>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                                "{analysisResult.reasoning}"
                            </p>
                        </div>

                        {/* Extracted Data Form */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">추출된 데이터 내역</h4>
                            <div className="grid gap-4">
                                {Object.entries(analysisResult.data).map(([key, value]: [string, any]) => {
                                    const colInfo = analysisResult.match.schema?.find((s: any) => s.name === key);
                                    return (
                                        <div key={key} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                                                {colInfo?.displayName || key}
                                            </label>
                                            <div className="text-sm font-bold text-slate-800">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">
                        분속된 결과가 없습니다.
                    </div>
                )}

                {/* Footer Action */}
                <div className="pt-6">
                    <button
                        onClick={handleConfirm}
                        disabled={!analysisResult || isAnalyzing || isSaving}
                        className={cn(
                            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-[0.98]",
                            saveStatus === 'success' 
                                ? "bg-green-500 text-white" 
                                : "bg-primary text-white shadow-xl shadow-primary/20"
                        )}
                    >
                        {isSaving ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : saveStatus === 'success' ? (
                            <>
                                <Check size={24} />
                                <span>처리 완료!</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>{analysisResult?.match.type === 'template' ? '테이블 생성 후 저장' : '데이터 즉시 전송'}</span>
                            </>
                        )}
                    </button>
                    {saveStatus === 'error' && (
                        <p className="text-center text-xs text-red-500 font-bold mt-2">저장 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
