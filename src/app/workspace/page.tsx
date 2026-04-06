import { getSessionAction } from '@/app/actions';
import { getWorkspaceFeedAction } from './actions';
import { getTodayAttendanceAction } from './attendance-actions';
import { redirect } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import FeedCard from '@/components/workspace/FeedCard';
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

            <div className="space-y-4">
                {feeds.length > 0 ? (
                    feeds.map((feed: any) => (
                        <FeedCard key={feed.id} {...feed} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                        <LayoutGrid size={40} className="text-gray-300 mb-4" />
                        <h3 className="text-gray-500 font-bold">표시할 피드가 없습니다</h3>
                        <p className="text-gray-400 text-sm mt-1 text-center">
                            새로운 보고서가 작성되거나<br/>AI를 통해 데이터를 입력하면 여기에 나타납니다.
                        </p>
                    </div>
                )}
            </div>
            
            {/* 패딩용 공간 */}
            <div className="h-4"></div>
        </div>
    );
}
