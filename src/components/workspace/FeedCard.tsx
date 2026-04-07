'use client';

import React from 'react';
import { MessageSquare, Heart, CheckCircle, Clock, Eye, FileText, ImageIcon } from 'lucide-react';

interface FeedCardProps {
    id: string;
    type: 'TASK' | 'NOTICE' | 'ACTIVITY' | 'UNCLASSIFIED';
    title: string;
    content: string;
    author: string;
    timestamp: string;
    isCompleted?: boolean;
    isDeleted?: boolean;
    likes?: number;
    comments?: number;
    imageUrl?: string;
    unclassifiedReason?: string;
    onClassify?: (id: string) => void;
    onImageClick?: (url: string) => void;
    isAnalyzing?: boolean;
}

export default function FeedCard({
    id,
    type,
    title,
    content,
    author,
    timestamp,
    isCompleted,
    isDeleted,
    likes = 0,
    comments = 0,
    imageUrl,
    unclassifiedReason,
    onClassify,
    onImageClick,
    isAnalyzing
}: FeedCardProps) {
    const isTask = type === 'TASK';
    const isUnclassified = type === 'UNCLASSIFIED';
    
    return (
        <div 
            onClick={() => onClassify?.(id)}
            className={`
                bg-white rounded-2xl shadow-sm border overflow-hidden mb-4 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]
                ${isUnclassified ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}
                ${isDeleted ? 'opacity-60 grayscale-[0.5]' : ''}
            `}
        >
            <div className="flex p-4 space-x-4">
                {/* Thumbnail Section (Left) */}
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (imageUrl) onImageClick?.(imageUrl);
                    }}
                    className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center cursor-zoom-in active:scale-95 transition-transform"
                >
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                            {isUnclassified ? <Clock size={32} /> : (type === 'ACTIVITY' ? <ImageIcon size={32} /> : <FileText size={32} />)}
                        </div>
                    )}
                    <div className={`
                        absolute top-1.5 left-1.5 px-1.5 py-0.5 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-wider
                        ${isDeleted ? 'bg-gray-500' : (isCompleted ? 'bg-green-500' : (isUnclassified ? 'bg-amber-500' : 'bg-black/50'))}
                    `}>
                        {isDeleted ? '삭제' : (isCompleted ? '완료' : (isUnclassified ? (isAnalyzing ? '분석중' : '처리중') : type))}
                    </div>
                </div>

                {/* Content Section (Right) */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <h3 className={`font-black text-base sm:text-lg line-clamp-1 transition-colors ${isUnclassified ? 'text-amber-900 group-hover:text-amber-700' : 'text-gray-900 group-hover:text-blue-700'}`}>
                                    {title}
                                </h3>
                            </div>
                            {(isTask || isCompleted) && (
                                <button className={`p-1 rounded-full ${isCompleted ? 'text-green-500 bg-green-50' : 'text-gray-200'}`}>
                                    <CheckCircle size={18} fill={isCompleted ? 'currentColor' : 'none'} className={isCompleted ? 'text-green-500' : ''} />
                                </button>
                            )}
                        </div>
                        
                        <p className={`text-sm font-bold line-clamp-2 mt-1.5 leading-snug ${isUnclassified ? 'text-amber-700' : 'text-gray-700'}`}>
                            {content}
                        </p>

                        {isUnclassified && unclassifiedReason && (
                            <div className="mt-2 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-amber-400"></span>
                                <span className="text-[10px] text-amber-500 font-bold">{unclassifiedReason}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-[10px] text-gray-400 font-medium">
                            <span className="flex items-center">
                                <Clock size={10} className="mr-1" />
                                {timestamp}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                           {(isUnclassified && !isCompleted && !isDeleted && !isAnalyzing) ? (
                               <button 
                                   onClick={(e) => {
                                       e.stopPropagation();
                                       onClassify?.(id);
                                   }}
                                   className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 shadow-sm"
                               >
                                   <FileText size={12} />
                                   제출하기
                               </button>
                           ) : (
                               <div className="flex items-center text-gray-400">
                                    {isDeleted ? (
                                        <span className="text-[10px] font-bold text-gray-400">삭제 처리됨</span>
                                    ) : isCompleted ? (
                                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                            <CheckCircle size={12} /> 완료
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClassify?.(id);
                                            }}
                                            className="flex items-center text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Eye size={14} className="mr-1" />
                                            <span className="text-[10px] font-bold">보기</span>
                                        </button>
                                    )}
                                </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
