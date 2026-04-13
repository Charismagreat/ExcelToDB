'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value?: string;
    type?: 'toggle' | 'arrow' | 'text';
    isOn?: boolean;
    onToggle?: (state: boolean) => void;
    onClick?: () => void;
}

export function SettingsItem({ 
    icon, 
    title, 
    subtitle, 
    value, 
    type = 'arrow',
    isOn: externalIsOn,
    onToggle,
    onClick 
}: SettingsItemProps) {
    const [internalIsOn, setInternalIsOn] = useState(false);
    
    // 외부 상태가 있으면 그것을 사용, 없으면 내부 상태 사용
    const isOn = externalIsOn !== undefined ? externalIsOn : internalIsOn;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggle) {
            onToggle(!isOn);
        } else {
            setInternalIsOn(!internalIsOn);
        }
    };

    return (
        <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="flex items-center justify-between p-4 glass rounded-2xl shadow-sm cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-all group mb-2"
        >
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground dark:text-white">{title}</h4>
                    {subtitle && <p className="text-[10px] text-muted-foreground/60 dark:text-slate-400 font-medium">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {type === 'text' && value && (
                    <span className="text-xs font-bold text-blue-500">{value}</span>
                )}
                
                {type === 'toggle' && (
                    <div 
                        onClick={handleToggle}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${isOn ? 'bg-orange-500' : 'bg-muted border border-border/50'}`}
                    >
                        <motion.div 
                            animate={{ x: isOn ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            initial={false}
                            className={`absolute top-1 w-3 h-3 rounded-full shadow-sm ${isOn ? 'bg-white' : 'bg-muted-foreground/40'}`}
                        />
                    </div>
                )}

                {type === 'arrow' && (
                    <ChevronRight size={18} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                )}
            </div>
        </motion.div>
    );
}
