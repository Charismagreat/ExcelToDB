import React from 'react';
import { MessageSquare, Heart, CheckCircle, Clock } from 'lucide-react';

interface FeedCardProps {
    id: string;
    type: 'TASK' | 'NOTICE' | 'ACTIVITY';
    title: string;
    content: string;
    author: string;
    timestamp: string;
    isCompleted?: boolean;
    likes?: number;
    comments?: number;
}

export default function FeedCard({
    type,
    title,
    content,
    author,
    timestamp,
    isCompleted,
    likes = 0,
    comments = 0
}: FeedCardProps) {
    const isTask = type === 'TASK';
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        {author.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight">{author}</h4>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <span className="font-medium text-indigo-600 mr-2">{type === 'NOTICE' ? '공지' : type === 'TASK' ? '할 일' : '활동'}</span>
                            <Clock size={10} className="mr-1" />
                            {timestamp}
                        </div>
                    </div>
                </div>
                {isTask && (
                    <button className={`p-1.5 rounded-full transition-colors ${isCompleted ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-green-500 bg-gray-50 hover:bg-green-50'}`}>
                        <CheckCircle size={22} className={isCompleted ? 'fill-current opacity-20' : ''} />
                    </button>
                )}
            </div>
            
            {/* Body */}
            <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {content}
                </p>
            </div>
            
            {/* Footer Actions (Instagram like) */}
            <div className="px-4 py-3 border-t border-gray-50 flex items-center space-x-4">
                <button className="flex items-center text-gray-500 hover:text-red-500 transition-colors">
                    <Heart size={20} className="mr-1.5" />
                    <span className="text-xs font-medium">{likes}</span>
                </button>
                <button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors">
                    <MessageSquare size={20} className="mr-1.5" />
                    <span className="text-xs font-medium">{comments}</span>
                </button>
            </div>
        </div>
    );
}
