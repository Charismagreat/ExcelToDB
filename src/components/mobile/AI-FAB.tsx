'use client';

import React, { useState } from 'react';
import { Plus, Mic, Camera, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AIFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col gap-4 transition-all duration-300 origin-bottom scale-0 opacity-0",
        isOpen && "scale-100 opacity-100 translate-y-0"
      )}>
        {/* Camera Button */}
        <button
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
  );
}
