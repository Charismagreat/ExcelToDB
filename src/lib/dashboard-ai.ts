import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { queryTable, aggregateTable, executeSQL } from "@/egdesk-helpers";
import { queryCardTransactions, getMonthlySummary, getStatistics } from "@/financehub-helpers";

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
  type: 'bar' | 'line' | 'area' | 'pie';
  data: any[];
  xAxis: string;
  series: { key: string; name: string; color?: string }[];
  title: string;
  showLabels?: boolean;
}

export interface AIResponse {
  content: string;
  chartConfigs?: ChartConfig[];
}

/**
 * 도구 호출(Function Call) 실행기
 */
async function runTool(name: string, args: any) {
  console.log(`[AI Tool Call] ${name}`, args);
  switch (name) {
    case "get_finance_monthly_summary":
      return await getMonthlySummary({ months: args.months || 6 });
    case "get_finance_statistics":
      return await getStatistics({ startDate: args.startDate, endDate: args.endDate });
    case "get_card_usage_by_approval_date": {
      // 승인일자 기준 직접 집계 로직
      const txs = await queryCardTransactions({
        startDate: args.startDate,
        endDate: args.endDate,
        limit: 1000 
      });
      
      const totalAmount = txs.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
      const categorySummary: Record<string, number> = {};
      txs.forEach((tx: any) => {
        const cat = tx.category || '기타';
        categorySummary[cat] = (categorySummary[cat] || 0) + (tx.amount || 0);
      });

      return {
        totalAmount,
        transactionCount: txs.length,
        period: `${args.startDate} ~ ${args.endDate}`,
        categorySummary,
        basis: "승인일자(approvalDate)"
      };
    }
    case "execute_analytical_sql":
      return await executeSQL(args.sql);
    case "query_workspace_table":
      return await queryTable('report_row', { 
        filters: { reportId: args.tableId },
        limit: args.limit || 100,
        offset: args.offset || 0
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
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
  const systemPrompt = `
    당신은 데이터 분석 전문가 및 시각화 전문가입니다. 사용자가 선택한 테이블의 정보를 분석하여 최적의 차트 시각화를 추천하거나 사용자의 질문에 답하세요.
    
    [당신의 권한]
    당신은 실시간으로 데이터를 조회하고 집계할 수 있는 '도구(Tools)'를 가지고 있습니다. 
    1. 사용자가 "지난달과 이번달 비교"와 같이 전체 데이터 집계가 필요한 요청을 하면 관련 도구를 호출하십시오.
    2. 특히 "정확한 금액" 또는 "승인일 기준" 요청이 있으면 반드시 'get_card_usage_by_approval_date' 도구를 사용하여 데이터를 직접 집계하십시오.
    
    [분석 대상 테이블 정보]
    ${JSON.stringify(contexts, null, 2)}
    
    [응답 규칙]
    1. 답변 내용은 한국어로 친절하게 작성하세요.
    2. 당신이 이전에 생성한 차트나 분석 내용을 기억하고, 사용자가 "그 차트에 ~를 추가해줘"라고 하면 이전 대화 맥락을 바탕으로 수정된 JSON을 제공하세요.
    3. 만약 사용자의 메시지가 "[대상 차트: '차트제목'] {요청내용}" 형식이면, 당신이 이전에 생성한 차트 중 해당 제목을 가진 차트를 찾아 그 설정을 수정하는 것에 집중하세요. 다른 차트들은 그대로 두거나 필요한 경우에만 업데이트하세요.
    4. 이제 차트 막대나 선 위에 금액(값)을 상시 표시할 수 있습니다. 사용자가 수치를 직접 보고 싶어 한다면 chartConfigs에서 "showLabels": true를 설정하십시오. (기본적으로 true를 권장합니다)
    5. 시각화 추천이 포함된 경우, 반드시 응답 텍스트 끝에 JSON 형식을 포함하세요.
    
    응답 JSON 형식:
    {
      "content": "분석 결과 및 설명",
      "chartConfigs": [
        {
          "type": "bar | line | area | pie",
          "data": [{"label": "값1", "value": 100}, ...],
          "xAxis": "축으로 사용할 키",
          "series": [{"key": "값의 키", "name": "표시될 이름", "color": "#hex"}],
          "title": "차트 제목",
          "showLabels": true
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
      const result = await runTool(call.name, call.args);
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
