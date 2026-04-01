/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-01T10:00:30.164Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '94fc5d29-e67a-48f7-a9a9-c9a06e18c965',
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
    name: 'report_access',
    displayName: 'ReportAccess',
    description: undefined,
    rowCount: undefined,
    columnCount: 3,
    columns: ['id', 'reportId', 'userId']
  } as TableDefinition,
  table2: {
    name: 'report_row_history',
    displayName: 'ReportRowHistory',
    description: undefined,
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table3: {
    name: 'report_row',
    displayName: 'ReportRow',
    description: undefined,
    rowCount: 122,
    columnCount: 10,
    columns: ['id', 'data', 'contentHash', 'reportId', 'creatorId', 'createdAt', 'updaterId', 'updatedAt', 'isDeleted', 'deletedAt']
  } as TableDefinition,
  table4: {
    name: 'report',
    displayName: 'Report',
    description: undefined,
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'name', 'sheetName', 'columns', 'ownerId', 'createdAt', 'isDeleted', 'deletedAt', 'slackWebhookUrl']
  } as TableDefinition,
  table5: {
    name: 'user',
    displayName: 'User',
    description: undefined,
    rowCount: 1,
    columnCount: 8,
    columns: ['id', 'username', 'password', 'fullName', 'employeeId', 'role', 'isActive', 'lastLoginAt']
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
  table1: 'report_access',
  table2: 'report_row_history',
  table3: 'report_row',
  table4: 'report',
  table5: 'user'
} as const;
