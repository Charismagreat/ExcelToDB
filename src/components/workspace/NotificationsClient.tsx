'use client';

import React from 'react';
import { Bell, MapPin, CheckCircle, AlertCircle, FileText, Settings, Heart, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { NotificationItem } from './NotificationItem';
import Link from 'next/link';
import { markAllNotificationsAsReadAction, markNotificationAsReadAction } from '@/app/actions/notification';

interface NotificationListProps {
    notifications: any[];
}

export function NotificationsClient({ notifications: rawNotifications = [] }: NotificationListProps) {
    console.log('[DEBUG] NotificationsClient received:', rawNotifications);
    // rawNotifications가 배열이 아닌 경우를 대비한 안전 장치
    const safeNotifications = Array.isArray(rawNotifications) ? rawNotifications : [];
    console.log('[DEBUG] Safe Notifications count:', safeNotifications.length);

    // 1. 구역 나누기 (오늘, 어제, 이전)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sections = [
        { name: '오늘 (Today)', items: [] as any[] },
        { name: '어제 (Yesterday)', items: [] as any[] },
        { name: '지난 알림 (Earlier)', items: [] as any[] }
    ];

    safeNotifications.forEach(n => {
        const date = new Date(n.createdAt);
        const item = {
            id: n.id,
            type: n.type === 'ALERT' ? 'task' : n.type === 'WARNING' ? 'system' : 'approval',
            icon: n.type === 'ALERT' ? <AlertCircle size={18} /> : n.type === 'WARNING' ? <AlertTriangle size={18} /> : <Info size={18} />,
            title: n.title,
            description: n.message || '',
            time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            unread: Number(n.isRead) === 0,
            link: n.link
        };

        if (date >= today) {
            sections[0].items.push(item);
        } else if (date >= yesterday) {
            sections[1].items.push(item);
        } else {
            item.time = date.toLocaleDateString('ko-KR');
            sections[2].items.push(item);
        }
    });

    const activeSections = sections.filter(s => s.items.length > 0);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemAnim = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsReadAction();
            window.dispatchEvent(new Event('notification:updated'));
            window.location.reload(); 
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleItemClick = async (notif: any) => {
        if (!notif.unread) return;
        try {
            await markNotificationAsReadAction(notif.id);
            window.dispatchEvent(new Event('notification:updated'));
            // 리로드하여 상태 반영 (또는 로컬 상태 업데이트 가능하지만 모바일 일관성을 위해 리로드 선호)
            if (!notif.link) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
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
                <button 
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-all px-3 py-1.5 rounded-lg bg-blue-50/50"
                >
                    모두 읽음 처리
                </button>
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {activeSections.length > 0 ? activeSections.map((section) => (
                    <div key={section.name} className="px-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">
                            {section.name}
                        </h3>
                        <div className="space-y-3">
                            {section.items.map((notif: any) => (
                                <motion.div key={notif.id} variants={itemAnim}>
                                    {notif.link ? (
                                        <Link href={notif.link} onClick={() => handleItemClick(notif)}>
                                            <NotificationItem 
                                                icon={notif.icon}
                                                title={notif.title}
                                                description={notif.description}
                                                time={notif.time}
                                                unread={notif.unread}
                                                type={notif.type}
                                            />
                                        </Link>
                                    ) : (
                                        <div onClick={() => handleItemClick(notif)}>
                                            <NotificationItem 
                                                icon={notif.icon}
                                                title={notif.title}
                                                description={notif.description}
                                                time={notif.time}
                                                unread={notif.unread}
                                                type={notif.type}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Bell size={48} className="text-gray-400 mb-4" />
                        <p className="text-gray-500 font-bold">새로운 알림이 없습니다.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
