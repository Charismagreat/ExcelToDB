'use server';

import { getSessionAction, addRowAction } from '@/app/actions';
import { queryTable, executeSQL } from '@/egdesk-helpers';
import { processWorkspaceInput } from '@/lib/workspace-ai';


/**
 * 워크스페이스 메인 피드 데이터를 가져옵니다.
 * SQL 엔진 500 에러를 회피하기 위해 애플리케이션 레벨에서 조인 및 필터링을 수행합니다.
 */
export async function getWorkspaceFeedAction() {
    const user = await getSessionAction();
    if (!user) return [];

    try {
        // 1. 각 테이블의 원천 데이터를 별도로 조회 (SQL 필터/정렬 시 500 에러 발생 대응)
        const [rawRows, reports, users] = await Promise.all([
            executeSQL('SELECT * FROM report_row'),
            queryTable('report', { filters: { isDeleted: '0' } }),
            queryTable('user', { filters: { isActive: '1' } })
        ]);

        if (!rawRows || !rawRows.rows) return [];
        
        const reportMap = new Map(reports.map((r: any) => [r.id, r]));
        const userMap = new Map(users.map((u: any) => [u.id, u]));

        // 2. JS 레벨에서 조인, 필터링 및 정렬 수행
        const feedData = rawRows.rows
            .filter((row: any) => Number(row.isDeleted) === 0) // 삭제되지 않은 것만
            .map((row: any) => {
                const report = reportMap.get(row.reportId);
                const creator = userMap.get(row.creatorId);
                
                if (!report) return null; // 연결된 보고서가 없으면 제외

                let parsedData: any = {};
                try {
                    parsedData = JSON.parse(row.data);
                } catch (e) {
                    parsedData = { content: row.data };
                }

                const keys = Object.keys(parsedData);
                const title = parsedData[keys[0]] || report.name;
                const content = keys.length > 1 ? parsedData[keys[1]] : JSON.stringify(parsedData);

                const type: 'TASK' | 'NOTICE' | 'ACTIVITY' = 
                    report.name.includes('공지') ? 'NOTICE' : 
                    report.name.includes('할 일') || report.name.includes('보고') ? 'TASK' : 'ACTIVITY';

                return {
                    id: row.id,
                    type,
                    title,
                    content,
                    author: creator?.fullName || '시스템',
                    timestamp: formatRelativeTime(row.createdAt),
                    createdAt: new Date(row.createdAt).getTime(), // 정렬용
                    isCompleted: false,
                    likes: Math.floor(Math.random() * 5),
                    comments: 0
                };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.createdAt - a.createdAt) // 최신순 정렬
            .slice(0, 20); // 상위 20개만

        return feedData;
    } catch (err) {
        console.error("Failed to fetch workspace feed (JS fallback):", err);
        return [];
    }
}

/**
 * 상대 시간을 문자열로 변환하는 헬퍼 함수
 */
function formatRelativeTime(dateStr: string) {
    if (!dateStr) return '알 수 없음';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
}

export async function submitWorkspaceDataAction(formData: FormData) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    const text = formData.get('text') as string;
    const image = formData.get('image') as File | null;

    console.log(`[Workspace AI Input] Text: "${text}" | Image: ${image?.name || 'none'}`);

    try {
        let imageBase64: string | undefined;
        let mimeType: string | undefined;

        if (image && image.size > 0) {
            const buffer = Buffer.from(await image.arrayBuffer());
            imageBase64 = buffer.toString('base64');
            mimeType = image.type;
        }

        // 1. AI를 통한 분석 및 데이터 추출
        const aiResult = await processWorkspaceInput(text, imageBase64, mimeType);

        // 2. 적절한 보고서가 식별된 경우 DB 저장
        if (aiResult.reportId && aiResult.extractedData) {
            console.log(`[AI Match Success] Report: ${aiResult.reportName} | Data:`, aiResult.extractedData);
            
            // 기존 addRowAction을 호출하여 물리+가상 테이블 동기화 및 알림 처리
            await addRowAction(aiResult.reportId, aiResult.extractedData);
            
            return { 
                success: true, 
                message: aiResult.message 
            };
        }

        // 3. 식별되지 않았거나 데이터 추출 실패
        return {
            success: false,
            message: aiResult.message || "매칭되는 보고서를 찾을 수 없습니다. 조금 더 자세히 입력해 주세요."
        };

    } catch (err: any) {
        console.error("Workspace AI processing failed:", err);
        return {
            success: false,
            message: err.message || "AI 분석 중 오류가 발생했습니다."
        };
    }
}
