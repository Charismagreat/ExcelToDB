'use client';

import React, { useState, useRef } from 'react';
import { Plus, Mic, Camera, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { processSmartInput } from '@/app/actions/smart-input';
import { SmartInputOverlay } from './SmartInputOverlay';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AIFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
    setIsOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Open overlay and start analyzing
    setIsOverlayOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // 1. Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      // 2. Call AI Engine
      const result = await processSmartInput({ image: base64 });
      if (result.success) {
          setAnalysisResult(result.analysis);
      } else {
          throw new Error(result.error);
      }
    } catch (error) {
      console.error('[AIFAB] Capture error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
        {/* Hidden File Input for Camera */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange}
        />

        {/* Action Buttons */}
        <div className={cn(
          "flex flex-col gap-4 transition-all duration-300 origin-bottom scale-0 opacity-0 mb-2",
          isOpen && "scale-100 opacity-100 translate-y-0"
        )}>
          {/* Camera Button */}
          <button
            onClick={handleCameraClick}
            className="w-14 h-14 rounded-full glass flex items-center justify-center text-primary shadow-xl active:scale-95 transition-transform"
            aria-label="Camera OCR"
          >
            <Camera size={24} />
          </button>
          
          {/* Microphone Button */}
          <button
            className="w-14 h-14 rounded-full glass flex items-center justify-center text-secondary shadow-xl active:scale-95 transition-transform"
            aria-label="Voice Assistant"
          >
            <Mic size={24} />
          </button>
        </div>

        {/* Main FAB Toggle */}
        <button
          onClick={toggleOpen}
          className={cn(
            "w-16 h-16 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90",
            isOpen ? "bg-slate-800 rotate-45" : "hover:bg-blue-600"
          )}
        >
          {isOpen ? <X size={28} /> : <Plus size={28} />}
        </button>
      </div>

      {/* Smart Analysis Overlay */}
      <SmartInputOverlay 
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        analysisResult={analysisResult}
        isAnalyzing={isAnalyzing}
      />
    </>
  );
}
