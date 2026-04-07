'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Clock, Bell, LogOut, Loader2, MapPin } from 'lucide-react';
import { checkInAction } from '@/app/workspace/attendance-actions';

interface SummaryProps {
    user: any;
    attendance: any;
    todoCount: number;
    notifCount: number;
}

export default function DashboardSummary({ user, attendance: initialAttendance, todoCount, notifCount }: SummaryProps) {
    const [attendance, setAttendance] = useState(initialAttendance);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    const handleCheckIn = async () => {
        if (!navigator.geolocation) {
            alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
            return;
        }

        setIsCheckingIn(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // [DEMO MODE] 현재 시각 캡처 및 상태 생성
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                
                // 09:00 이후면 지각으로 간주 (데모용 로직)
                const isLate = hours > 9 || (hours === 9 && minutes > 0);

                try {
                    // 실제 서버 동기화 시도 (실패해도 데모는 진행)
                    const result = await checkInAction(latitude, longitude);
                    if (result.success) {
                        setAttendance({
                            checkInTime: result.checkInTime,
                            isLate: result.isLate,
                            location: { lat: latitude, lng: longitude }
                        });
                    } else {
                        throw new Error('Server sync failed');
                    }
                } catch (e) {
                    console.warn('Demo Mode: Server sync skipped or failed. Using local data.');
                    // 서버 실패 시에도 데모를 위해 로컬 데이터로 상태 업데이트
                    setAttendance({
                        checkInTime: timeString,
                        isLate: isLate,
                        location: { lat: latitude, lng: longitude }
                    });
                } finally {
                    setIsCheckingIn(false);
                    alert(`출근 처리가 완료되었습니다! (${timeString}${isLate ? ' - 지각' : ''})`);
                }
            },
            (error) => {
                console.error(error);
                alert('위치 정보를 가져오는데 실패했습니다. 권한 설정을 확인해 주세요.');
                setIsCheckingIn(false);
            }
        );
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8 border border-gray-100 overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:bg-blue-100/50 transition-colors" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {user.fullName?.charAt(0) || user.username?.charAt(0)}
                    </div>
                    <div className="flex items-baseline space-x-1">
                        <h2 className="text-xl font-bold text-gray-900">{user.fullName || user.username}</h2>
                        <span className="text-gray-500 text-sm">님의 업무 공간</span>
                    </div>
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors">
                    <LogOut size={14} />
                    <span>로그아웃</span>
                </button>
            </div>

            <div className="space-y-4">
                {/* 1. Attendance Section (Top, High Priority) */}
                <div className="bg-blue-50/30 rounded-2xl p-4 flex items-center justify-between border border-blue-100/30">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-white text-emerald-500 shadow-sm flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <span className="font-bold text-gray-700">근태</span>
                    </div>
                    <div className="flex items-center">
                        {attendance ? (
                            <div className="flex items-center space-x-3 text-right">
                                <div className="flex items-center space-x-1.5">
                                    <MapPin size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">본사</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-black text-lg text-gray-900">
                                        {(() => {
                                            const now = new Date();
                                            const month = now.getMonth() + 1;
                                            const date = now.getDate();
                                            const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
                                            return `${month}월 ${date}일(${day}) ${attendance.checkInTime}`;
                                        })()} 출근
                                    </span>
                                    {attendance.isLate ? (
                                        <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-full">지각</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-white text-emerald-500 text-[10px] font-bold rounded-full shadow-sm border border-emerald-100">정상</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={handleCheckIn}
                                disabled={isCheckingIn}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {isCheckingIn ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <MapPin size={16} />
                                        <span>출근 하기</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Todo & Notification Grid (Bottom, Inline) */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/workspace/todo" className="bg-gray-50/50 rounded-2xl p-4 flex flex-col border border-transparent hover:border-orange-100 hover:bg-orange-50/30 transition-all group/item min-h-[130px]">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                                <ClipboardList size={16} />
                            </div>
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight">할 일</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full relative">
                            <div className="flex items-center space-x-1 translate-x-1.5">
                                <span className="text-4xl font-black text-gray-900 group-hover/item:text-orange-600 transition-colors tracking-tight">
                                    {todoCount}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/workspace/notifications" className="bg-gray-50/50 rounded-2xl p-4 flex flex-col border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all group/item min-h-[130px] cursor-pointer">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                <Bell size={16} />
                            </div>
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight">알림</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full">
                            <span className="text-4xl font-black text-gray-900 group-hover/item:text-blue-600 transition-colors tracking-tight">
                                {notifCount}
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
