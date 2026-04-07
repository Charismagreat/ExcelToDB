'use client';

import React from 'react';
import { Bell, MapPin, CheckCircle, AlertCircle, FileText, Settings, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationItem from '@/components/workspace/NotificationItem';

export default function NotificationsPage() {
    const notifications = [
        {
            section: '오늘 (Today)',
            items: [
                {
                    id: 1,
                    type: 'checkin',
                    icon: <MapPin size={18} />,
                    title: '📍 본사 출근 완료',
                    description: '오전 08:56분에 정상적으로 출근 처리되었습니다. 즐거운 하루 되세요!',
                    time: '08:56',
                    unread: true
                },
                {
                    id: 2,
                    type: 'task',
                    icon: <FileText size={18} />,
                    title: '📄 새로운 업무 제출 요청',
                    description: '[신용카드영수증] 테이블에 분석이 필요한 새로운 데이터가 등록되었습니다.',
                    time: '10:15',
                    unread: true
                }
            ]
        },
        {
            section: '어제 (Yesterday)',
            items: [
                {
                    id: 3,
                    type: 'approval',
                    icon: <CheckCircle size={18} />,
                    title: '✅ 지출 증빙 승인 완료',
                    description: '식비 보상 관련 데이터 제출건이 관리자에 의해 최종 승인되었습니다.',
                    time: '오후 04:30'
                },
                {
                    id: 4,
                    type: 'system',
                    icon: <Settings size={18} />,
                    title: '⚙️ 시스템 업데이트 안내',
                    description: 'Won Conductor 2.0 업데이트가 완료되었습니다. 새로운 대시보드 기능을 확인해보세요.',
                    time: '오전 09:00'
                }
            ]
        },
        {
            section: '지난 알림 (Earlier)',
            items: [
                {
                    id: 5,
                    type: 'system',
                    icon: <Heart size={18} />,
                    title: '📢 공지사항: 전 직원 재택 근무',
                    description: '이번 주 금요일은 시스템 점검으로 인해 전 직원 재택 근무가 권장됩니다.',
                    time: '2024.04.05'
                },
                {
                    id: 6,
                    type: 'system',
                    icon: <AlertCircle size={18} />,
                    title: '🕒 퇴근 기록 누락 안내',
                    description: '어제 퇴근 기록이 누락되었습니다. 수동 입력 페이지에서 기록을 보완해 주세요.',
                    time: '2024.04.04'
                }
            ]
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="max-w-xl mx-auto pb-20">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                        <Bell size={18} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">알림 센터</h2>
                </div>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-all px-3 py-1.5 rounded-lg bg-blue-50/50">
                    모두 읽음 처리
                </button>
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {notifications.map((section) => (
                    <div key={section.section} className="px-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">
                            {section.section}
                        </h3>
                        <div className="space-y-3">
                            {section.items.map((notif: any) => (
                                <motion.div key={notif.id} variants={item}>
                                    <NotificationItem 
                                        icon={notif.icon}
                                        title={notif.title}
                                        description={notif.description}
                                        time={notif.time}
                                        unread={notif.unread}
                                        type={notif.type}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Empty State Fallback (Demo) */}
            {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Bell size={48} className="text-gray-400 mb-4" />
                    <p className="text-gray-500 font-bold">새로운 알림이 없습니다.</p>
                </div>
            )}
        </div>
    );
}
