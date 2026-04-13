'use client';

import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoItemProps {
    title: string;
    description: string;
    location?: string;
    dueDate?: string;
    category?: string;
    urgent?: boolean;
    initialCompleted?: boolean;
}

export function TodoItem({ 
    title, 
    description, 
    location, 
    dueDate, 
    category, 
    urgent,
    initialCompleted = false 
}: TodoItemProps) {
    const [completed, setCompleted] = useState(initialCompleted);

    return (
        <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`
                relative flex items-start space-x-4 p-4 rounded-2xl 
                glass hover:bg-white/10 dark:hover:bg-white/5
                shadow-sm transition-all cursor-pointer group
                ${urgent ? 'border-l-4 border-l-orange-500' : ''}
                ${completed ? 'opacity-50' : ''}
            `}
            onClick={() => setCompleted(!completed)}
        >
            {/* Checkbox Icon */}
            <div className="flex-shrink-0 mt-1">
                {completed ? (
                    <CheckCircle2 className="text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" size={20} />
                ) : (
                    <Circle className="text-muted-foreground/40 group-hover:text-blue-500 transition-colors" size={20} />
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-bold truncate transition-all ${completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                        {title}
                    </h4>
                    {category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold whitespace-nowrap ml-2">
                            {category}
                        </span>
                    )}
                </div>
                
                <p className={`text-xs leading-relaxed mb-3 transition-colors ${completed ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                    {description}
                </p>

                {/* Meta Information */}
                <div className="flex items-center space-x-3 text-[10px] font-medium text-muted-foreground/60">
                    {location && (
                        <div className="flex items-center space-x-1">
                            <MapPin size={12} className="text-muted-foreground/40" />
                            <span>{location}</span>
                        </div>
                    )}
                    {dueDate && (
                        <div className={`flex items-center space-x-1 ${!completed && urgent ? 'text-orange-500 font-bold' : ''}`}>
                            <Clock size={12} className={!completed && urgent ? 'text-orange-400' : 'text-muted-foreground/30'} />
                            <span>{dueDate}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Animation for Completion */}
            <AnimatePresence>
                {completed && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 bg-emerald-500/5 rounded-2xl pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
