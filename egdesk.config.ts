/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-06T01:55:38.278Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: 'a87d1623-34c1-43fe-87c8-9fa8263d71a4',
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
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    description: undefined,
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table2: {
    name: 'report_access',
    displayName: 'ReportAccess',
    description: undefined,
    rowCount: undefined,
    columnCount: 3,
    columns: ['id', 'reportId', 'userId']
  } as TableDefinition,
  table3: {
    name: 'report_row_history',
    displayName: 'ReportRowHistory',
    description: undefined,
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table4: {
    name: 'report_row',
    displayName: 'ReportRow',
    description: undefined,
    rowCount: 122,
    columnCount: 10,
    columns: ['id', 'data', 'contentHash', 'reportId', 'creatorId', 'createdAt', 'updaterId', 'updatedAt', 'isDeleted', 'deletedAt']
  } as TableDefinition,
  table5: {
    name: 'report',
    displayName: 'Report',
    description: undefined,
    rowCount: 1,
    columnCount: 9,
    columns: ['id', 'name', 'sheetName', 'columns', 'ownerId', 'createdAt', 'isDeleted', 'deletedAt', 'slackWebhookUrl']
  } as TableDefinition,
  table6: {
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
  table1: 'ai_studio_session',
  table2: 'report_access',
  table3: 'report_row_history',
  table4: 'report_row',
  table5: 'report',
  table6: 'user'
} as const;
