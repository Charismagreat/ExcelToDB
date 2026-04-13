'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function StatusModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}: StatusModalProps) {
  if (!isOpen) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl shadow-black/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon Section */}
          <div className={`
            w-20 h-20 rounded-[28px] flex items-center justify-center mb-6
            ${isSuccess ? 'bg-green-50 text-green-500' : isError ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}
          `}>
             {isSuccess ? <CheckCircle2 size={40} strokeWidth={2.5} /> : 
              isError ? <AlertCircle size={40} strokeWidth={2.5} /> : 
              <Info size={40} strokeWidth={2.5} />}
          </div>

          {/* Text Content */}
          <h3 className={`text-xl font-black mb-2 tracking-tight ${isError ? 'text-red-900' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 px-2 lowercase">
            {message}
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`
              w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg
              ${isSuccess ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100' : 
                isError ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' : 
                'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}
            `}
          >
            {isError ? '확인 및 다시 시도' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}

