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
                glass rounded-2xl shadow-sm overflow-hidden mb-4 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]
                ${isUnclassified ? 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10' : ''}
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
                    className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-secondary flex-shrink-0 overflow-hidden border border-border flex items-center justify-center cursor-zoom-in active:scale-95 transition-transform"
                >
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground/30">
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
                                <h3 className={`font-black text-base sm:text-lg line-clamp-1 transition-colors ${isUnclassified ? 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500' : 'text-foreground group-hover:text-blue-500'}`}>
                                    {title}
                                </h3>
                            </div>
                            {(isTask || isCompleted) && (
                                <button className={`p-1 rounded-full ${isCompleted ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground/30'}`}>
                                    <CheckCircle size={18} fill={isCompleted ? 'currentColor' : 'none'} className={isCompleted ? 'text-green-500' : ''} />
                                </button>
                            )}
                        </div>
                        
                        <p className={`text-sm font-bold line-clamp-2 mt-1.5 leading-snug ${isUnclassified ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-foreground/70'}`}>
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
                        <div className="flex items-center text-[10px] text-muted-foreground font-medium">
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
                                   className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 shadow-sm"
                               >
                                   <FileText size={12} />
                                   제출하기
                               </button>
                           ) : (
                               <div className="flex items-center text-muted-foreground">
                                    {isDeleted ? (
                                        <span className="text-[10px] font-bold text-muted-foreground">삭제 처리됨</span>
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
                                            className="flex items-center text-muted-foreground hover:text-blue-500 transition-colors"
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
