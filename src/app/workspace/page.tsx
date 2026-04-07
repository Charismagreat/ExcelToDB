import { getSessionAction } from '@/app/actions';
import { getWorkspaceFeedAction } from './actions';
import { getTodayAttendanceAction } from './attendance-actions';
import { redirect } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import FeedCard from '@/components/workspace/FeedCard';
import FeedList from '@/components/workspace/FeedList';
import DashboardSummary from '@/components/workspace/DashboardSummary';

export default async function WorkspacePage() {
    // 세션 확인
    const session = await getSessionAction();
    if (!session) {
        redirect('/login');
    }

    // 데이터 병렬 조회
    const [feeds, attendance] = await Promise.all([
        getWorkspaceFeedAction(),
        getTodayAttendanceAction()
    ]);

    // 하드코딩된 모의 수치 (실제 서비스 연동 시 SQL 카운트 등으로 변경 가능)
    const todoCount = 4;
    const notifCount = 6;

    return (
        <div className="pb-24 pt-4">
            {/* 기획안 디자인이 반영된 요약 대시보드 */}
            <DashboardSummary 
                user={session} 
                attendance={attendance} 
                todoCount={todoCount}
                notifCount={notifCount}
            />

            {/* 최근 업무 피드 섹션 */}
            <div className="px-1 flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900 border-l-4 border-blue-600 pl-3">최근 업무</h3>
                <span className="text-xs text-gray-400 font-medium hover:text-blue-600 cursor-pointer transition-colors">전체보기</span>
            </div>

            <FeedList initialFeeds={feeds} />
            
            {/* 패딩용 공간 */}
            <div className="h-4"></div>
        </div>
    );
}
