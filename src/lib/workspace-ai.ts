import { GoogleGenerativeAI } from "@google/generative-ai";
import { queryTable } from "@/egdesk-helpers";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });

export interface WorkspaceAiResult {
    reportId: string | null;
    reportName: string | null;
    extractedData: Record<string, any> | null;
    confidence: number;
    message: string;
}

/**
 * 워크스페이스에서 입력된 데이터(텍스트/이미지)를 분석하여 
 * 적절한 보고서를 찾고 데이터를 추출합니다.
 */
export async function processWorkspaceInput(
    text: string, 
    imageBase64?: string, 
    mimeType?: string
): Promise<WorkspaceAiResult> {
    if (!apiKey) throw new Error("AI API 키가 설정되지 않았습니다.");

    // 1. 모든 가용 보고서 스키마 조회
    const reports = await queryTable('report', { filters: { isDeleted: '0' } });
    if (!reports || reports.length === 0) {
        return { 
            reportId: null, 
            reportName: null, 
            extractedData: null, 
            confidence: 0, 
            message: "현재 등록된 보고서가 없습니다." 
        };
    }

    // 2. 보고서 식별 (Classification)
    const reportList = reports.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || "",
        columns: JSON.parse(r.columns).map((c: any) => c.name)
    }));

    const classificationPrompt = `
        당신은 사내 데이터 관리 도우미입니다. 사용자의 입력을 분석하여 다음 보고서 목록 중 가장 적합한 보고서를 하나 골라주세요.
        
        보고서 목록:
        ${JSON.stringify(reportList, null, 2)}
        
        사용자 입력:
        "${text}"
        ${imageBase64 ? "(이미지가 첨부되었습니다)" : ""}
        
        응답 규칙:
        1. 가장 관련성이 높은 보고서의 ID를 반환하세요.
        2. 확신도가 낮거나(0.7 미만) 매칭되는 보고서가 전혀 없을 경우 reportId를 null로 반환하세요.
        3. 반드시 아래 JSON 형식으로만 응답하세요:
        { "reportId": "선택된 ID 또는 null", "confidence": 0.0~1.0 }
    `;

    let classification: { reportId: string | null, confidence: number };
    try {
        const result = await model.generateContent(classificationPrompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        classification = jsonMatch ? JSON.parse(jsonMatch[0]) : { reportId: null, confidence: 0 };
    } catch (e) {
        console.error("Classification failure:", e);
        classification = { reportId: null, confidence: 0 };
    }

    if (!classification.reportId || classification.confidence < 0.7) {
        return {
            reportId: null,
            reportName: null,
            extractedData: null,
            confidence: classification.confidence,
            message: "매칭되는 보고서를 찾을 수 없습니다. 입력하신 내용이 어떤 보고서에 해당되는지 조금 더 자세히 말씀해 주세요."
        };
    }

    const selectedReport = reports.find((r: any) => r.id === classification.reportId);
    const columns = JSON.parse(selectedReport.columns);

    // 3. 데이터 추출 (Extraction)
    const extractionPrompt = `
        사용자의 입력을 분석하여 보고서 '${selectedReport.name}'의 스키마에 맞는 데이터를 추출하세요.
        
        컬럼 정보:
        ${columns.map((c: any) => `- ${c.name} (${c.type}${c.options ? `, 옵션: ${c.options.join(',')}` : ''})`).join('\n')}
        
        사용자 입력:
        "${text}"
        
        추출 규칙:
        1. 날짜는 YYYY-MM-DD 형식을 지키세요.
        2. 숫자는 쉼표 없이 숫자만 기입하세요.
        3. 반드시 유효한 단일 JSON 객체로만 응답하세요. (설명 금지)
        4. 값을 찾을 수 없는 필드는 null을 넣으세요.
    `;

    let extractedData: any = null;
    try {
        const contents: any[] = [extractionPrompt];
        if (imageBase64 && mimeType) {
            contents.push({ inlineData: { data: imageBase64, mimeType } });
        }
        
        const result = await model.generateContent(contents);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
        console.error("Extraction failure:", e);
    }

    return {
        reportId: selectedReport.id,
        reportName: selectedReport.name,
        extractedData,
        confidence: classification.confidence,
        message: extractedData ? `[${selectedReport.name}]에 데이터를 기록했습니다.` : "데이터 추출에 실패했습니다."
    };
}
