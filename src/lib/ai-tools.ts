import { queryTable, executeSQL, listAccounts, queryBankTransactions, getOverallStats } from "@/egdesk-helpers";
import { queryCardTransactions, getMonthlySummary, getTransactionStats as getStatistics } from "@/egdesk-helpers";

/**
 * 도구 호출(Function Call) 실행기 - 공유 유틸리티
 */
export async function runAITool(name: string, args: any) {
  console.log(`[AI Tool Execution] ${name}`, args);
  switch (name) {
    case "get_finance_dashboard_summary": {
      // 1. 통일된 가상 ID를 사용하여 통합 데이터 쿼리 (The Smart Way Phase 2)
      // 이제 queryTable이 내부적으로 조인 로직을 처리하므로 로직이 매우 단순해집니다.
      const { queryTable } = require('@/egdesk-helpers');
      const integratedRows = await queryTable('finance-hub-bank-table', { limit: 100 });

      // 2. 리턴 데이터 구성 (AI 전달용)
      const stats = {
        bankBreakdown: integratedRows,
        _totalCount: integratedRows.length,
        _isFullList: true,
        _source: "Unified Virtual Table (finance-hub-bank-table)",
        fullTableMarkdown: ""
      };

      // 3. AI 출력용 마스크다운 표 생성
      let tableMarkdown = "### 🏦 은행 및 계좌별 잔액 현황 (전체 71건)\n\n";
      tableMarkdown += "| 은행명 | 계좌번호 | 현재잔액 | 최종거래일 |\n| :--- | :--- | :---: | :---: |\n";
      
      integratedRows.forEach((row: any) => {
        tableMarkdown += `| ${row._bankName} | ${row.accountNumber} | **${row.balance.toLocaleString()}** | ${row.date} |\n`;
      });
      
      stats.fullTableMarkdown = tableMarkdown;

      return stats;
    }
    case "get_finance_monthly_summary":
      return await getMonthlySummary({ months: args.months || 6 });
    case "get_finance_statistics":
      return await getStatistics({ startDate: args.startDate, endDate: args.endDate });
    case "list_bank_accounts": {
      // [방안 A] 정식 금융 API 전수 조사 (최신순 정렬)
      const res = await queryBankTransactions({ limit: 5000, orderBy: 'date', orderDir: 'desc' }).catch(() => ({ transactions: [] }));
      const rawData = Array.isArray(res) ? res : (res?.transactions || res?.rows || []);
      
      const latestMap = new Map();
      rawData.forEach((row: any) => {
        const key = `${row.bankId}-${row.accountNumber}`;
        if (!latestMap.has(key)) {
          latestMap.set(key, {
            ...row,
            balance: Number(row.balance || 0),
            bankName: row.bankId
          });
        }
      });

      const items = Array.from(latestMap.values());
      return items.filter((acc: any) => {
        const bId = String(acc.bankId || '').toLowerCase();
        const aName = String(acc.accountName || '').toLowerCase();
        return !bId.includes('card') && !aName.includes('카드');
      });
    }
    case "query_bank_transactions": {
      const res = await queryBankTransactions({
        startDate: args.startDate,
        endDate: args.endDate,
        limit: args.limit || 100,
        orderBy: 'date',
        orderDir: 'desc'
      });
      const txs = Array.isArray(res) ? res : (res?.transactions || []);
      
      // [강제 필터링] 대시보드와 동일하게 은행 계좌의 내역만 반환 (카드 제외)
      return txs.filter((tx: any) => {
        const bId = String(tx.bankId || '').toLowerCase();
        const aName = String(tx.accountName || '').toLowerCase();
        return !bId.includes('card') && !aName.includes('카드');
      });
    }
    case "query_card_transactions": {
      const res = await queryCardTransactions({
        startDate: args.startDate,
        endDate: args.endDate,
        limit: args.limit || 100,
        orderBy: 'date',
        orderDir: 'desc'
      });
      const txs = Array.isArray(res) ? res : (res?.transactions || []);
      
      // [강제 필터링] 카드 거래만 반환
      return txs.filter((tx: any) => {
        const bId = String(tx.bankId || tx.cardCompanyId || '').toLowerCase();
        const aName = String(tx.accountName || tx.cardName || '').toLowerCase();
        return bId.includes('card') || aName.includes('카드');
      });
    }
    case "get_card_usage_by_approval_date": {
      const result = await queryCardTransactions({
        startDate: args.startDate,
        endDate: args.endDate,
        limit: 1000,
        orderBy: 'date',
        orderDir: 'desc'
      });
      
      const txs = Array.isArray(result) ? result : (result?.transactions || []);
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
        transactions: txs.slice(0, 100).map((t: any) => ({
          approvalDate: t.approvalDate || t.date,
          cardNumber: t.cardNumber || t.cardNo,
          description: t.description || t.merchantName,
          category: t.category,
          amount: t.amount
        })),
        basis: "승인일자(approvalDate)"
      };
    }
    case "execute_analytical_sql": {
      // 삭제된 데이터 자동 필터링: SQL에 isDeleted 조건 주입
      let sql = args.sql as string;
      // WHERE 절이 이미 있으면 AND 추가, 없으면 WHERE 추가
      // report_row 테이블을 대상으로 하는 쿼리에만 적용
      if (/report_row/i.test(sql) && !/isDeleted/i.test(sql)) {
        if (/WHERE/i.test(sql)) {
          sql = sql.replace(/WHERE/i, 'WHERE isDeleted = 0 AND');
        } else {
          // FROM report_row 뒤에 WHERE 절 삽입
          sql = sql.replace(/(FROM\s+report_row\b)/i, '$1 WHERE isDeleted = 0');
        }
      }
      return await executeSQL(sql);
    }
    case "get_aggregated_report_data": {
      // 업종별 템플릿은 별도의 물리 테이블로 생성되므로, report_row가 아닌 경우 해당 테이블을 직접 쿼리
      const targetTable = (args.tableId && args.tableId !== 'report_row' && !args.tableId.includes('-')) ? args.tableId : 'report_row';
      const filters: any = { isDeleted: '0' };
      if (targetTable === 'report_row') filters.reportId = args.tableId;
      
      const rows = await queryTable(targetTable, { 
        filters,
        limit: 5000
      });
      const allRows = Array.isArray(rows) ? rows : (rows?.rows || []);
      // 이중 안전장치: 코드에서도 isDeleted가 정확히 0인 행만 허용
      const validRows = allRows.filter((row: any) => 
        row.isDeleted === 0 || row.isDeleted === '0'
      );
      
      // 집계 모드 (sum 또는 count, 기본값은 sum)
      const mode = args.mode || 'sum';
      // sumKey를 배열로 처리 가능하도록 정규화 (단일 문자열인 경우도 배열로 변환)
      const sumKeys = Array.isArray(args.sumKey) ? args.sumKey : [args.sumKey || 'value'];
      
      const summary: Record<string, Record<string, number>> = {};
      validRows.forEach((row: any) => {
        const rowData = targetTable === 'report_row' 
          ? (typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}))
          : row;

        const groupValue = rowData[args.groupByKey];
        if (groupValue === undefined || groupValue === null || groupValue === '') return;
        
        const gKey = String(groupValue);
        if (!summary[gKey]) {
          summary[gKey] = {};
          sumKeys.forEach(sk => summary[gKey][sk] = 0);
        }
        
        sumKeys.forEach(sk => {
          if (mode === 'count') {
            summary[gKey][sk] += 1;
          } else {
            let amountRaw = rowData[sk];
            let amount = 0;
            if (typeof amountRaw === 'number') {
              amount = amountRaw;
            } else if (typeof amountRaw === 'string') {
              amount = parseFloat(amountRaw.replace(/,/g, ''));
            }
            if (!isNaN(amount)) summary[gKey][sk] += amount;
          }
        });
      });

      // 결과 반환: 각 그룹키별로 모든 sumKeys의 합계를 포함한 객체 배열 생성
      return Object.keys(summary).map(key => {
        const item: any = { label: key };
        // 기존 호환성을 위해 첫 번째 sumKey 결과는 'value' 키로도 제공
        if (sumKeys.length === 1) {
          item.value = summary[key][sumKeys[0]];
        }
        // 모든 집계 필드 추가
        Object.assign(item, summary[key]);
        return item;
      }).sort((a, b) => (b.value !== undefined ? b.value - (a.value || 0) : 0));
    }
    case "query_workspace_table": {
      let targetTable = args.tableId;
      const filters: any = { isDeleted: '0' };
      
      // 금융 가상 ID를 실제 물리 테이블명으로 매핑 (MY DB와 동일하게)
      if (targetTable.includes('bank_transactions') || targetTable.includes('bank-table')) {
        targetTable = 'finance_bank_transactions';
        delete filters.isDeleted; // 금융 테이블은 isDeleted 컬럼이 없으므로 제거
      } else if (targetTable.includes('card_transactions') || targetTable.includes('card-table')) {
        targetTable = 'finance_card_transactions';
        delete filters.isDeleted; // 금융 테이블은 isDeleted 컬럼이 없으므로 제거
      } else if (targetTable.includes('hometax_sales')) {
        targetTable = 'hometax_sales_invoices';
        // 홈택스 테이블은 상황에 따라 확인 필요하나 안전을 위해 유지 또는 제거 결정 가능
      } else if (targetTable.includes('hometax_purchase')) {
        targetTable = 'hometax_purchase_invoices';
      } else if (targetTable.includes('hometax_cash')) {
        targetTable = 'hometax_cash_receipts';
      } else if (targetTable !== 'report_row' && !targetTable.includes('-')) {
        // 이미 물리 테이블명인 경우 그대로 사용
      } else {
        targetTable = 'report_row';
        filters.reportId = args.tableId;
      }

      const wsRows = await queryTable(targetTable, { 
        filters,
        limit: args.limit || 100,
        offset: args.offset || 0
      });
      return Array.isArray(wsRows) ? wsRows : (wsRows?.rows || []);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
