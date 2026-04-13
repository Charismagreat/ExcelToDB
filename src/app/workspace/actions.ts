'use server';

import { getSessionAction } from '@/app/actions/auth';
import { addRowAction } from '@/app/actions/row';
import { uploadFileAction } from '@/app/actions/file';
import { queryTable, executeSQL, insertRows, updateRows, deleteRows } from '@/egdesk-helpers';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

// 워크스페이스 전용 ID 생성기 (표준 규격)
const generateWorkspaceId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;


/**
 * 워크스페이스 메인 피드 데이터를 가져옵니다.
 * SQL 엔진 500 에러를 회피하기 위해 애플리케이션 레벨에서 조인 및 필터링을 수행합니다.
 */
export async function getWorkspaceFeedAction() {
    const user = await getSessionAction();
    if (!user) return [];

    try {
        const creatorId = String(user.id || 'system');
        
        // 1. 각 테이블의 원천 데이터를 별도로 조회
        // 보안 필터: executeSQL 내 'isDeleted' 텍스트 사용 시 500 에러 발생하므로 queryTable로 대체
        let rawRows: any[] = [];
        let workspaceItems: any[] = [];
        let reports: any[] = [];
        let users: any[] = [];

        try {
            // 1) 기존 report_row 테이블의 미분류 항목 조회
            const rawRowsResult = await queryTable('report_row', { 
                limit: 50,
                orderBy: 'createdAt',
                orderDirection: 'DESC'
            });
            const allRows = (rawRowsResult?.rows || rawRowsResult || []) as any[];
            rawRows = allRows.filter(row => 
                String(row.creatorId) === creatorId && 
                Number(row.isDeleted) === 0 &&
                row.reportId === 'system-unclassified'
            );
        } catch (e) {
            console.error("[Feed Debug] report_row query failed:", e);
        }

        try {
            const workspaceResult = await queryTable('workspace_item', { 
                limit: 50,
                orderBy: 'createdAt',
                orderDirection: 'DESC'
            });
            const allItems = (workspaceResult?.rows || workspaceResult || []) as any[];
            // 모든 상태(pending, completed, deleted)를 피드에 노출하여 히스토리로 관리
            workspaceItems = allItems.filter(item => 
                String(item.creatorId) === creatorId
            );
        } catch (e) {
            console.error("[Feed Debug] workspace_item query failed:", e);
        }

        try {
            const reportsResult = await queryTable('report', { filters: { isDeleted: '0' } });
            reports = (reportsResult?.rows || reportsResult || []) as any[];
        } catch (e) {
            console.error("[Feed Debug] report query failed:", e);
        }

        try {
            const usersResult = await queryTable('user', { filters: { isActive: '1' } });
            users = (usersResult?.rows || usersResult || []) as any[];
        } catch (e) {
            console.error("[Feed Debug] user query failed:", e);
        }

        const reportMap = new Map((reports as any[]).map((r: any) => [String(r.id), r]));
        const userMap = new Map((users as any[]).map((u: any) => [String(u.id), u]));

        // 미분류 항목을 위한 가상 보고서 정의
        const systemUnclassifiedReport = {
            id: 'system-unclassified',
            name: '분류되지 않은 항목',
            type: 'UNCLASSIFIED'
        };
        reportMap.set(systemUnclassifiedReport.id, systemUnclassifiedReport);

        // 2. 신규 workspace_item 데이터를 피형 형식으로 변환
        const basePath = process.env.NEXT_PUBLIC_EGDESK_BASE_PATH || '';
        const formattedWorkspaceItems = workspaceItems.map((item: any) => {
            let imageUrl = item.imageUrl || '';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith(basePath)) {
                imageUrl = `${basePath}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            const isAnalyzing = (item.status === 'pending' && (!item.suggestedTitle || item.suggestedTitle.includes('분석 중...')));
            const report = item.reportId ? reportMap.get(String(item.reportId)) : null;
            
            // 사원 관점의 데이터 요약문 생성 (날짜 -> 상호 -> 금액 순서)
            let dataSummary = item.suggestedSummary || '';
            if (item.aiData) {
                try {
                    const aiData = JSON.parse(item.aiData);
                    // 다양한 키 이름 대응 (날짜, 상호, 금액)
                    const date = aiData['승인일시'] || aiData['거래일시'] || aiData['날짜'] || '';
                    const merchant = aiData['가맹점명'] || aiData['상호'] || aiData['가맹점'] || '';
                    const amount = aiData['사용금액'] || aiData['금액'] || aiData['합계'] || '';
                    
                    if (date || merchant || amount) {
                        // 금액 형식화 (숫자인 경우 천단위 콤마 추가)
                        const formattedAmount = typeof amount === 'number' ? amount.toLocaleString() : amount;
                        dataSummary = `${date} ${merchant} ${formattedAmount}`.trim().replace(/\s+/g, ' ');
                    }
                } catch (e) {}
            }

            return {
                id: item.id,
                type: 'UNCLASSIFIED' as const,
                title: report?.name || '분류되지 않은 항목', // 제목에 테이블명 표시
                content: isAnalyzing ? '이미지를 분석하고 있습니다...' : (dataSummary || '요약된 데이터 정보가 없습니다.'), // 본문에 데이터 내용 표시
                imageUrl: imageUrl,
                timestamp: formatRelativeTime(item.createdAt),
                createdAt: new Date(item.createdAt).getTime(),
                creator: userMap.get(String(item.creatorId))?.fullName || '사용자',
                originalText: item.originalText,
                isWorkspaceItem: true,
                status: item.status || 'pending',
                isAnalyzing, 
                isCompleted: item.status === 'completed',
                isDeleted: item.status === 'deleted'
            };
        });

        // 3. 기존 report_row 데이터를 피드 형식으로 변환 (하위 호환성 유지)
        const formattedReportRows = rawRows
            .map((row: any) => {
                const report = reportMap.get(String(row.reportId));
                if (!report && row.reportId !== 'system-unclassified') return null;

                let parsedData: any = {};
                try {
                    parsedData = JSON.parse(row.data);
                } catch (e) {
                    parsedData = { content: row.data };
                }

                const isUnclassified = row.reportId === 'system-unclassified';
                const reportName = isUnclassified ? '분류 필요 항목' : report?.name || '기타 보고서';

                // 데이터 요약 생성
                const keys = Object.keys(parsedData);
                const dataSummary = isUnclassified 
                    ? (parsedData.suggestedSummary || '분류가 필요한 데이터입니다.') 
                    : (keys.length > 1 ? `${parsedData[keys[0]] || ''} ${parsedData[keys[1]] || ''}`.trim() : JSON.stringify(parsedData));

                const type: 'TASK' | 'NOTICE' | 'ACTIVITY' | 'UNCLASSIFIED' = 
                    isUnclassified ? 'UNCLASSIFIED' :
                    (report?.name || '').includes('공지') ? 'NOTICE' : 
                    (report?.name || '').includes('할 일') || (report?.name || '').includes('보고') ? 'TASK' : 'ACTIVITY';

                // 이미지 경로에 베이스 경로 적용
                const bPath = process.env.NEXT_PUBLIC_EGDESK_BASE_PATH || '';
                let imageUrl = parsedData.영수증사진 || parsedData.imageUrl || '';
                if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith(bPath)) {
                    imageUrl = `${bPath}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                }

                return {
                    id: row.id,
                    type,
                    title: reportName, // 제목에 테이블명 표시
                    content: dataSummary, // 본문에 데이터 내용 표시
                    author: isUnclassified ? 'AI 분석기' : '시스템',
                    timestamp: formatRelativeTime(row.createdAt),
                    createdAt: new Date(row.createdAt).getTime(), // 정렬용
                    isCompleted: !isUnclassified, // 미분류가 아닌 경우(이미 분류됨) 완료로 표시
                    likes: isUnclassified ? 0 : Math.floor(Math.random() * 5),
                    comments: 0,
                    imageUrl: imageUrl,
                    unclassifiedReason: parsedData.unclassifiedReason
                };
            })
            .filter(Boolean) as any[];

        // 4. 통합 및 정렬
        const allFeeds = [...formattedWorkspaceItems, ...formattedReportRows]
            .sort((a: any, b: any) => b.createdAt - a.createdAt)
            .slice(0, 50);

        return allFeeds;
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
    const images = formData.getAll('image') as File[];
    const validImages = images.filter(img => img && img.size > 0);

    console.log(`[Workspace AI Input] Text: "${text}" | Images: ${validImages.length}`);

    try {
        // 1. 이미지가 여러 장인 경우: 선 저장 후 순차/수동 분류 유도
        if (validImages.length > 1) {
            console.log(`[Batch Upload] Processing ${validImages.length} images...`);
            
            const results = await Promise.all(validImages.map(async (image) => {
                try {
                    // 일단 서버에 저장
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', image);
                    const uploadResult = await uploadFileAction(uploadFormData);
                    const imageUrl = uploadResult.url;

                    const itemId = generateWorkspaceId();
                    // 전용 테이블(workspace_item)에 저장
                    await insertRows('workspace_item', [{
                        id: itemId,
                        creatorId: user.id || 'system',
                        imageUrl: imageUrl, // 이미지 전용 컬럼 활용
                        originalText: text,
                        suggestedTitle: `${image.name} (일괄 등록)`,
                        suggestedSummary: "여러 장의 사진을 한꺼번에 올렸습니다. 피드에서 개별적으로 분류해 주세요.",
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }]);

                    // 개별 항목 배경 분석 트리거
                    analyzeWorkspaceItemAction(itemId).catch(err => {
                        console.error(`[Batch Background Analysis Error] Item ${itemId}:`, err);
                    });

                    return { success: true };
                } catch (e) {
                    console.error("Batch upload item failed:", e);
                    return { success: false };
                }
            }));

            const successCount = results.filter(r => r.success).length;

            return {
                success: true,
                isBatch: true,
                message: `${successCount}장의 사진이 등록되었습니다. 워크스페이스 피드에서 각 항목을 눌러 분류를 진행해 주세요.`
            };
        }

        // 2. 단일 이미지/텍스트 업로드: 대기 중단 및 피드 즉시 등록 (비동기 처리 지향)
        const image = validImages[0] || null;
        let imageUrl: string | undefined;

        if (image) {
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('file', image);
                const uploadResult = await uploadFileAction(uploadFormData);
                imageUrl = uploadResult.url;
            } catch (e) {
                console.error("Single image upload failed:", e);
            }
        }

        // 전용 테이블(workspace_item)에 즉시 등록
        const itemId = generateWorkspaceId();
        await insertRows('workspace_item', [{
            id: itemId,
            creatorId: user.id || 'system',
            imageUrl: imageUrl,
            originalText: text,
            suggestedTitle: image ? `${image.name} (분석 중...)` : "텍스트 분석 중...",
            suggestedSummary: "", // 안내 문구 제거
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }]);

        // [핵심] 배경 분석 트리거 (await 하지 않음 - 사용자 응답 속도 최우선)
        analyzeWorkspaceItemAction(itemId).catch(err => {
            console.error(`[Background Analysis Error] Item ${itemId}:`, err);
        });

        // 피드 갱신 강제
        revalidatePath('/workspace');

        return {
            success: true,
            isUnclassified: true,
            message: "등록이 시작되었습니다. 피드에서 분류 결과를 확인해 주세요."
        };

    } catch (err: any) {
        console.error("Workspace AI processing failed:", err);
        return {
            success: false,
            message: err.message || "AI 분석 중 오류가 발생했습니다."
        };
    }
}

/**
 * 특정 워크스페이스 항목의 상세 분석 데이터를 조회합니다.
 */
export async function getWorkspaceItemDataAction(itemId: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    try {
        const creatorId = String(user.id || 'system');
        const basePath = process.env.NEXT_PUBLIC_EGDESK_BASE_PATH || '';

        console.log(`[Workspace Item Detail] Fetching ID: ${itemId}`);
        
        // workspace_item 테이블 먼저 조회
        const items = await queryTable('workspace_item', { filters: { id: itemId } });
        const item = Array.isArray(items) ? items[0] : (items.rows?.[0]);

        if (item) {
            console.log(`[Workspace Item Detail] Found in workspace_item. Status: ${item.status}`);
            // 이미지 경로에 베이스 경로 적용 (중복 적용 방지)
            let imageUrl = item.imageUrl || '';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith(basePath)) {
                imageUrl = `${basePath}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            let aiData = {};
            if (item.aiData) {
                try {
                    aiData = JSON.parse(item.aiData);
                } catch (e) {
                    console.error("Failed to parse aiData:", e);
                }
            }

            let reportName = null;
            let columns = [];

            if (item.reportId) {
                try {
                    const reportRes = await queryTable('report', { filters: { id: String(item.reportId) } });
                    const report = Array.isArray(reportRes) ? reportRes[0] : (reportRes.rows?.[0]);
                    if (report) {
                        reportName = report.name;
                        columns = JSON.parse(report.columns || '[]');
                    }
                } catch (e) {
                    console.error("Failed to fetch report info for item:", e);
                }
            }

            return {
                success: true,
                data: {
                    id: item.id,
                    imageUrl,
                    originalText: item.originalText,
                    suggestedTitle: item.suggestedTitle,
                    suggestedSummary: item.suggestedSummary,
                    aiData,
                    reportId: item.reportId,
                    reportName,
                    columns,
                    status: item.status || 'pending', // 상세 조회 시 보정
                    isWorkspaceItem: true
                }
            };
        }

        // 만약 workspace_item이 아니라 report_row(기존 미분류)인 경우
        const rows = await queryTable('report_row', { filters: { id: itemId } });
        const row = Array.isArray(rows) ? rows[0] : (rows.rows?.[0]);

        if (row) {
            let parsedData: any = {};
            try {
                parsedData = JSON.parse(row.data);
            } catch (e) {
                parsedData = { content: row.data };
            }

            let imageUrl = parsedData.imageUrl || parsedData.영수증사진 || '';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith(basePath)) {
                imageUrl = `${basePath}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            let reportName = null;
            let columns = [];
            if (row.reportId && row.reportId !== 'system-unclassified') {
                try {
                    const reportRes = await queryTable('report', { filters: { id: String(row.reportId) } });
                    const report = Array.isArray(reportRes) ? reportRes[0] : (reportRes.rows?.[0]);
                    if (report) {
                        reportName = report.name;
                        columns = JSON.parse(report.columns || '[]');
                    }
                } catch (e) {}
            }

            return {
                success: true,
                data: {
                    id: row.id,
                    imageUrl,
                    originalText: parsedData.originalText,
                    suggestedTitle: parsedData.suggestedTitle,
                    suggestedSummary: parsedData.suggestedSummary,
                    reportId: row.reportId === 'system-unclassified' ? null : row.reportId,
                    reportName,
                    columns,
                    aiData: parsedData,
                    status: Number(row.isDeleted) === 1 ? 'deleted' : (row.reportId === 'system-unclassified' ? 'pending' : 'completed'),
                    isWorkspaceItem: false
                }
            };
        }

        return { success: false, message: "항목을 찾을 수 없습니다." };
    } catch (err: any) {
        console.error("Failed to fetch item data:", err);
        return { success: false, message: err.message };
    }
}

/**
 * 사용자가 수정한 최종 데이터를 DB에 저장합니다.
 */
export async function confirmWorkspaceDataAction(reportId: string, rowData: Record<string, any>, workspaceItemId?: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    try {
        console.log(`[Workspace Final Save] Report: ${reportId} | WorkspaceItem: ${workspaceItemId} | Data:`, rowData);
        
        // 1. 기존 addRowAction을 호출하여 물리+가상 테이블 동기화
        const result = await addRowAction(reportId, rowData);
        
        // 2. 신규 테이블(workspace_item) 상태 업데이트
        if (workspaceItemId) {
            await updateRows('workspace_item', { 
                status: 'completed',
                reportId: reportId,
                updatedAt: new Date().toISOString()
            }, { filters: { id: workspaceItemId } });
        }
        
        revalidatePath('/workspace');
        return { 
            success: true, 
            message: "데이터가 성공적으로 저장되었습니다." 
        };
    } catch (err: any) {
        console.error("Workspace final save failed:", err);
        return {
            success: false,
            message: err.message || "데이터 저장 중 오류가 발생했습니다."
        };
    }
}

/**
 * [내부 액션] 배경에서 AI 분석을 수행하고 결과를 업데이트합니다.
 */
async function analyzeWorkspaceItemAction(itemId: string) {
    const { processWorkspaceInput } = await import('@/lib/workspace-ai');
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
        // 1. 항목 조회
        const items = await queryTable('workspace_item', { filters: { id: itemId } });
        const item = Array.isArray(items) ? items[0] : (items.rows?.[0]);
        if (!item) return;

        let base64Image: string | undefined;
        let mimeType: string | undefined;

        // 2. 이미지 파일 처리 (있을 경우)
        if (item.imageUrl) {
            try {
                const publicPath = path.join(process.cwd(), 'public', item.imageUrl);
                const buffer = await fs.readFile(publicPath);
                base64Image = buffer.toString('base64');
                const ext = path.extname(publicPath).toLowerCase();
                mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            } catch (e) {
                console.warn(`[AI Background] Failed to read image file: ${item.imageUrl}`, e);
            }
        }

        // 3. AI 분석 수행
        const aiResult = await processWorkspaceInput(item.originalText || "", base64Image, mimeType);

        // 4. 분석 결과 업데이트
        const updateData: any = {
            suggestedTitle: aiResult.suggestedTitle || (aiResult.reportName ? `${aiResult.reportName} 항목` : '분류 필요 항목'),
            suggestedSummary: aiResult.suggestedSummary || aiResult.message || '분류 준비가 완료되었습니다.',
            reportId: aiResult.reportId || undefined,
            aiData: JSON.stringify(aiResult.extractedData || {}),
            updatedAt: new Date().toISOString()
        };

        // 5. 자동 분류 (Auto-Confirm): 신뢰도가 0.9 이상이고 분석 데이터가 있는 경우
        let isAutoConfirmed = false;
        if (aiResult.reportId && aiResult.extractedData && (aiResult.confidence || 0) >= 0.9) {
            console.log(`[AI Background] Auto-confirming item ${itemId} (Confidence: ${aiResult.confidence}) for report ${aiResult.reportId}`);
            try {
                // extractedData의 각 필드가 유효한지 최종 점검 (빈 객체면 제외)
                if (Object.keys(aiResult.extractedData).length > 0) {
                    const confirmResult = await confirmWorkspaceDataAction(
                        aiResult.reportId, 
                        aiResult.extractedData, 
                        itemId
                    );
                    if (confirmResult.success) {
                        isAutoConfirmed = true;
                        updateData.status = 'completed';
                        console.log(`[AI Background] Item ${itemId} auto-confirmed successfully.`);
                    } else {
                        console.warn(`[AI Background] Auto-confirm failed for ${itemId}: ${confirmResult.message}`);
                    }
                }
            } catch (confirmErr: any) {
                console.error(`[AI Background] Auto-confirmation exception for item ${itemId}: ${confirmErr.message}`);
            }
        }

        // 6. 최종 요약문 결정 (실제 저장 여부에 따라 보정)
        if (isAutoConfirmed) {
            updateData.suggestedSummary = aiResult.reportName ? `[${aiResult.reportName}]에 데이터를 기록했습니다.` : '데이터를 성공적으로 기록했습니다.';
        } else {
            // 저장되지 않은 경우, AI가 제안한 요약문에서 "기록했습니다" 등의 확정적 표현이 있다면 "준비되었습니다" 등으로 완화
            let summary = aiResult.suggestedSummary || aiResult.message || '분석이 완료되었습니다.';
            summary = summary.replace(/기록했습니다|저장했습니다|완료했습니다/g, '분석이 완료되었습니다. 확인 후 저장해 주세요.');
            updateData.suggestedSummary = summary;
        }

        await updateRows('workspace_item', updateData, { filters: { id: String(itemId) } });

        console.log(`[AI Background] Item ${itemId} analysis completed. (Auto-Confirmed: ${isAutoConfirmed})`);
        revalidatePath('/workspace');
        if (aiResult.reportId) {
            revalidatePath(`/report/${aiResult.reportId}`);
        }

    } catch (err) {
        console.error(`[AI Background] Analysis failed for item ${itemId}:`, err);
    }
}

/**
 * 워크스페이스 항목을 삭제합니다. (레코드 + 실제 파일)
 */
export async function deleteWorkspaceItemAction(itemId: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    try {
        console.log(`[Workspace Delete] Item: ${itemId}`);

        // 1. 이미지 파일 경로 확인 (workspace_item 또는 report_row)
        let imageUrl = '';
        const items = await queryTable('workspace_item', { filters: { id: String(itemId) } });
        const item = Array.isArray(items) ? items[0] : (items.rows?.[0]);

        if (item) {
            // 실제 삭제 대신 'deleted' 상태로 업데이트 (히스토리 보존)
            await updateRows('workspace_item', { 
                status: 'deleted',
                updatedAt: new Date().toISOString()
            }, { filters: { id: String(itemId) } });
            
            console.log(`[Workspace Delete] Item marked as deleted: ${itemId}`);
        } else {
            // workspace_item에 없다면 report_row(미분류)에서 확인
            const rows = await queryTable('report_row', { filters: { id: String(itemId) } });
            const row = Array.isArray(rows) ? rows[0] : (rows.rows?.[0]);
            if (row) {
                // report_row의 경우 isDeleted 플래그 활용
                await updateRows('report_row', { 
                    isDeleted: 1, 
                    updatedAt: new Date().toISOString() 
                }, { filters: { id: String(itemId) } });
            }
        }

        // 파일은 삭제하지 않고 기록용으로 보존합니다.
        // (필요 시 일정 기간 후 삭제하는 배치 작업 등으로 관리 가능)

        revalidatePath('/workspace');
        return { success: true, message: "항목이 삭제되었습니다." };
    } catch (err: any) {
        console.error("Failed to delete workspace item:", err);
        return { success: false, message: err.message };
    }
}
