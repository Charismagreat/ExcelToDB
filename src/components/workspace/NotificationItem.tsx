'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotificationItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    time: string;
    unread?: boolean;
    type?: 'checkin' | 'task' | 'system' | 'approval';
}

export default function NotificationItem({ icon, title, description, time, unread, type }: NotificationItemProps) {
    const typeStyles = {
        checkin: 'bg-emerald-50 text-emerald-500',
        task: 'bg-orange-50 text-orange-500',
        system: 'bg-blue-50 text-blue-500',
        approval: 'bg-purple-50 text-purple-500',
    };

    return (
        <motion.div 
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
            className={`
                relative flex items-start space-x-4 p-4 rounded-2xl 
                bg-white/70 backdrop-blur-md border border-white/40 
                shadow-sm transition-all cursor-pointer group
                ${unread ? 'ring-1 ring-blue-500/10' : ''}
            `}
        >
            <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${type ? typeStyles[type] : 'bg-gray-50 text-gray-500'}
            `}>
                {icon}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-sm font-bold truncate ${unread ? 'text-gray-900' : 'text-gray-600'}`}>
                        {title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium">{time}</span>
                </div>
                <p className={`text-xs leading-relaxed ${unread ? 'text-gray-600' : 'text-gray-400'}`}>
                    {description}
                </p>
            </div>

            {unread && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}
        </motion.div>
    );
}
