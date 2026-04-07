/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-07T08:06:24.392Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '7a406902-a90d-4aef-a983-c64320c77084',
} as const;

export interface TableDefinition {
  name: string;
  displayName: string;
  description?: string;
  /** Omitted or unknown until synced / counted */
  rowCount?: number;
  columnCount: number;
  columns: string[];
}

export const TABLES = {
  table1: {
    name: 'workspace_item',
    displayName: 'Workspace Image Items',
    rowCount: 3,
    columnCount: 12,
    columns: ['id', 'creatorId', 'imageUrl', 'originalText', 'suggestedTitle', 'suggestedSummary', 'status', 'reportId', 'rowId', 'aiData', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table2: {
    name: 'tb_944447372_1h23k',
    displayName: '신용카드영수증 (Sync)',
    rowCount: 3,
    columnCount: 10,
    columns: ['id', '데이터ID', '승인일시', '가맹점명', '사용금액', '지출목적', '승인번호', '카드종류', '카드번호', '영수증사진']
  } as TableDefinition,
  table3: {
    name: 'report',
    displayName: 'System Reports',
    rowCount: 1,
    columnCount: 14,
    columns: ['id', 'name', 'sheetName', 'description', 'tableName', 'columns', 'uiConfig', 'aiConfig', 'isDeleted', 'deletedAt', 'ownerId', 'lastSerial', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table4: {
    name: 'user_data_files',
    displayName: 'user_data_files',
    description: 'Imported from user_database_export_2026-04-06.sql',
    columnCount: 15,
    columns: ['id', 'table_id', 'row_id', 'column_name', 'filename', 'mime_type', 'size_bytes', 'storage_type', 'file_data', 'file_path', 'is_compressed', 'compression_type', 'original_size', 'created_at', 'updated_at']
  } as TableDefinition,
  table5: {
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table6: {
    name: 'report_access',
    displayName: 'ReportAccess',
    columnCount: 3,
    columns: ['id', 'reportId', 'userId']
  } as TableDefinition,
  table7: {
    name: 'report_row_history',
    displayName: 'ReportRowHistory',
    rowCount: 15,
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table8: {
    name: 'report_row',
    displayName: 'ReportRow',
    rowCount: 896,
    columnCount: 10,
    columns: ['id', 'data', 'contentHash', 'reportId', 'creatorId', 'createdAt', 'updaterId', 'updatedAt', 'isDeleted', 'deletedAt']
  } as TableDefinition,
  table9: {
    name: 'user',
    displayName: 'User',
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
  table1: 'workspace_item',
  table2: 'tb_944447372_1h23k',
  table3: 'report',
  table4: 'user_data_files',
  table5: 'ai_studio_session',
  table6: 'report_access',
  table7: 'report_row_history',
  table8: 'report_row',
  table9: 'user'
} as const;
