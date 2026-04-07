import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 사용자의 요청에 따라 최신 모델인 gemini-3-flash-preview 사용 (v1 API 유지)
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }, { apiVersion: "v1beta" });

export interface ColumnRecommendation {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'select' | 'boolean' | 'textarea' | 'file' | 'email' | 'phone' | 'auto';
  isRequired: boolean;
  isUnique?: boolean;
  options?: string[];
  autoPrefix?: string;
  reason?: string;
}

export interface RecommendationTable {
  tableName: string;
  columns: ColumnRecommendation[];
  reason?: string;
}

export interface RecommendationResponse {
  columns?: ColumnRecommendation[];
  recommendedTables?: RecommendationTable[];
}

/**
 * 추천을 위한 샘플 데이터를 기반으로 최적의 스키마를 제안합니다.
 */
export async function recommendSchemaFromSample(currentColumns: any[], sampleRows: any[]): Promise<RecommendationResponse> {
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.");
  }

  const prompt = `
    당신은 데이터베이스 설계 전문가입니다. 현재 테이블의 컬럼 이름과 실제 데이터 샘플을 보고, 각 컬럼에 가장 적합한 속성을 추천해 주세요.
    
    지원하는 타입(type) 종류:
    1. string: 일반 텍스트
    2. number: 숫자 (집계 가능)
    3. date: 날짜 (YYYY-MM-DD)
    4. currency: 통화/금액
    5. select: 정해진 목록 중 선택 (고유 값이 반복될 때 권장)
    6. boolean: 예/아니오 (체크박스)
    7. textarea: 50자 이상의 긴 문장이나 메모
    8. email: 이메일 주소
    9. phone: 전화번호
    10. file: 이미지, 영수증, 증빙 서류 등의 파일 첨부
    11. auto: 'DID-000001'과 같은 자동 생성 일련번호
    
    입력 정보:
    - 현재 컬럼명: ${currentColumns.map(c => c.name).join(', ')}
    - 데이터 샘플 (최대 20행): ${JSON.stringify(sampleRows)}
    
    분석 및 추천 가이드라인:
    - 각 컬럼의 이름과 실제 값들의 패턴을 분석하세요.
    - 값이 모두 채워져 있으면 isRequired를 true로 추천하세요.
    - 이메일(@)이나 전화번호 패턴이 보이면 전용 타입을 추천하세요.
    - 고유 값의 종류가 적고 반복적으로 등장하면 select 타입을 추천하고, 가능한 옵션 리스트(options)를 모두 추출하세요.
    - 예/아니오, Y/N 등의 데이터는 boolean으로 추천하세요.
    - 분석 사유(reason)를 한국어로 짧게 핵심만 포함하세요.
    
    응답은 반드시 아래 JSON 형식을 엄격히 지켜야 하며, 다른 텍스트는 절대 포함하지 마세요:
    {
      "columns": [
        { 
          "name": "컬럼명", 
          "type": "위 11가지 중 하나", 
          "isRequired": true/false, 
          "isUnique": true/false,
          "options": ["옵션1", "옵션2"] (select 타입인 경우만),
          "autoPrefix": "접두어" (auto 타입인 경우만),
          "reason": "추천 사유"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 응답에서 유효한 JSON을 찾을 수 없습니다.");
    return JSON.parse(jsonMatch[0]) as RecommendationResponse;
  } catch (error) {
    console.error("Gemini Schema Recommendation Error:", error);
    throw error;
  }
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

/**
 * Extracts data from an image (receipt, business card, etc.) based on a specific table schema.
 * 
 * @param imageBase64 Base64 encoded image data
 * @param mimeType Mime type of the image
 * @param columns Array of column definitions (name, type, options)
 * @returns A JSON object containing extracted field values
 */
export async function extractDataFromImage(imageBase64: string, mimeType: string, columns: any[]): Promise<any> {
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.");
  }

  const schemaInfo = columns
    .filter(c => !c.isAutoGenerated)
    .map(c => `- ${c.name} (유형: ${c.type}${c.options ? `, 옵션: ${c.options.join(', ')}` : ''})`)
    .join('\n');

  const prompt = `
    이 이미지는 영수증, 명함, 또는 기타 문서의 사진입니다.
    이미지에서 텍스트를 분석하여 아래의 데이터베이스 스키마에 맞는 정보를 추출해 주세요.
    
    추출할 항목 리스트:
    ${schemaInfo}
    
    분석 및 응답 규칙:
    1. 사진 성격 파악: 명함, 영수증, 계약서 등 이미지의 성격을 먼저 파악하고 그에 맞는 정보를 추출하세요.
    2. 방향 무시: 이미지가 회전되어 있더라도 텍스트의 방향을 지능적으로 판단하여 읽으세요.
    3. 반드시 유효한 단일 JSON 객체로만 응답하세요. (다른 설명 텍스트 금지)
    4. 필드 이름은 위 리스트에 제공된 '이름'과 정확히 일치해야 합니다.
    5. 날짜(date) 유형은 'YYYY-MM-DD' 형식을 엄격히 지켜야 합니다. (이미지에 연도가 없으면 현재 연도 2026 사용)
    6. 숫자(number) 또는 통화(currency) 유형은 쉼표, 원화 기호, 공백 없이 숫자만 반환하세요.
    7. 목록 선택(select) 유형은 상기 제공된 '옵션' 중 이미지 내용과 가장 잘 맞는 하나를 정확히 선택하세요.
    8. 정보를 도저히 찾을 수 없는 경우 해당 필드 값에 null을 넣으세요.
    9. 마크다운 기호를 사용하지 말고 순수 JSON 문자열만 응답하세요.
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
    
    // 로깅 추가 (디버깅용)
    console.log("Raw AI Response:", text);

    // 마크다운 블록(```json 등) 제거 및 양쪽 공백 제거
    const cleanedText = text.replace(/```json|```/gi, "").trim();

    // 첫 번째 { 와 마지막 } 기호 위치를 찾아 JSON 문자열만 추출
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("No JSON found in AI response:", text);
      throw new Error("AI 응답에서 유효한 데이터 형식을 찾을 수 없습니다.");
    }
    
    const jsonStr = cleanedText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Vision Data Extraction Error:", error);
    if (error instanceof SyntaxError) {
        throw new Error("AI가 생성한 데이터 형식이 올바르지 않습니다. (JSON 파싱 에러)");
    }
    throw error;
  }
}
