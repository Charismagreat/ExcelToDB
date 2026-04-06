'use client';

import React, { useState, useRef } from 'react';
import { X, Mic, Camera, Send, Loader2 } from 'lucide-react';

interface AiInputOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string, file?: File | null) => Promise<void>;
}

export default function AiInputOverlay({ isOpen, onClose, onSubmit }: AiInputOverlayProps) {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!inputText.trim() && !selectedFile) return;
        setIsSubmitting(true);
        try {
            await onSubmit(inputText, selectedFile);
            setInputText('');
            setSelectedFile(null);
            onClose();
        } catch (error) {
            console.error('Submission failed:', error);
            alert('입력 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleListening = () => {
        // 실제 Web Speech API 구현 전 임시 피드백
        setIsListening(!isListening);
        if (!isListening) {
            setTimeout(() => {
                setInputText('[음성 인식 모의 테스트] ' + inputText);
                setIsListening(false);
            }, 2000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
            {/* 닫기 영역 (배경 클릭 시) */}
            <div className="flex-1" onClick={onClose} />
            
            {/* Sheet Content */}
            <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">새로운 데이터 입력</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4 font-medium">
                        어떤 작업을 도와드릴까요?
                    </p>
                    
                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="예: 오늘 A현장에서 스크랩 30kg 회수했어"
                            className="w-full h-32 p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/50 resize-none outline-none text-gray-800 leading-relaxed transition-all placeholder:text-gray-400"
                            disabled={isSubmitting}
                        />
                        
                        {selectedFile && (
                            <div className="absolute bottom-3 left-3 text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-md flex items-center shadow-sm">
                                <Camera size={12} className="mr-1.5" />
                                {selectedFile.name.length > 15 ? selectedFile.name.substring(0, 15) + '...' : selectedFile.name}
                                <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-red-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-5 flex items-center justify-between space-x-3">
                        <div className="flex space-x-2">
                            <button 
                                onClick={toggleListening}
                                disabled={isSubmitting}
                                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all shadow-sm ${
                                    isListening ? 'bg-red-50 text-red-500 ring-2 ring-red-500/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                                title="음성 인식"
                            >
                                <Mic size={22} className={isListening ? 'animate-pulse' : ''} />
                            </button>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
                                title="카메라/사진"
                            >
                                <Camera size={22} />
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!inputText.trim() && !selectedFile)}
                            className="flex-1 max-w-[140px] flex items-center justify-center space-x-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md shadow-blue-500/30 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>입력하기</span>
                                    <Send size={18} className="translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
