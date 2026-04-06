import React from 'react';
import FeedCard from '@/components/workspace/FeedCard';
import { getSessionAction } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function WorkspacePage() {
    // 세션 확인 (서버 컴포넌트)
    const session = await getSessionAction();
    if (!session) {
        redirect('/login');
    }

    // 모의(Mock) 피드 데이터
    // 추후 EGDesk 보고서 및 할 일 데이터를 직접 조회하여 구성합니다.
    const mockFeeds = [
        {
            id: '1',
            type: 'NOTICE' as const,
            title: '원컨덕터 4월 전사 휴무 안내',
            content: '4월 15일은 창립기념일로 전사 휴무입니다. 업무 일정에 참고하시기 바랍니다.\n긴급 대응 인력은 부서장과 별도 협의 바랍니다.',
            author: '경영지원팀',
            timestamp: '방금 전',
            likes: 12,
            comments: 3
        },
        {
            id: '2',
            type: 'TASK' as const,
            title: '[현장보고] A구역 자재 입고 확인',
            content: 'A구역에 금일 도착한 구리선 500kg 입고 확인 및 시스템 등록 요청드립니다.',
            author: '물류팀',
            timestamp: '2시간 전',
            isCompleted: false,
            likes: 2,
            comments: 1
        },
        {
            id: '3',
            type: 'ACTIVITY' as const,
            title: '신규 장비 메뉴얼 업데이트',
            content: '라인 B에 새로 도입된 압출기 메뉴얼이 자료실에 업데이트되었습니다. 관련 작업자분들은 작업 전 필독 바랍니다.',
            author: '생산기술팀',
            timestamp: '어제',
            likes: 5,
            comments: 0
        },
        {
            id: '4',
            type: 'TASK' as const,
            title: '주간 업무 보고서 제출',
            content: '금주 스크랩 배출량 및 불량률 보고서를 금일 18시까지 시스템에 제출해 주십시오.',
            author: '관리자',
            timestamp: '어제',
            isCompleted: true,
            likes: 1,
            comments: 0
        }
    ];

    return (
        <div className="space-y-2">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    안녕하세요, {session.fullName || session.username}님 👋
                </h2>
                <p className="text-gray-500 mt-1">오늘 처리해야 할 주요 업무 및 소식입니다.</p>
            </div>

            <div className="space-y-4">
                {mockFeeds.map((feed) => (
                    <FeedCard key={feed.id} {...feed} />
                ))}
            </div>
            
            {/* 리스트 맨 끝 패딩용 공간 (모바일 스크롤 확보) */}
            <div className="h-10"></div>
        </div>
    );
}
