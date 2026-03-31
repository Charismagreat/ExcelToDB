/**
 * EGDesk User Data Configuration
 * Generated at: 2026-03-31T01:53:56.666Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '7a1e4b57-313f-4597-9866-1bb95f623d97',
} as const;

export interface TableDefinition {
  name: string;
  displayName: string;
  description?: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
}

export const TABLES = {
  table1: {
    name: 'test',
    displayName: 'test',
    description: undefined,
    rowCount: 133,
    columnCount: 16,
    columns: ['id', '거래일자', '거래시간', '은행', '계좌번호', '계좌별칭', '적요1', '입금', '출금', '잔액', '비고', '수기', '취급지점', '상대계좌', '상대계좌예금주명', '적요2']
  } as TableDefinition
} as const;


// Main table (first table by default)
export const MAIN_TABLE = TABLES.table1;


// Helper to get table by name
export function getTableByName(tableName: string): TableDefinition | undefined {
  return Object.values(TABLES).find(t => t.name === tableName);
}

// Export table names for easy access
export const TABLE_NAMES = {
  table1: 'test'
} as const;
