'use client';

import React, { useState } from 'react';
import FeedCard from './FeedCard';
import AiInputOverlay from './AiInputOverlay';
import { getWorkspaceItemDataAction, getWorkspaceFeedAction } from '@/app/workspace/actions';
import { LayoutGrid, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeedListProps {
    initialFeeds: any[];
}

export default function FeedList({ initialFeeds }: FeedListProps) {
    const [feeds, setFeeds] = useState(initialFeeds);
    const router = useRouter();
    
    // 서버에서 revalidatePath를 호출하여 전달된 신규 데이터를 로컬 상태와 동기화
    React.useEffect(() => {
        setFeeds(initialFeeds);
    }, [initialFeeds]);

    // 분석 중인 항목이 있을 때만 동작하는 스마트 폴링
    React.useEffect(() => {
        const hasAnalyzing = feeds.some((f: any) => f.isAnalyzing);
        if (!hasAnalyzing) return;

        console.log('[Feed Polling] Analyzing items detected. Polling started...');
        
        const interval = setInterval(async () => {
            try {
                const refreshedFeeds = await getWorkspaceFeedAction();
                if (refreshedFeeds && refreshedFeeds.length > 0) {
                    setFeeds(refreshedFeeds);
                    // 모든 분석이 끝났는지 확인
                    const stillAnalyzing = refreshedFeeds.some((f: any) => f.isAnalyzing);
                    if (!stillAnalyzing) {
                        console.log('[Feed Polling] All items analyzed. Polling stopped.');
                        clearInterval(interval);
                        router.refresh(); // 서버 데이터 최종 싱크
                    }
                }
            } catch (err) {
                console.error('[Feed Polling] Refresh failed:', err);
            }
        }, 3000); // 3초마다 체크

        return () => clearInterval(interval);
    }, [feeds, router]);

    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [selectedItemData, setSelectedItemData] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const handleClassify = async (id: string) => {
        setIsFetching(true);
        try {
            const result = await getWorkspaceItemDataAction(id);
            if (result.success && result.data) {
                setSelectedItemData(result.data);
                setIsOverlayOpen(true);
            } else {
                alert(result.message || '항목 데이터를 가져오지 못했습니다.');
            }
        } catch (error) {
            console.error('Failed to fetch item details:', error);
            alert('오류가 발생했습니다.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleCloseOverlay = () => {
        setIsOverlayOpen(false);
        setSelectedItemData(null);
    };

    const handleDummySubmit = async () => {
        // FeedList에서는 직접 업로드를 하지 않으므로 빈 함수 전달
        return { success: false, message: '직접 입력은 지원하지 않습니다.' };
    };

    return (
        <>
            <div className="space-y-4">
                {feeds.length > 0 ? (
                    feeds.map((feed: any) => (
                        <FeedCard 
                            key={feed.id} 
                            {...feed} 
                            onClassify={handleClassify}
                            onImageClick={(url) => setPreviewImageUrl(url)}
                        />
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

            {/* 분류 전용 오버레이 */}
            <AiInputOverlay 
                isOpen={isOverlayOpen}
                onClose={handleCloseOverlay}
                onSubmit={handleDummySubmit}
                initialData={selectedItemData ? { ...selectedItemData.aiData, status: selectedItemData.status, imageUrl: selectedItemData.imageUrl } : null}
                initialReportId={selectedItemData?.reportId}
                initialReportName={selectedItemData?.reportName}
                initialColumns={selectedItemData?.columns}
                workspaceItemId={selectedItemData?.isWorkspaceItem ? selectedItemData.id : null}
            />
            
            {/* 이미지 원본 보기 모달 */}
            {previewImageUrl && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <img 
                            src={previewImageUrl} 
                            alt="원본 미리보기" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                        <button 
                            className="absolute -top-10 right-0 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={() => setPreviewImageUrl(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
            
            {/* 로딩 인디케이터 (필요 시) */}
            {isFetching && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-gray-700">데이터를 불러오는 중...</span>
                    </div>
                </div>
            )}
        </>
    );
}
