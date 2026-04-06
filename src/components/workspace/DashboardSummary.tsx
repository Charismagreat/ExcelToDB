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
                try {
                    const result = await checkInAction(latitude, longitude);
                    if (result.success) {
                        setAttendance({
                            checkInTime: result.checkInTime,
                            isLate: result.isLate,
                            location: { lat: latitude, lng: longitude }
                        });
                        alert(`출근 처리가 완료되었습니다! (${result.checkInTime}${result.isLate ? ' - 지각' : ''})`);
                    }
                } catch (e: any) {
                    alert(e.message || '출근 처리 중 오류가 발생했습니다.');
                } finally {
                    setIsCheckingIn(false);
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

            <div className="space-y-6">
                {/* Todo Section */}
                <Link href="/workspace/todo" className="flex items-center justify-between group/item">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                            <ClipboardList size={22} />
                        </div>
                        <span className="font-bold text-gray-700">할 일</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-2xl font-black text-gray-900 group-hover/item:text-blue-600 transition-colors">
                            {todoCount}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
                    </div>
                </Link>

                {/* Attendance Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Clock size={22} />
                        </div>
                        <span className="font-bold text-gray-700">근태</span>
                    </div>
                    <div className="flex items-center">
                        {attendance ? (
                            <div className="flex items-center space-x-2 text-right">
                                <span className="font-black text-xl text-gray-900">{attendance.checkInTime} 출근</span>
                                {attendance.isLate ? (
                                    <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-full">지각</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 text-[10px] font-bold rounded-full">정상</span>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={handleCheckIn}
                                disabled={isCheckingIn}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm disabled:opacity-50"
                            >
                                {isCheckingIn ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <MapPin size={18} />
                                        <span>출근 하기</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Notification Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Bell size={22} />
                        </div>
                        <span className="font-bold text-gray-700">알림</span>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{notifCount}</span>
                </div>
            </div>
        </div>
    );
}
