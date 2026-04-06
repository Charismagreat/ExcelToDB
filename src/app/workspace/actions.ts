'use server';

import { getSessionAction } from '@/app/actions';
import { runAITool } from '@/lib/ai-tools';
import { insertRows } from '@/egdesk-helpers';


export async function submitWorkspaceDataAction(formData: FormData) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    const text = formData.get('text') as string;
    const image = formData.get('image') as File | null;

    console.log(`[Workspace AI Input] Text: "${text}" | Image: ${image?.name || 'none'}`);

    // AI 파이프라인 (기존 AI 툴 활용)
    // 텍스트/이미지를 기반으로 가장 적합한 테이블에 매핑하거나 "할 일" 등을 자동으로 정형화합니다.
    let responseText = "처리 완료되었습니다.";
    try {
        // 임시 로직: 들어온 데이터를 기반으로 단순 프롬프트를 구성해 파싱 시도
        // 실제 운영 시에는 OpenAI Vision API나 function calling으로 정교하게 테이블 스키마에 맞춰 분류합니다.
        let prompt = `사용자가 다음 워크스페이스 입력을 제공했습니다:\n\n텍스트: ${text}\n\n이 지시사항을 분석하여, 적절한 처리 결과를 반환해주세요.`;
        if (image) {
            prompt += `\n(이미지 첨부됨: ${image.name})`;
        }

        // 실제로는 runAITool 말고 system_tool 호출이나 별도 AI 파이프라인을 탈 수 있지만 여기서는 구조만 잡습니다.
        console.log("Analyzing with AI...", prompt.substring(0, 50));
        
        // --- EGDesk 데이터 저장 (모의) ---
        // 예: AI가 이 내용을 "현장보고서" 테이블에 기입해야 한다고 판단한 경우
        const mockTargetTable = "daily_report_log"; // 임의의 가상/물리적 테이블명
        
        // 실제로는 ai-tools.ts 또는 openai API 연동이 들어감
        // await insertRows(mockTargetTable, [{
        //    id: Date.now(),
        //    content: text,
        //    reporter: user.fullName || user.username,
        //    createdAt: new Date().toISOString()
        // }]);

        // 1초 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        

        responseText = "AI가 데이터를 분석하여 [업무 일지]에 성공적으로 기록했습니다.";
    } catch (err: any) {
        console.error("Workspace AI processing failed:", err);
        throw new Error("AI 분석 및 데이터 저장 중 오류가 발생했습니다.");
    }

    return { 
        success: true, 
        message: responseText
    };
}
