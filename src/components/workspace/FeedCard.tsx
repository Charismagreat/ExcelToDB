import React from 'react';
import { MessageSquare, Heart, CheckCircle, Clock, Eye, FileText, ImageIcon } from 'lucide-react';

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
    imageUrl?: string; // 이미지 URL 추가
}

export default function FeedCard({
    type,
    title,
    content,
    author,
    timestamp,
    isCompleted,
    likes = 0,
    comments = 0,
    imageUrl
}: FeedCardProps) {
    const isTask = type === 'TASK';
    
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 hover:shadow-md transition-shadow group">
            <div className="flex p-4 space-x-4">
                {/* Thumbnail Section (Left) */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                            {type === 'ACTIVITY' ? <ImageIcon size={32} /> : <FileText size={32} />}
                        </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-wider">
                        {type}
                    </div>
                </div>

                {/* Content Section (Right) */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-blue-600 mb-0.5">{author}</span>
                                <h3 className="font-black text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-blue-700 transition-colors">
                                    {title}
                                </h3>
                            </div>
                            {isTask && (
                                <button className={`p-1 rounded-full ${isCompleted ? 'text-green-500 bg-green-50' : 'text-gray-200'}`}>
                                    <CheckCircle size={18} fill={isCompleted ? 'currentColor' : 'none'} className={isCompleted ? 'text-green-500' : ''} />
                                </button>
                            )}
                        </div>
                        
                        <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mt-1.5 leading-snug">
                            {content}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-[10px] text-gray-400 font-medium">
                            <span className="flex items-center">
                                <Clock size={10} className="mr-1" />
                                {timestamp}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                           <button className="flex items-center text-gray-400 hover:text-blue-500 transition-colors">
                                <Eye size={14} className="mr-1" />
                                <span className="text-[10px] font-bold">보기</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
