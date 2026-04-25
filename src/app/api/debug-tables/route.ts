
import { NextResponse } from 'next/server';
import { executeSQL, listTables } from '@/egdesk-helpers';
import fs from 'fs';

export async function GET() {
  try {
    const tables = await listTables();
    const sqlTables = await executeSQL("SELECT name FROM sqlite_master WHERE type='table'");
    
    let debugInfo = "--- LIST TABLES ---\n" + JSON.stringify(tables, null, 2) + "\n\n";
    debugInfo += "--- SQL MASTER TABLES ---\n" + JSON.stringify(sqlTables, null, 2) + "\n\n";
    
    // 금융 요약 데이터 및 원본 샘플 확인
    try {
      const { runAITool } = require('@/lib/ai-tools');
      const { queryBankTransactions } = require('@/egdesk-helpers');
      
      const rawRes = await queryBankTransactions({ limit: 1 });
      const rawRow = Array.isArray(rawRes) ? rawRes[0] : (rawRes?.transactions?.[0] || rawRes?.rows?.[0]);
      
      debugInfo += "--- RAW TRANSACTION SAMPLE ---\n" + JSON.stringify(rawRow, null, 2) + "\n\n";
      
      const { queryTable } = require('@/egdesk-helpers');
      
      // 새로 찾아낸 진짜 테이블 ID로 쿼리 시도
      try {
        const virtualData = await queryTable('finance-hub-bank-table', { limit: 5 });
        debugInfo += "--- VIRTUAL TABLE QUERY (SUCCESS) ---\n" + JSON.stringify(virtualData, null, 2) + "\n\n";
      } catch (e: any) {
        debugInfo += "--- VIRTUAL TABLE QUERY (FAILED) ---\n" + e.message + "\n\n";
      }
      
      const financeSummary = await runAITool('get_finance_dashboard_summary', {});
      debugInfo += "--- FINANCE SUMMARY (BANK BREAKDOWN) ---\n" + JSON.stringify(financeSummary.bankBreakdown, null, 2) + "\n";
    } catch (e: any) {
      debugInfo += "--- FINANCE ERROR ---\n" + e.message + "\n";
    }

    fs.writeFileSync('c:\\dev\\egdesk_won3\\ExcelToDB\\db_debug_result.txt', debugInfo);
    
    return NextResponse.json({ success: true, message: "Debug info saved to db_debug_result.txt" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
