'use client';

import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import AiInputOverlay from './AiInputOverlay';
import { submitWorkspaceDataAction } from '@/app/workspace/actions';

export default function SmartFAB() {
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);

    const handleOpen = () => setIsOverlayOpen(true);
    const handleClose = () => setIsOverlayOpen(false);

    const handleSubmit = async (text: string, file?: File | null) => {
        try {
            const formData = new FormData();
            formData.append('text', text);
            if (file) {
                formData.append('image', file);
            }
            
            const result = await submitWorkspaceDataAction(formData);
            if (result.success) {
                alert(result.message || '데이터가 성공적으로 등록 되었습니다.');
            }
        } catch (error: any) {
            alert(error.message || '요청 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all z-40"
                aria-label="음성 혹은 사진으로 업무 입력"
            >
                <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity" />
                <Mic size={28} className="fill-current opacity-90" />
                
                {/* 링 애니메이션 효과 */}
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 opacity-50 animate-ping" style={{ animationDuration: '3s' }} />
            </button>

            <AiInputOverlay 
                isOpen={isOverlayOpen} 
                onClose={handleClose} 
                onSubmit={handleSubmit} 
            />
        </>
    );
}
