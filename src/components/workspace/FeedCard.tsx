'use client';

import React from 'react';
import { CheckCircle, Clock, Eye, FileText, Camera, ShieldX, AlertTriangle, MapPin } from 'lucide-react';

interface FeedCardProps {
    id: string;
    type: 'TASK' | 'NOTICE' | 'ACTIVITY' | 'UNCLASSIFIED';
    title: string;
    content: string;
    author?: string;
    timestamp: string;
    status?: string;
    isCompleted?: boolean;
    isDeleted?: boolean;
    likes?: number;
    comments?: number;
    imageUrl?: string;
    unclassifiedReason?: string;
    onClassify?: (id: string) => void;
    onImageClick?: (url: string) => void;
    isAnalyzing?: boolean;
    locationName?: string;
}

export function FeedCard({
    id,
    type,
    title,
    content,
    author,
    timestamp,
    status,
    isCompleted,
    isDeleted,
    likes = 0,
    comments = 0,
    imageUrl,
    unclassifiedReason,
    onClassify,
    onImageClick,
    isAnalyzing,
    locationName
}: FeedCardProps) {
    const isTask = type === 'TASK';
    const isUnclassified = type === 'UNCLASSIFIED';

    // status prop 우선, 없으면 기존 isCompleted/isDeleted 폴백
    const isBlocked          = status === 'blocked';
    const isUnresolved       = status === 'unresolved';
    const isActuallyCompleted = status === 'completed' || (!status && isCompleted);
    const isActuallyDeleted   = status === 'deleted'   || (!status && isDeleted);

    // 뱃지 텍스트 및 색상
    const badgeInfo = (() => {
        if (isActuallyDeleted)  return { text: '삭제',   color: 'bg-gray-500' };
        if (isActuallyCompleted) return { text: '완료',  color: 'bg-green-500' };
        if (isBlocked)          return { text: '차단됨', color: 'bg-red-500' };
        if (isUnresolved)       return { text: '미분류', color: 'bg-orange-500' };
        if (isAnalyzing)        return { text: '분석중', color: 'bg-amber-500' };
        if (isUnclassified)     return { text: '처리중', color: 'bg-amber-500' };
        return null;
    })();

    // 카드 배경 tint
    const cardTint = (() => {
        if (isBlocked)   return 'border-red-500/20 bg-red-500/5 dark:bg-red-500/10';
        if (isUnresolved) return 'border-orange-500/20 bg-orange-500/5 dark:bg-orange-500/10';
        if (isUnclassified && !isActuallyCompleted && !isActuallyDeleted)
            return 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10';
        return '';
    })();

    // 제목 색상
    const titleColor = (() => {
        if (isBlocked)    return 'text-red-600 dark:text-red-400 group-hover:text-red-500';
        if (isUnresolved) return 'text-orange-600 dark:text-orange-400 group-hover:text-orange-500';
        if (isUnclassified) return 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500';
        return 'text-foreground group-hover:text-blue-500';
    })();

    // 본문 색상
    const contentColor = (() => {
        if (isBlocked)    return 'text-red-600/80 dark:text-red-400/80';
        if (isUnresolved) return 'text-orange-600/80 dark:text-orange-400/80';
        if (isUnclassified) return 'text-amber-600/80 dark:text-amber-400/80';
        return 'text-foreground/70';
    })();

    return (
        <div
            onClick={() => onClassify?.(id)}
            className={`
                glass rounded-2xl shadow-sm overflow-hidden mb-4 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]
                ${cardTint}
                ${isActuallyDeleted ? 'opacity-60 grayscale-[0.5]' : ''}
            `}
        >
            <div className="flex p-4 space-x-4">
                {/* 썸네일 섹션 */}
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
                            {isBlocked    ? <ShieldX size={32} className="text-red-400" /> :
                             isUnresolved ? <AlertTriangle size={32} className="text-orange-400" /> :
                             isUnclassified ? <Clock size={32} /> :
                             (type === 'ACTIVITY' ? <Camera size={32} /> : <FileText size={32} />)}
                        </div>
                    )}
                    {badgeInfo && (
                        <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-wider ${badgeInfo.color}`}>
                            {badgeInfo.text}
                        </div>
                    )}
                </div>

                {/* 콘텐츠 섹션 */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <h3 className={`font-black text-base sm:text-lg line-clamp-1 transition-colors ${titleColor}`}>
                                    {title}
                                </h3>
                            </div>
                            {(isTask || isActuallyCompleted) && (
                                <button className={`p-1 rounded-full ${isActuallyCompleted ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground/30'}`}>
                                    <CheckCircle size={18} fill={isActuallyCompleted ? 'currentColor' : 'none'} className={isActuallyCompleted ? 'text-green-500' : ''} />
                                </button>
                            )}
                        </div>

                        <p className={`text-sm font-bold line-clamp-2 mt-1.5 leading-snug ${contentColor}`}>
                            {content}
                        </p>

                        {/* 미분류/차단 이유 표시 */}
                        {(isUnclassified || isBlocked || isUnresolved) && unclassifiedReason && (
                            <div className="mt-2 flex items-center gap-1">
                                <span className={`inline-block w-1 h-1 rounded-full ${isBlocked ? 'bg-red-400' : isUnresolved ? 'bg-orange-400' : 'bg-amber-400'}`}></span>
                                <span className={`text-[10px] font-bold ${isBlocked ? 'text-red-500' : isUnresolved ? 'text-orange-500' : 'text-amber-500'}`}>
                                    {unclassifiedReason}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center text-[10px] text-muted-foreground font-medium">
                                <span className="flex items-center">
                                    <Clock size={10} className="mr-1" />
                                    {timestamp}
                                </span>
                            </div>
                            {locationName && (
                                <div className="flex items-center text-[9px] text-blue-500/70 font-bold bg-blue-500/5 px-1.5 py-0.5 rounded-md border border-blue-500/10 truncate max-w-[140px]" title={locationName}>
                                    <MapPin size={8} className="mr-1 flex-shrink-0" />
                                    <span className="truncate">{locationName}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* 상태별 하단 버튼 */}
                            {isBlocked ? (
                                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                    <ShieldX size={12} /> 차단됨 (관리자 문의)
                                </span>
                            ) : isUnresolved ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClassify?.(id); }}
                                    className="px-3 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <AlertTriangle size={12} />
                                    분류 필요
                                </button>
                            ) : (isUnclassified && !isActuallyCompleted && !isActuallyDeleted && !isAnalyzing) ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClassify?.(id); }}
                                    className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <FileText size={12} />
                                    제출하기
                                </button>
                            ) : (
                                <div className="flex items-center text-muted-foreground">
                                    {isActuallyDeleted ? (
                                        <span className="text-[10px] font-bold text-muted-foreground">삭제 처리됨</span>
                                    ) : isActuallyCompleted ? (
                                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                            <CheckCircle size={12} /> 완료
                                        </span>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onClassify?.(id); }}
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
