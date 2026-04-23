'use server';

import { revalidatePath } from 'next/cache';
import { 
  queryTable, 
  insertRows, 
  updateRows, 
  deleteRows,
  listTables,
  getTableSchema,
  listBanks,
  listHometaxConnections
} from '@/egdesk-helpers';
import { generateId } from './shared';
import { getSessionAction } from './auth';

/**
 * AI가 워크스페이스 테이블을 스캔하여 발행 가능한 마이크로 앱을 추천합니다.
 */
export async function getProactivePublishingSuggestionsAction() {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  try {
    const { tables } = await listTables();
    const suggestions = [];

    // 0. 리포지토리 테이블 우선 탐색 (가상 테이블)
    const repoTables = tables.filter((t: any) => 
      t.name?.toLowerCase().includes('financehub') || 
      t.displayName?.toLowerCase().includes('financehub')
    );

    for (const repo of repoTables) {
      suggestions.push({
        tableId: repo.name,
        tableName: repo.displayName || repo.name,
        templateId: 'cash-report',
        reason: 'FinanceHub 리포지토리 데이터가 감지되었습니다. 실시간 잔액과 입출금 내역을 기반으로 가장 정확한 자금일보 발행이 가능합니다.',
        priority: 'high',
        mapping: {
          date: 'DATE',
          inflow: 'DEPOSIT',
          outflow: 'WITHDRAWAL',
          description: 'DESCRIPTION',
          bankName: '_BANKNAME',
          accountNumber: 'ACCOUNTNUMBER',
          category: 'ACCOUNTNAME'
        }
      });
    }

    for (const table of tables) {
      const name = table.displayName || table.name;
      // 리포지토리 테이블은 위에서 이미 처리했으므로 중복 방지
      if (repoTables.some(r => r.name === table.name)) continue;
      const knowledgeRes = await queryTable('table_knowledge', { 
        filters: { table_name: table.name } 
      });
      const knowledge = knowledgeRes?.[0];

      if (knowledge) {
        // AI가 이미 분석한 고급 정보를 바탕으로 추천
        if (knowledge.category === 'Financial' || knowledge.category === 'Transactional') {
          // 스키마 정보를 분석하여 최적 매핑 구성
          let mappingConfig = {
            date: 'DATE',
            inflow: 'DEPOSIT',
            outflow: 'WITHDRAWAL',
            description: 'DESCRIPTION',
            bankName: '_BANKNAME',
            accountNumber: 'ACCOUNTNUMBER',
            category: 'ACCOUNTNAME',
            balance: 'BALANCE'
          };

          try {
            const schema = JSON.parse(knowledge.schema_info || '[]');
            const colNames = schema.map((c: any) => c.name);
            
            // 실시간 스키마에 맞춰 매핑 보정
            if (colNames.includes('날짜')) mappingConfig.date = '날짜';
            if (colNames.includes('입금액')) mappingConfig.inflow = '입금액';
            if (colNames.includes('출금액')) mappingConfig.outflow = '출금액';
            if (colNames.includes('적요')) mappingConfig.description = '적요';
            if (colNames.includes('잔액')) mappingConfig.balance = '잔액';
          } catch (e) {}

          suggestions.push({
            tableId: table.name,
            tableName: name,
            templateId: 'cash-report',
            reason: knowledge.insight || knowledge.description,
            mapping: mappingConfig // 지식 기반 자동 매핑 주입
          });
          continue; // 지식 정보가 있으면 휴리스틱 스캔 건너뜀
        }
      }

      // 1. Heuristic Scan (Knowledge가 없는 경우에만 실행)
      // 금융과 무관한 명부성 테이블은 명시적으로 제외
      if (name.includes('명부') || name.includes('담당자') || name.includes('연락처') || name.includes('설정')) {
        continue;
      }

      // Heuristic 1: Table Name
      const isFinancialName = name.includes('은행') || name.includes('계좌') || name.includes('거래') || name.includes('통장') || name.includes('입출금');
      
      // Heuristic 2: Column Names (Schema Scan)
      let hasFinancialColumns = false;
      try {
        const schema = await getTableSchema(table.name);
        const colNames = schema.map((c: any) => c.name || c.displayName);
        hasFinancialColumns = colNames.some((n: string) => 
          n.includes('금액') || n.includes('입금') || n.includes('출금') || n.includes('잔액')
        );
      } catch (e) {
        // Ignore schema fetch errors
      }

      if (isFinancialName || hasFinancialColumns) {
        suggestions.push({
          tableId: table.name,
          tableName: name,
          templateId: 'cash-report',
          reason: `'${name}' 테이블에서 ${isFinancialName ? '이름 기반' : '데이터 구조 기반'} 금융 패턴이 감지되었습니다. 자금일보 앱 발행을 추천합니다.`
        });
      }
    }

    // 2. FinanceHub & Hometax 소스 추가
    try {
      const banks = await listBanks();
      if (banks && banks.length > 0) {
        suggestions.push({
          tableId: 'finance_bank_transactions',
          tableName: '은행 계좌 거래 내역 (FinanceHub)',
          templateId: 'cash-report',
          reason: '연결된 은행 계좌 데이터가 감지되었습니다. 실시간 자금일보 발행이 가능합니다.'
        });
      }

      const hometax = await listHometaxConnections();
      if (hometax && hometax.length > 0) {
        suggestions.push({
          tableId: 'hometax_sales_invoices',
          tableName: '매출세금계산서 (홈택스)',
          templateId: 'cash-report', // 임시로 cash-report 사용, 추후 전용 템플릿 추가 가능
          reason: '홈택스 매출 데이터가 연동되어 있습니다. 매출 분석 리포트 발행을 추천합니다.'
        });
      }
    } catch (e) {
      console.error('Finance/Hometax discovery error:', e);
    }

    return suggestions;
  } catch (error) {
    console.error('Failed to get publishing suggestions:', error);
    return [];
  }
}

/**
 * 새로운 마이크로 앱을 발행합니다.
 */
export async function publishMicroAppAction(data: {
  name: string;
  templateId: string;
  sourceTableId: string;
  mappingConfig: any;
  uiSettings: any;
}) {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  const id = generateId();
  const now = new Date().toISOString();

  const config = {
    id,
    name: data.name,
    templateId: data.templateId,
    sourceTableId: data.sourceTableId,
    mappingConfig: JSON.stringify(data.mappingConfig),
    uiSettings: JSON.stringify(data.uiSettings),
    rbacRoles: JSON.stringify(['CEO', 'ACCOUNTANT']),
    createdBy: user.id,
    createdAt: now,
    updatedAt: now
  };

  await insertRows('micro_app_config', [config]);
  
  revalidatePath('/publishing/new');
  return { success: true };
}

/**
 * AI가 사용자의 대화 맥락을 분석하여 테이블 선택이나 매핑 설정을 조정합니다. (Server Action)
 */
export async function getPublishingAIAdjustmentAction(
  userMessage: string,
  currentTableId: string,
  currentMapping: any
) {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  // 1. 가용한 모든 테이블 정보 수집 (지식 아카이브 활용)
  const knowledge = await queryTable('table_knowledge', { limit: 50 });
  const tableContext = knowledge.map((k: any) => ({
    id: k.table_name,
    name: k.description || k.table_name,
    category: k.category,
    insight: k.insight,
    columns: JSON.parse(k.schema_info || '[]').map((c: any) => c.name || c.displayName)
  }));

  // 만약 아카이브에 없으면 기본 테이블 목록에서 보충
  if (tableContext.length === 0) {
    const { tables } = await listTables();
    for (const t of tables.slice(0, 5)) {
      const schema = await getTableSchema(t.name);
      tableContext.push({
        id: t.name,
        name: t.displayName || t.name,
        columns: schema.map((c: any) => c.name)
      });
    }
  }

  const systemPrompt = `
    당신은 'EasyDesk Publishing'의 데이터 매핑 전문가입니다.
    사용자의 요청에 따라 현재 테이블을 변경하거나, 컬럼 매핑 설정을 조정해야 합니다.

    [현재 상태]
    - 현재 선택된 테이블 ID: ${currentTableId}
    - 현재 컬럼 매핑: ${JSON.stringify(currentMapping)}

    [워크스페이스 내 가용 테이블 목록]
    ${JSON.stringify(tableContext, null, 2)}

    [사용자 요청]
    "${userMessage}"

    [수행 지침]
    1. 사용자가 "다른 테이블로 바꿔줘" 혹은 "은행 거래 내역이 있는 걸로 찾아줘"라고 하면 가용 테이블 목록에서 가장 적합한 테이블 ID를 찾아 'newTableId'에 넣으세요.
    2. 테이블이 변경되면 해당 테이블의 컬럼명들을 보고 새로운 'newMapping'을 생성하세요.
    3. 테이블은 그대로인데 특정 컬럼만 바꾸고 싶어한다면 'newMapping'만 업데이트하세요.
    4. 반드시 아래 JSON 형식으로만 응답하세요.

    [응답 JSON 형식]
    {
      "explanation": "변경 사항에 대한 친절한 설명 (한글)",
      "newTableId": "변경할 테이블 ID (변경 없으면 현재 ID 유지)",
      "newTableName": "변경할 테이블의 표시 이름",
      "newMapping": {
        "date": "날짜 컬럼명",
        "inflow": "입금액 컬럼명",
        "outflow": "출금액 컬럼명",
        "description": "적요/내용 컬럼명",
        "bankName": "은행명 컬럼명 (있을 경우)",
        "accountNumber": "계좌번호 컬럼명 (있을 경우)",
        "category": "카테고리/구분 컬럼명"
      }
    }
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    // 유효성 검사: 선택된 테이블이 가용 테이블 목록에 있는지 확인
    if (parsed.newTableId && parsed.newTableId !== 'undefined') {
      const exists = tables.some((t: any) => t.name === parsed.newTableId);
      if (!exists) parsed.newTableId = currentTableId; // 존재하지 않으면 현재 테이블 유지
    } else {
      parsed.newTableId = currentTableId;
    }

    return parsed;
  } catch (error) {
    console.error("AI Adjustment Error:", error);
    return {
      explanation: "죄송합니다. 설정을 분석하는 중 오류가 발생했습니다.",
      newTableId: currentTableId,
      newMapping: currentMapping
    };
  }
}


/**
 * 마이크로 앱 설정을 가져옵니다.
 */
export async function getMicroAppConfigAction(id: string) {
  const results = await queryTable('micro_app_config', {
    filters: { id }
  });

  if (!results || results.length === 0) return null;

  const config = results[0];
  return {
    ...config,
    mappingConfig: JSON.parse(config.mappingConfig),
    uiSettings: JSON.parse(config.uiSettings),
    rbacRoles: JSON.parse(config.rbacRoles)
  };
}

/**
 * 마이크로 앱 목록을 가져옵니다.
 */
export async function listMicroAppsAction() {
  const user = await getSessionAction();
  if (!user) return [];

  const results = await queryTable('micro_app_config', {
    orderBy: 'createdAt',
    orderDirection: 'DESC'
  });

  return results.map((config: any) => ({
    ...config,
    mappingConfig: JSON.parse(config.mappingConfig),
    uiSettings: JSON.parse(config.uiSettings),
    rbacRoles: JSON.parse(config.rbacRoles)
  }));
}

/**
 * AI를 사용하여 모든 테이블을 분석하고 지식 저장소를 갱신합니다.
 */
export async function profileAllTablesAction() {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  const { listTables, getTableSchema, queryTable, insertRows, queryBankTransactions } = await import('@/egdesk-helpers');
  const { tables } = await listTables();
  
  // 사용자 요청에 따라 가상 테이블(FinanceHub 등)을 우선 순위로 정렬
  const sortedTables = [...tables].sort((a, b) => {
    const aIsVirtual = a.name?.toLowerCase().includes('financehub') || a.displayName?.toLowerCase().includes('financehub');
    const bIsVirtual = b.name?.toLowerCase().includes('financehub') || b.displayName?.toLowerCase().includes('financehub');
    if (aIsVirtual && !bIsVirtual) return -1;
    if (!aIsVirtual && bIsVirtual) return 1;
    return 0;
  });

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  for (const table of sortedTables) {
    try {
      // 1. Sample Data & Schema
      const schema = await getTableSchema(table.name);
      const rows = await queryTable(table.name, { limit: 5 });
      
      // 2. AI Analysis
      const prompt = `
        Analyze the following database table and provide a professional business description.
        Table Name: ${table.displayName || table.name}
        Columns: ${JSON.stringify(schema)}
        Sample Data: ${JSON.stringify(rows)}
        
        Task:
        1. Analyze the primary purpose of this table.
        2. Categorize it: Financial | Transactional | Operational | HR | Sales | Administrative | Contact | Other.
           *Strict Rule*: Only categorize as 'Financial' or 'Transactional' if it contains actual monetary flow or account transactions.
           *Priority*: If the table is marked as a 'REPOSITORY' or has columns like 'BALANCE', 'WITHDRAWAL', 'DEPOSIT', prioritize it as the primary 'Financial' source.
        3. Provide business insights in Korean.
        
        Respond ONLY with a JSON object:
        {
          "description": "한글로 작성된 테이블의 상세 비즈니스 용도",
          "category": "The category from the list above",
          "insight": "이 데이터로 어떤 마이크로 앱을 만들면 좋을지에 대한 제안 (한글)"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const analysis = JSON.parse(text);

      // [추가] 2.5 Deep Inspection (금융 데이터 정합성 체크)
      if (analysis.category === 'Financial' || analysis.category === 'Transactional') {
        try {
          // 요약 잔액이 모두 0인지 확인
          const allZero = rows.every(r => (Number(r.balance || r.BALANCE || 0)) === 0);
          if (allZero && rows.length > 0) {
            // 상세 거래 내역 조회 시도 (계좌 ID가 있을 경우)
            const accountId = rows[0].id || rows[0].ID;
            if (accountId) {
              const txs = await queryBankTransactions({ accountId, limit: 1 });
              if (txs && txs.length > 0 && (Number(txs[0].balance || txs[0].BALANCE || 0)) > 0) {
                analysis.insight += " (데이터 경고: 계좌 요약 잔액이 0이나 상세 내역에 실잔액이 존재합니다. 거래 내역 기반의 역산 매핑이 권장됩니다.)";
              }
            }
          }
        } catch (e) {
          console.warn(`Deep inspection failed for ${table.name}:`, e);
        }
      }

      // 3. Store Knowledge
      await insertRows('table_knowledge', [{
        table_name: table.name,
        description: analysis.description,
        category: analysis.category,
        insight: analysis.insight,
        schema_info: JSON.stringify(schema), // Schema Registry 주입
        sample_rows: JSON.stringify(rows),   // Sample Data Injection
        sample_analysis: text,
        updated_at: new Date().toISOString()
      }]);

      console.log(`[AI Profiling] Knowledge stored for ${table.name}`);
    } catch (error) {
      console.error(`Failed to profile table ${table.name}:`, error);
    }
  }

  return { success: true };
}

/**
 * 퍼블리싱용 데이터를 서버 사이드에서 안전하게 가져옵니다.
 */
export async function fetchPublishingDataAction(
  sourceTableId: string,
  options: any = { limit: 100 }
) {
  // 세션 체크를 로그로 남기고 통과시킵니다 (디버깅용)
  const user = await getSessionAction();
  if (!user) {
    console.warn('[fetchPublishingDataAction] No session found, proceeding with API key.');
  }

  const { 
    queryBankTransactions, 
    queryTable,
    listAccounts,
    listTables
  } = await import('@/egdesk-helpers');

  // 1. Check if sourceTableId is a real table first (to prioritize repository tables)
  const { tables } = await listTables();
  const targetTable = tables.find((t: any) => t.name === sourceTableId);

  if (targetTable) {
    const rows = await queryTable(sourceTableId, options);
    // Add metadata for transparency
    if (Array.isArray(rows)) {
      (rows as any)._sourceName = targetTable.displayName || targetTable.name;
    }
    return rows;
  }

  // 2. Virtual API Sources
  if (sourceTableId === 'finance_bank_transactions') {
    const [accounts, transactions] = await Promise.all([
      listAccounts(),
      queryBankTransactions(options)
    ]);
    const result = { accounts, transactions };
    (result as any)._sourceName = 'FinanceHub 실시간 API';
    return result;
  } else if (sourceTableId === 'hometax_sales_invoices') {
    const rows = await queryTaxInvoices({ ...options, invoiceType: 'sales' });
    if (Array.isArray(rows)) {
      (rows as any)._sourceName = '홈택스 매출 리포트';
    }
    return rows;
  } else {
    return await queryTable(sourceTableId, options);
  }
}

