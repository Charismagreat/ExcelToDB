import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description: string;
    icon: LucideIcon;
    rightElement?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon: Icon, rightElement }) => {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div className="animate-in fade-in slide-in-from-left duration-500">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    {title}
                    <Icon className="text-blue-500 shrink-0" size={32} />
                </h1>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed max-w-2xl">
                    {description}
                </p>
                <div className="h-1 w-12 bg-blue-600 rounded-full mt-4 opacity-50" />
            </div>
            {rightElement && (
                <div className="animate-in fade-in slide-in-from-right duration-700">
                    {rightElement}
                </div>
            )}
        </div>
    );
};


