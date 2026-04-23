import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getTableSchema } from "@/egdesk-helpers";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview"
}, { apiVersion: 'v1beta' });

export interface PublishingAIResponse {
  content: string;
  mappingConfig?: any;
  uiSettings?: any;
}

/**
 * AI를 통해 마이크로 앱의 매핑 설정을 제안하거나 대화로 수정합니다.
 */
export async function getPublishingAIAdjustment(
  templateId: string,
  tableId: string,
  messages: any[],
  currentConfig?: { mappingConfig: any; uiSettings: any }
): Promise<PublishingAIResponse> {
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.");

  const schema = await getTableSchema(tableId);
  const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const systemPrompt = `
    당신은 비즈니스 데이터 매핑 전문가입니다. 사용자의 테이블 데이터를 분석하여 특정 비즈니스 템플릿에 최적화된 매핑 설정을 생성하거나 수정하십시오.
    
    [대상 템플릿]
    - ID: ${templateId}
    - 요구 필드 (Cash Report 기준):
      - date: 날짜 컬럼
      - inflow: 수입/입금액 컬럼
      - outflow: 지출/출금액 컬럼
      - description: 적요/내역 컬럼
      - category: (선택) 카테고리/구분 컬럼
    
    [원본 테이블 스키마]
    ${JSON.stringify(schema, null, 2)}
    
    [현재 설정]
    ${JSON.stringify(currentConfig || {}, null, 2)}
    
    [응답 규칙]
    1. 답변은 한국어로 친절하게 작성하세요.
    2. 사용자가 특정 컬럼을 변경해달라고 하거나 수식을 요청하면 'mappingConfig'를 업데이트하십시오.
    3. 'uiSettings'에는 템플릿의 UI 옵션(예: 차트 종류, 특정 위젯 노출 여부)을 담을 수 있습니다.
    4. 반드시 유효한 단일 JSON 객체 형식으로만 응답하세요.
    
    응답 JSON 형식:
    {
      "content": "변경 사항에 대한 친절한 설명",
      "mappingConfig": {
        "date": "column_name",
        "inflow": "column_name",
        "outflow": "column_name",
        "description": "column_name",
        "category": "column_name"
      },
      "uiSettings": {
        "showChart": true,
        "primaryColor": "#3b82f6"
      }
    }
  `;

  const history = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "준비되었습니다. 테이블 스키마를 바탕으로 최적의 매핑 설정을 제안해 드리고, 대화를 통해 세밀하게 조정해 드리겠습니다." }] }
  ];

  const chat = model.startChat({ history });
  const lastUserMessage = messages[messages.length - 1].content;
  
  const response = await chat.sendMessage(lastUserMessage);
  const responseText = response.response.text();
  
  let cleanedResponseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const jsonMatch = cleanedResponseText.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[Publishing AI Parsing Error]:", e);
    }
  }

  return { content: cleanedResponseText };
}
