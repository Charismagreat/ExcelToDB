'use client';

import React, { useState, useRef } from 'react';
import { Mic, Camera, Send, Loader2, CheckCircle2, X } from 'lucide-react';

interface FieldReportSectionProps {
    deptId: string;
}

export function FieldReportSection({ deptId }: FieldReportSectionProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Start Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
            };

            recorder.start();
            setIsRecording(true);
            setStatus(null);
        } catch (err) {
            console.error("Recording start error:", err);
            alert("마이크 접근 권한이 필요합니다.");
        }
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    // Handle Image Capture
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setImageFile(e.target.files[0]);
            setStatus(null);
        }
    };

    // Submit to AI
    const handleSubmit = async () => {
        if (!audioBlob) return;

        setIsUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'report.wav');
        if (imageFile) formData.append('image', imageFile);
        formData.append('deptId', deptId);

        try {
            const res = await fetch('/api/ai/analyze-field', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setStatus({ type: 'success', message: `보고 완료: ${data.aiSummary}` });
                setAudioBlob(null);
                setImageFile(null);
                // Refresh data (Optionally use router.refresh())
                setTimeout(() => window.location.reload(), 2000);
            } else {
                throw new Error(data.error || "분석 실패");
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl shadow-indigo-600/20 mb-12 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                    <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                        <Mic size={20} className={isRecording ? "animate-ping text-red-400" : "animate-pulse"} />
                        {isRecording ? "녹음 중입니다..." : audioBlob ? "음성 보고 준비 완료" : "현장 즉시 업무 보고"}
                    </h3>
                    <p className="text-blue-100 text-sm font-medium">
                        {status ? status.message : "음성 메시지를 보내면 AI가 분석하여 태스크를 생성합니다."}
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    {/* Image Capture Input (Hidden) */}
                    <input 
                        type="file" 
                        id="field-camera" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        onChange={handleImageChange}
                    />
                    
                    <label 
                        htmlFor="field-camera"
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm cursor-pointer transition-all ${
                            imageFile ? 'bg-emerald-500 text-white' : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
                        }`}
                    >
                        <Camera size={20} />
                        {imageFile ? '사진 첨부됨' : '사진 촬영'}
                    </label>

                    {!audioBlob ? (
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl ${
                                isRecording 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-white text-indigo-700 hover:scale-105 active:scale-95'
                            }`}
                        >
                            <Mic size={20} />
                            {isRecording ? '녹음 중단' : '음성 녹음'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setAudioBlob(null)}
                                className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isUploading}
                                className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-black text-sm hover:scale-105 disabled:opacity-50 shadow-xl"
                            >
                                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                {isUploading ? '분석 중...' : '보고 전송'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {status?.type === 'success' && (
                <div className="absolute inset-0 bg-emerald-600 flex items-center justify-center gap-3 text-white font-black animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 size={32} />
                    <span>{status.message}</span>
                </div>
            )}
        </div>
    );
}
