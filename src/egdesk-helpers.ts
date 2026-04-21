/**
 * EGDesk Helper Wrapper for Next.js
 * 
 * 루트 디렉토리의 egdesk-helpers.ts(원본)를 참조하여 
 * 기존 프로젝트 코드와의 하위 호환성(배열 반환 등)을 유지하기 위한 래퍼입니다.
 * 이지데스크 서버가 루트 파일을 갱신하더라도 이 래퍼를 통해 안전하게 운용됩니다.
 */

import * as original from '../egdesk-helpers';

/**
 * 테이블 데이터를 쿼리하고 rows 배열만 반환합니다.
 */
export async function queryTable(...args: any[]) {
  const res = await (original as any).queryTable(...args);
  return res?.rows || [];
}

/**
 * 테이블을 검색하고 rows 배열만 반환합니다.
 */
export async function searchTable(...args: any[]) {
  const res = await (original as any).searchTable(...args);
  return res?.rows || [];
}

/**
 * 테이블 스키마를 가져오고 배열만 반환합니다.
 */
export async function getTableSchema(...args: any[]) {
  const res = await (original as any).getTableSchema(...args);
  return res?.schema || res?.columns || [];
}

/**
 * 계좌 목록을 가져오고 배열만 반환합니다.
 */
export async function listAccounts(...args: any[]) {
  const res = await (original as any).listAccounts(...args);
  return res?.accounts || res?.rows || res || [];
}

// 나머지 모든 함수 및 상수를 원본에서 그대로 내보냅니다.
export const {
  callUserDataTool,
  aggregateTable,
  executeSQL,
  listTables,
  createTable,
  insertRows,
  updateRows,
  deleteRows,
  deleteTable,
  renameTable,
  callFinanceHubTool,
  listBanks,
  queryBankTransactions,
  queryCardTransactions,
  getTransactionStats,
  getMonthlySummary,
  getOverallStats,
  getSyncHistory,
  listHometaxConnections,
  queryTaxInvoices,
  queryTaxExemptInvoices,
  queryCashReceipts,
  getHometaxSyncHistory,
  queryPromissoryNotes,
  callInternalKnowledgeTool,
  listKnowledgeDocuments,
  getKnowledgeDocument,
  searchKnowledgeContent,
  getKnowledgeByCategory,
  listBusinessIdentitySnapshots,
  getBusinessIdentitySnapshot,
  getBusinessIdentityCompanyInfo,
  getBusinessIdentityServicesProducts,
  listCompanyResearch,
  getCompanyResearchById,
  getCompanyResearchByDomain,
  searchCompanyResearch,
  callBrowserRecordingTool,
  listBrowserRecordingTests,
  getBrowserRecordingReplayOptions,
  runBrowserRecording
} = original as any;
