import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 사용자의 요청에 따라 최신 모델인 gemini-2.5-flash 사용 (v1 API 유지)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1' });

export interface ColumnRecommendation {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency';
  isRequired: boolean;
}

export interface RecommendationTable {
  tableName: string;
  sheetName?: string; // Optional: Some models might use sheetName instead of tableName
  columns: ColumnRecommendation[];
  reason: string;
}

export interface RecommendationResponse {
  recommendedTables: RecommendationTable[];
}

/**
 * Analyzes an Excel screenshot using Gemini Vision API to recommend database tables and columns.
 * 
 * @param imageBase64 Base64 encoded image data
 * @param mimeType Mime type of the image (e.g., "image/png", "image/jpeg")
 * @returns A JSON object containing recommended tables and columns
 */
export async function analyzeExcelImage(imageBase64: string, mimeType: string): Promise<RecommendationResponse> {
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.");
  }

  const prompt = `
    이 이미지는 엑셀 파일의 내용을 시각적으로 렌더링한 스크린샷입니다.
    사용자가 서비스 운영을 위해 이 엑셀에서 데이터베이스 '테이블'로 변환할 핵심 정보를 찾고 있습니다.
    
    분석 가이드라인:
    1. 표(Table)의 경계가 뚜렷하게 나뉘어 있다면 각각 다른 테이블로 식별하세요.
    2. 데이터 행들 위에 있는 '머리글(Header)' 행을 정확히 찾으세요. (예: 날짜, 이름, 금액 등)
    3. 단순 서술형 텍스트나 제목만 있는 셀은 무시하고, 실제 관리 및 집계가 필요한 '열(Column)' 위주로 추천하세요.
    4. 각 컬럼의 데이터 성격(문자/숫자 등)과 필수 여부를 시각적으로 분석하여 추천하세요.
    5. 분석 사유를 한국어로 상세히 설명하세요.
    
    응답은 반드시 아래 JSON 형식을 엄격히 지켜야 하며, 다른 텍스트는 절대 포함하지 마세요:
    {
      "recommendedTables": [
        {
          "tableName": "식별된 테이블/시트 이름",
          "columns": [
            { "name": "컬럼명", "type": "string, number, date, 또는 currency", "isRequired": true 또는 false }
          ],
          "reason": "이 최적의 영역을 추천하는 비즈니스적 이유"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Markdown JSON blocks removal if present
    const cleanedText = text.replace(/```json|```/g, "").trim();
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("결과에서 유효한 JSON 데이터를 찾을 수 없습니다.");
    }
    
    const jsonStr = cleanedText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr) as RecommendationResponse;
  } catch (error) {
    console.error("Gemini Vision AI 에러:", error);
    throw new Error("AI 분석 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : String(error)));
  }
}
