/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-14T00:27:44.752Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '4db4a318-193f-46c0-a4d4-c448aea4544b',
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
    name: 'report_row',
    displayName: 'Virtual Report Rows',
    rowCount: 94,
    columnCount: 10,
    columns: ['id', 'reportId', 'data', 'contentHash', 'isDeleted', 'deletedAt', 'creatorId', 'updaterId', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table2: {
    name: 'tb_2_gzq52',
    displayName: '발주입고내역 (Sync)',
    rowCount: 92,
    columnCount: 10,
    columns: ['id', '데이터ID', '규 격', '단 가', '주문 수량', '금 액', '발 주 일', '입고요청일', '입고일자', '비 고']
  } as TableDefinition,
  table3: {
    name: 'department',
    displayName: 'Organization Departments',
    rowCount: 3,
    columnCount: 5,
    columns: ['id', 'name', 'description', 'icon', 'createdAt']
  } as TableDefinition,
  table4: {
    name: 'action_task',
    displayName: 'Action Tasks',
    rowCount: 4,
    columnCount: 12,
    columns: ['id', 'instanceId', 'reportId', 'title', 'description', 'type', 'status', 'assigneeId', 'assigneeRole', 'dueAt', 'completedAt', 'createdAt']
  } as TableDefinition,
  table5: {
    name: 'workflow_instance',
    displayName: 'Workflow Instances',
    columnCount: 6,
    columns: ['id', 'templateId', 'triggerRowId', 'status', 'startedAt', 'completedAt']
  } as TableDefinition,
  table6: {
    name: 'workflow_template',
    displayName: 'Workflow Templates',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'name', 'triggerReportId', 'triggerCondition', 'tasks', 'createdAt']
  } as TableDefinition,
  table7: {
    name: 'notification',
    displayName: 'User Notifications',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'userId', 'title', 'message', 'link', 'type', 'isRead', 'createdAt']
  } as TableDefinition,
  table8: {
    name: 'workspace_item',
    displayName: 'Workspace Image Items',
    rowCount: 9,
    columnCount: 12,
    columns: ['id', 'creatorId', 'imageUrl', 'originalText', 'suggestedTitle', 'suggestedSummary', 'aiData', 'status', 'reportId', 'rowId', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table9: {
    name: 'report_row_history',
    displayName: 'Report Row History',
    rowCount: 15,
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table10: {
    name: 'report_access',
    displayName: 'Report Access Controls',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'reportId', 'userId', 'role', 'grantedAt', 'grantedBy']
  } as TableDefinition,
  table11: {
    name: 'report',
    displayName: 'System Reports',
    rowCount: 2,
    columnCount: 18,
    columns: ['id', 'name', 'sheetName', 'description', 'tableName', 'columns', 'uiConfig', 'aiConfig', 'slackWebhookUrl', 'assigneeId', 'autoTodo', 'dueDays', 'isDeleted', 'deletedAt', 'ownerId', 'lastSerial', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table12: {
    name: 'user',
    displayName: 'System Users',
    rowCount: 5,
    columnCount: 9,
    columns: ['id', 'username', 'email', 'password', 'role', 'fullName', 'employeeId', 'isActive', 'createdAt']
  } as TableDefinition,
  table13: {
    name: 'sync_activity_log',
    displayName: 'sync_activity_log',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 12,
    columns: ['id', 'config_id', 'file_name', 'file_path', 'status', 'rows_imported', 'rows_skipped', 'duplicates_skipped', 'error_message', 'started_at', 'completed_at', 'duration_ms']
  } as TableDefinition,
  table14: {
    name: 'sync_configurations',
    displayName: 'sync_configurations',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 24,
    columns: ['id', 'script_folder_path', 'script_name', 'folder_name', 'target_table_id', 'header_row', 'skip_bottom_rows', 'sheet_index', 'column_mappings', 'applied_splits', 'file_action', 'enabled', 'auto_sync_enabled', 'unique_key_columns', 'duplicate_action', 'last_sync_at', 'last_sync_status', 'last_sync_rows_imported', 'last_sync_rows_skipped', 'last_sync_duplicates', 'last_sync_error', 'created_at', 'updated_at', 'source']
  } as TableDefinition,
  table15: {
    name: 'ai_studio_session_persistence',
    displayName: 'AI Studio Session',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table16: {
    name: 'ai_persistence_test',
    displayName: 'AI Persistence Test',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table17: {
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table18: {
    name: 'tb_944447372_1h23k',
    displayName: '신용카드영수증 (Sync)',
    rowCount: 2,
    columnCount: 10,
    columns: ['id', '데이터ID', '승인일시', '가맹점명', '사용금액', '지출목적', '승인번호', '카드종류', '카드번호', '영수증사진']
  } as TableDefinition,
  table19: {
    name: 'user_data_files',
    displayName: 'user_data_files',
    description: 'Imported from user_database_export_2026-04-06.sql',
    columnCount: 15,
    columns: ['id', 'table_id', 'row_id', 'column_name', 'filename', 'mime_type', 'size_bytes', 'storage_type', 'file_data', 'file_path', 'is_compressed', 'compression_type', 'original_size', 'created_at', 'updated_at']
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
  table1: 'report_row',
  table2: 'tb_2_gzq52',
  table3: 'department',
  table4: 'action_task',
  table5: 'workflow_instance',
  table6: 'workflow_template',
  table7: 'notification',
  table8: 'workspace_item',
  table9: 'report_row_history',
  table10: 'report_access',
  table11: 'report',
  table12: 'user',
  table13: 'sync_activity_log',
  table14: 'sync_configurations',
  table15: 'ai_studio_session_persistence',
  table16: 'ai_persistence_test',
  table17: 'ai_studio_session',
  table18: 'tb_944447372_1h23k',
  table19: 'user_data_files'
} as const;
