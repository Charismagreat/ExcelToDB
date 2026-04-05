import { queryTable, executeSQL } from "@/egdesk-helpers";
import { queryCardTransactions, getMonthlySummary, getStatistics } from "@/financehub-helpers";

/**
 * 도구 호출(Function Call) 실행기 - 공유 유틸리티
 */
export async function runAITool(name: string, args: any) {
  console.log(`[AI Tool Execution] ${name}`, args);
  switch (name) {
    case "get_finance_monthly_summary":
      return await getMonthlySummary({ months: args.months || 6 });
    case "get_finance_statistics":
      return await getStatistics({ startDate: args.startDate, endDate: args.endDate });
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
      // UI와 동일한 필터: isDeleted='0' (정확히 0인 행만 포함, null인 불완전 행 제외)
      const rows = await queryTable('report_row', { 
        filters: { reportId: args.tableId, isDeleted: '0' },
        limit: 5000
      });
      const allRows = Array.isArray(rows) ? rows : (rows?.rows || []);
      // 이중 안전장치: 코드에서도 isDeleted가 정확히 0인 행만 허용
      const validRows = allRows.filter((row: any) => 
        row.isDeleted === 0 || row.isDeleted === '0'
      );
      
      const summary: Record<string, number> = {};
      validRows.forEach((row: any) => {
        const rawData = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        const groupValue = rawData[args.groupByKey];
        // groupByKey 값이 비어있거나 없는 행은 집계에서 제외
        if (groupValue === undefined || groupValue === null || groupValue === '') return;
        
        let amountStr = rawData[args.sumKey] || '0';
        
        let amount = typeof amountStr === 'number' ? amountStr : parseFloat(String(amountStr).replace(/,/g, ''));
        if (isNaN(amount)) amount = 0;

        summary[String(groupValue)] = (summary[String(groupValue)] || 0) + amount;
      });

      // 항상 고정된 키 'label'과 'value'를 사용하여 반환 (AI가 xAxis='label', series key='value'로 매칭)
      return Object.keys(summary).map(key => ({
        label: key,
        value: summary[key]
      })).sort((a, b) => b.value - a.value);
    }
    case "query_workspace_table": {
      // UI와 동일한 필터: isDeleted='0'
      const wsRows = await queryTable('report_row', { 
        filters: { reportId: args.tableId, isDeleted: '0' },
        limit: args.limit || 100,
        offset: args.offset || 0
      });
      return Array.isArray(wsRows) ? wsRows : (wsRows?.rows || []);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
