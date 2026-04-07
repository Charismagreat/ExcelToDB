'use client';

import React from 'react';
import { ClipboardList, LayoutGrid, Calendar, CheckSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TodoItem from '@/components/workspace/TodoItem';

export default function TodoPage() {
    const todoSections = [
        {
            title: '오늘 마감 (Due Today)',
            items: [
                {
                    id: 1,
                    title: '📄 영수증 제출 요청',
                    description: '법인카드 사용 내역 3건에 대한 증빙 사진을 제출해 주세요.',
                    location: '본사 3층 지원팀',
                    dueDate: '오후 06:00 (3시간 남음)',
                    category: '지출정산',
                    urgent: true
                },
                {
                    id: 2,
                    title: '🕒 근태 조정 신청',
                    description: '어제 퇴근 기록 누락건에 대한 소명 자료를 인사팀에 전달하세요.',
                    location: '인사 시스템',
                    dueDate: '오후 05:00',
                    category: '근태관리',
                    urgent: true
                }
            ]
        },
        {
            title: '진행 중 업무 (Ongoing)',
            items: [
                {
                    id: 3,
                    title: '🛫 출장비 정산 요청',
                    description: '1분기 정기 방문 관련 교통비 및 숙박비 정산을 요청합니다.',
                    location: '마포지점',
                    dueDate: '내일 마감',
                    category: '회계관리'
                },
                {
                    id: 4,
                    title: '🔐 온라인 보안 교육 이수',
                    description: '전 사원 필수 보안 교육 영상을 시청하고 퀴즈를 완료하세요.',
                    dueDate: '4월 15일까지',
                    category: '교육인사'
                }
            ]
        },
        {
            title: '완료됨 (Completed)',
            items: [
                {
                    id: 5,
                    title: '📢 주간 업무 보고서 작성',
                    description: '이번 주 주요 실적 및 다음 주 계획 보고서를 등록하였습니다.',
                    category: '업무보고',
                    initialCompleted: true
                },
                {
                    id: 6,
                    title: '🤝 거래처 미팅 자료 준비',
                    description: '신규 프로젝트 관련 제안서 및 회사 소개서 업데이트 완료.',
                    category: '영업지원',
                    initialCompleted: true
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
        <div className="max-w-xl mx-auto pb-24">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8 px-4 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                        <CheckSquare size={18} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">할 일 목록</h2>
                </div>
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                >
                    <Plus size={20} />
                </motion.button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 px-4 mb-8">
                {[
                    { label: '전체', value: 6, color: 'text-gray-500' },
                    { label: '진행', value: 4, color: 'text-blue-500' },
                    { label: '완료', value: 2, color: 'text-emerald-500' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/40 backdrop-blur-sm border border-white/40 p-3 rounded-2xl flex flex-col items-center shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 mb-1">{stat.label}</span>
                        <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Todo Lists */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {todoSections.map((section) => (
                    <div key={section.title} className="px-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">
                            {section.title}
                        </h3>
                        <div className="space-y-3">
                            {section.items.map((todo: any) => (
                                <motion.div key={todo.id} variants={item}>
                                    <TodoItem 
                                        title={todo.title}
                                        description={todo.description}
                                        location={todo.location}
                                        dueDate={todo.dueDate}
                                        category={todo.category}
                                        urgent={todo.urgent}
                                        initialCompleted={todo.initialCompleted}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Bottom Floating Action (Concept) */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-20">
                <div className="p-1.5 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl flex items-center space-x-2">
                    <input 
                        type="text" 
                        placeholder="새로운 업무를 입력하세요..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 placeholder:text-gray-400 font-medium"
                    />
                    <button className="bg-orange-500 text-white p-2 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
