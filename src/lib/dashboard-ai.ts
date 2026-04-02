import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { queryTable } from "@/egdesk-helpers";
import { runAITool } from "@/lib/ai-tools";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 도구(Tools) 정의
const tools: any[] = [
  {
    functionDeclarations: [
      {
        name: "get_finance_monthly_summary",
        description: "금융 허브의 월별 지출/수입 요약을 가져옵니다. 전월 대비 비교 등에 사용하세요.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            months: { type: SchemaType.NUMBER, description: "조회할 개월 수 (최근 N개월)" }
          }
        }
      },
      {
        name: "get_finance_statistics",
        description: "특정 기간 동안의 금융 자산 통계(카테고리별 지출 등)를 조회합니다.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            startDate: { type: SchemaType.STRING, description: "시작일 (YYYY-MM-DD)" },
            endDate: { type: SchemaType.STRING, description: "종료일 (YYYY-MM-DD)" }
          }
        }
      },
      {
        name: "get_card_usage_by_approval_date",
        description: "승인일자(approvalDate)를 기준으로 카드 사용 내역을 정확히 집계합니다. 사용자가 '정확한 금액' 또는 '승인일 기준'을 요청할 때 반드시 이 도구를 사용하세요.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            startDate: { type: SchemaType.STRING, description: "시작일 (YYYY-MM-DD)" },
            endDate: { type: SchemaType.STRING, description: "종료일 (YYYY-MM-DD)" }
          },
          required: ["startDate", "endDate"]
        }
      },
      {
        name: "execute_analytical_sql",
        description: "워크스페이스 테이블에 대해 복잡한 분석 SQL(SELECT)을 실행합니다. 집계, 그룹화 등에 사용하세요. 테이블명은 'report_row'이며 'reportId' 필터가 필수입니다.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            sql: { type: SchemaType.STRING, description: "실행할 SELECT SQL 쿼리" }
          },
          required: ["sql"]
        }
      },
      {
        name: "query_workspace_table",
        description: "워크스페이스 테이블의 데이터를 필터링하여 조회합니다.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            tableId: { type: SchemaType.STRING, description: "보고서 ID" },
            limit: { type: SchemaType.NUMBER, description: "조회할 행 수" },
            offset: { type: SchemaType.NUMBER, description: "건너뛸 행 수" }
          },
          required: ["tableId"]
        }
      }
    ]
  }
];

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
  tools,
}, { apiVersion: 'v1beta' });

export interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie' | 'table';
  data: any[];
  xAxis: string;
  series: { key: string; name: string; color?: string }[];
  title: string;
  showLabels?: boolean;
  sourceDescription?: string; // 데이터 추출 로직 설명 (Human-readable)
  layout?: {
    span?: 'half' | 'full';
  };
  refreshMetadata?: {
    tool: string;            // 사용된 도구명
    args: any;               // 도구 호출 인자
    mapping?: {              // 도구 결과 -> 차트 데이터 매핑 정보
      label: string; 
      value: string;
    };
  };
}

export interface AIResponse {
  content: string;
  chartConfigs?: ChartConfig[];
}


/**
 * 선택된 테이블들의 기본 컨텍스트를 수집합니다.
 */
async function getInitialContext(tableIds: string[]) {
  const contexts = await Promise.all(tableIds.map(async (id) => {
    if (id === 'finance-hub-table') {
      return {
        id,
        name: '금융거래 통합 내역 (FinanceHub)',
        description: '카드 결제 및 계좌 거래 내역을 포함하는 통합 금융 데이터입니다.',
        availableTools: ['get_finance_monthly_summary', 'get_finance_statistics', 'get_card_usage_by_approval_date']
      };
    } else {
      const reports = await queryTable('report', { filters: { id } });
      const report = reports[0];
      if (!report) return null;
      return {
        id,
        name: report.name,
        schema: JSON.parse(report.columns),
        availableTools: ['execute_analytical_sql', 'query_workspace_table']
      };
    }
  }));
  return contexts.filter(Boolean);
}

/**
 * AI에게 시각화 추천 또는 대화형 분석을 요청합니다. (Agentic Control Loop)
 */
export async function getVisualizationRecommendation(
  tableIds: string[],
  messages: any[]
): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.");
  }

  const contexts = await getInitialContext(tableIds);
  const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const systemPrompt = `
    당신은 데이터 분석 전문가 및 시각화 전문가입니다. 사용자가 선택한 테이블의 정보를 분석하여 최적의 차트 시각화를 추천하거나 사용자의 질문에 답하세요.
    
    [현 시점 정보]
    - 현재 일시: ${currentTime}
    - 사용자가 "최근", "오늘", "이번 달", "최근 10일" 등을 언급하면 위 일시를 기준으로 도구의 기간(startDate, endDate)을 계산하십시오.
    
    [당신의 권한]
    당신은 실시간으로 데이터를 조회하고 집계할 수 있는 '도구(Tools)'를 가지고 있습니다. 
    1. 사용자가 "지난달과 이번달 비교"와 같이 전체 데이터 집계가 필요한 요청을 하면 관련 도구를 호출하십시오.
    2. 특히 "정확한 금액" 또는 "승인일 기준" 요청이 있으면 반드시 'get_card_usage_by_approval_date' 도구를 사용하여 데이터를 직접 집계하십시오. 이 도구는 요약 정보뿐만 아니라 '개별 거래 내역(transactions)' 데이터(승인일 approvalDate, 카드번호 cardNumber 등 포함)도 함께 반환하므로, 사용자가 "건별 내역"이나 "상세 표"를 요청할 때 이를 적극 활용하십시오.
    
    [분석 대상 테이블 정보]
    ${JSON.stringify(contexts, null, 2)}
    
    [응답 규칙]
    1. 답변 내용은 한국어로 친절하게 작성하세요.
    2. **표 형식 시각화 통합**: 사용자가 "표 형식으로 보여줘", "내역을 보여줘", "리스트로 보여줘"라고 요청하면, 'content'에는 간단한 요약만 작성하고 **상세 데이터는 반드시 'chartConfigs' 내에 'type: "table"'을 사용하여 독립된 표 컴포넌트로 생성**하십시오.
    3. **최근 데이터 해석**: 
       - 유선/금융 테이블의 경우 현재 일시를 기준으로 기간을 설정하십시오. 
       - 일반 워크스페이스 테이블에서 "최근 10개 내역" 등을 요청하면 'execute_analytical_sql'을 사용하여 'ORDER BY ... DESC LIMIT 10' 쿼리를 수행하십시오.
    4. 당신이 이전에 생성한 차트나 분석 내용을 기억하고, 사용자가 "그 차트에 ~를 추가해줘"라고 하면 이전 대화 맥락을 바탕으로 수정된 JSON을 제공하세요.
    5. 만약 사용자의 메시지가 "[대상 차트: '차트제목'] {요청내용}" 형식이면, 당신이 이전에 생성한 차트 중 해당 제목을 가진 차트를 찾아 그 설정을 수정하는 것에 집중하세요. 다른 차트들은 그대로 두거나 필요한 경우에만 업데이트하세요.
    6. **정밀 색상 제어**: 차트의 개별 요소(막대, 파이 조각 등)의 색상을 개별적으로 지정하려면 'data' 배열의 각 객체에 '"color": "#hex"' 속성을 추가하십시오. 특정 항목의 색상만 변경하라는 요청을 받으면, **해당 항목의 색상만 수정하고 다른 항목들은 기존에 적용되었던 색상을 유지**하여 일관성을 지키십시오.
    7. 이제 차트 막대나 선 위에 금액(값)을 상시 표시할 수 있습니다. 사용자가 수치를 직접 보고 싶어 한다면 chartConfigs에서 "showLabels": true를 설정하십시오. (기본적으로 true를 권장합니다)
    8. 시각화 추천이 포함된 경우, 반드시 응답 텍스트 끝에 JSON 형식을 포함하세요.
    9. **Explainability & Dynamic Sync**: 차트를 생성할 때 다음 두 필드를 반드시 포함하여 사용자가 데이터의 근거를 이해하고 최신 데이터로 갱신할 수 있게 하십시오.
       - 'sourceDescription': 데이터가 어떻게 추출되었는지에 대한 한글 설명 (예: "최근 6개월간의 월별 카드 지출 합계")
       - 'refreshMetadata': 자동 갱신을 위한 기술적 정보. 사용한 도구명('tool'), 인자('args'), 그리고 도구 결과 필드를 차트 데이터('label', 'value')로 매핑하는 정보('mapping')를 포함하십시오.
    
    응답 JSON 형식:
    {
      "content": "분석 결과 요약 (표 상세 내용은 아래 차트 영역에 생성됨)",
      "chartConfigs": [
        {
          "type": "bar | line | area | pie | table",
          "data": [{"label": "값1", "value": 100, "color": "#2563eb"}],
          "xAxis": "축으로 사용할 키 (table인 경우 첫 번째 컬럼)",
          "series": [{"key": "값의 키", "name": "표시될 이름", "color": "#hex"}],
          "title": "차트 제목",
          "showLabels": true,
          "sourceDescription": "데이터 추출 로직 설명",
          "refreshMetadata": {
            "tool": "사용된 도구명",
            "args": {"인자": "값"},
            "mapping": {"label": "결과필드명1", "value": "결과필드명2"}
          }
        }
      ]
    }
  `;

  // 대화 히스토리 구성 (Context Retention)
  const history = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "준비되었습니다. 이전 대화 맥락과 제공된 도구들을 활용하여 정확한 데이터 분석과 시각화를 도와드리겠습니다." }] }
  ];

  // 기존 메시지들을 히스토리에 추가 (최대 10개로 제한하여 토큰 관리)
  const recentMessages = messages.slice(-10);
  recentMessages.forEach((msg, idx) => {
    // 마지막 메시지는 sendMessage로 보낼 것이므로 제외 
    if (idx === recentMessages.length - 1) return;
    
    history.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  const chat = model.startChat({ history });

  const lastUserMessage = messages[messages.length - 1].content;
  let response = await chat.sendMessage(lastUserMessage);
  
  // 기능 호출 루프 (Agentic Loop)
  let retryCount = 0;
  while (response.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && retryCount < 5) {
    const functionCalls = response.response.candidates[0].content.parts
      .filter(p => p.functionCall)
      .map(p => p.functionCall!);
    
    const functionResponses = await Promise.all(functionCalls.map(async (call) => {
      const result = await runAITool(call.name, call.args);
      return {
        functionResponse: {
          name: call.name,
          response: { result }
        }
      };
    }));

    response = await chat.sendMessage(functionResponses);
    retryCount++;
  }

  const responseText = response.response.text();

  // JSON 추출
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return { content: responseText };
    }
  }

  return { content: responseText };
}
