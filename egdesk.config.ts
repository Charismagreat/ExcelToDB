/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-12T15:07:33.499Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '124ce9b2-4a2b-41c7-97dd-6093278d7639',
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
    name: 'notification',
    displayName: 'User Notifications',
    columnCount: 8,
    columns: ['id', 'userId', 'title', 'message', 'link', 'type', 'isRead', 'createdAt']
  } as TableDefinition,
  table2: {
    name: 'user',
    displayName: 'User',
    rowCount: 2,
    columnCount: 8,
    columns: ['id', 'username', 'password', 'fullName', 'employeeId', 'role', 'isActive', 'lastLoginAt']
  } as TableDefinition,
  table3: {
    name: 'report_row',
    displayName: 'ReportRow',
    columnCount: 10,
    columns: ['id', 'data', 'contentHash', 'reportId', 'creatorId', 'createdAt', 'updaterId', 'updatedAt', 'isDeleted', 'deletedAt']
  } as TableDefinition,
  table4: {
    name: 'report_row_history',
    displayName: 'ReportRowHistory',
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table5: {
    name: 'report_access',
    displayName: 'ReportAccess',
    columnCount: 3,
    columns: ['id', 'reportId', 'userId']
  } as TableDefinition,
  table6: {
    name: 'user_data_files',
    displayName: 'user_data_files',
    columnCount: 15,
    columns: ['id', 'table_id', 'row_id', 'column_name', 'filename', 'mime_type', 'size_bytes', 'storage_type', 'file_data', 'file_path', 'is_compressed', 'compression_type', 'original_size', 'created_at', 'updated_at']
  } as TableDefinition,
  table7: {
    name: 'report',
    displayName: 'System Reports',
    columnCount: 14,
    columns: ['id', 'name', 'sheetName', 'description', 'tableName', 'columns', 'uiConfig', 'aiConfig', 'isDeleted', 'deletedAt', 'ownerId', 'lastSerial', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table8: {
    name: 'tb_944447372_1h23k',
    displayName: '신용카드영수증 (Sync)',
    rowCount: 3,
    columnCount: 10,
    columns: ['id', '데이터ID', '승인일시', '가맹점명', '사용금액', '지출목적', '승인번호', '카드종류', '카드번호', '영수증사진']
  } as TableDefinition,
  table9: {
    name: 'workspace_item',
    displayName: 'Workspace Image Items',
    columnCount: 12,
    columns: ['id', 'creatorId', 'imageUrl', 'originalText', 'suggestedTitle', 'suggestedSummary', 'status', 'reportId', 'rowId', 'aiData', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table10: {
    name: 'tb_sheet1_69d5af80_e94',
    displayName: 'Sheet1',
    rowCount: 92,
    columnCount: 11,
    columns: ['id', '데이터ID', '구 분', '규 격', '단 가', '주문 수량', '금 액', '발 주 일', '입고요청일', '입고일자', '비 고']
  } as TableDefinition,
  table11: {
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table12: {
    name: 'ai_persistence_test',
    displayName: 'AI Persistence Test',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table13: {
    name: 'ai_studio_session_persistence',
    displayName: 'AI Studio Session',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table14: {
    name: 'department',
    displayName: 'Organization Departments',
    columnCount: 5,
    columns: ['id', 'name', 'description', 'managerId', 'createdAt']
  } as TableDefinition,
  table15: {
    name: 'workflow_template',
    displayName: 'Workflow Templates',
    columnCount: 6,
    columns: ['id', 'name', 'triggerReportId', 'triggerCondition', 'tasks', 'createdAt']
  } as TableDefinition,
  table16: {
    name: 'workflow_instance',
    displayName: 'Workflow Instances',
    columnCount: 6,
    columns: ['id', 'templateId', 'triggerRowId', 'status', 'startedAt', 'completedAt']
  } as TableDefinition,
  table17: {
    name: 'action_task',
    displayName: 'Action Tasks',
    columnCount: 11,
    columns: ['id', 'instanceId', 'title', 'description', 'type', 'status', 'result', 'assigneeId', 'assigneeRole', 'dueAt', 'completedAt']
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
  table1: 'notification',
  table2: 'user',
  table3: 'report_row',
  table4: 'report_row_history',
  table5: 'report_access',
  table6: 'user_data_files',
  table7: 'report',
  table8: 'tb_944447372_1h23k',
  table9: 'workspace_item',
  table10: 'tb_sheet1_69d5af80_e94',
  table11: 'ai_studio_session',
  table12: 'ai_persistence_test',
  table13: 'ai_studio_session_persistence',
  table14: 'department',
  table15: 'workflow_template',
  table16: 'workflow_instance',
  table17: 'action_task'
} as const;
