/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-14T23:43:39.916Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '86d22eca-4bbc-4b47-9e38-d6fb1c0c4c15',
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
    name: 'input_guardrail',
    displayName: 'Input Guardrails',
    description: '관리자가 설정한 데이터 입력 제한 규칙 테이블',
    columnCount: 9,
    columns: ['id', 'reportId', 'columnName', 'ruleType', 'ruleValue', 'severity', 'errorMessage', 'adminAdvice', 'createdAt']
  } as TableDefinition,
  table2: {
    name: 'department',
    displayName: 'Organization Departments',
    rowCount: 3,
    columnCount: 5,
    columns: ['id', 'name', 'description', 'icon', 'createdAt']
  } as TableDefinition,
  table3: {
    name: 'action_task',
    displayName: 'Action Tasks',
    columnCount: 12,
    columns: ['id', 'instanceId', 'reportId', 'title', 'description', 'type', 'status', 'assigneeId', 'assigneeRole', 'dueAt', 'completedAt', 'createdAt']
  } as TableDefinition,
  table4: {
    name: 'workflow_instance',
    displayName: 'Workflow Instances',
    columnCount: 6,
    columns: ['id', 'templateId', 'triggerRowId', 'status', 'startedAt', 'completedAt']
  } as TableDefinition,
  table5: {
    name: 'workflow_template',
    displayName: 'Workflow Templates',
    columnCount: 6,
    columns: ['id', 'name', 'triggerReportId', 'triggerCondition', 'tasks', 'createdAt']
  } as TableDefinition,
  table6: {
    name: 'notification',
    displayName: 'User Notifications',
    columnCount: 8,
    columns: ['id', 'userId', 'title', 'message', 'link', 'type', 'isRead', 'createdAt']
  } as TableDefinition,
  table7: {
    name: 'workspace_item',
    displayName: 'Workspace Image Items',
    columnCount: 12,
    columns: ['id', 'creatorId', 'imageUrl', 'originalText', 'suggestedTitle', 'suggestedSummary', 'aiData', 'status', 'reportId', 'rowId', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table8: {
    name: 'report_row_history',
    displayName: 'Report Row History',
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table9: {
    name: 'report_access',
    displayName: 'Report Access Controls',
    columnCount: 6,
    columns: ['id', 'reportId', 'userId', 'role', 'grantedAt', 'grantedBy']
  } as TableDefinition,
  table10: {
    name: 'report_row',
    displayName: 'Virtual Report Rows',
    columnCount: 9,
    columns: ['id', 'reportId', 'data', 'isDeleted', 'deletedAt', 'creatorId', 'updaterId', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table11: {
    name: 'workflow_steering',
    displayName: 'AI Workflow Steering',
    columnCount: 10,
    columns: ['id', 'reportId', 'rowId', 'eventType', 'recommendation', 'reasoning', 'status', 'decidedById', 'decidedAt', 'createdAt']
  } as TableDefinition,
  table12: {
    name: 'report',
    displayName: 'System Reports',
    columnCount: 14,
    columns: ['id', 'name', 'sheetName', 'description', 'tableName', 'columns', 'uiConfig', 'aiConfig', 'isDeleted', 'deletedAt', 'ownerId', 'lastSerial', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table13: {
    name: 'user',
    displayName: 'System Users',
    rowCount: 5,
    columnCount: 11,
    columns: ['id', 'username', 'email', 'password', 'role', 'fullName', 'employeeId', 'departmentId', 'position', 'isActive', 'createdAt']
  } as TableDefinition,
  table14: {
    name: 'sync_activity_log',
    displayName: 'sync_activity_log',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 12,
    columns: ['id', 'config_id', 'file_name', 'file_path', 'status', 'rows_imported', 'rows_skipped', 'duplicates_skipped', 'error_message', 'started_at', 'completed_at', 'duration_ms']
  } as TableDefinition,
  table15: {
    name: 'sync_configurations',
    displayName: 'sync_configurations',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 24,
    columns: ['id', 'script_folder_path', 'script_name', 'folder_name', 'target_table_id', 'header_row', 'skip_bottom_rows', 'sheet_index', 'column_mappings', 'applied_splits', 'file_action', 'enabled', 'auto_sync_enabled', 'unique_key_columns', 'duplicate_action', 'last_sync_at', 'last_sync_status', 'last_sync_rows_imported', 'last_sync_rows_skipped', 'last_sync_duplicates', 'last_sync_error', 'created_at', 'updated_at', 'source']
  } as TableDefinition,
  table16: {
    name: 'ai_studio_session_persistence',
    displayName: 'AI Studio Session',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table17: {
    name: 'ai_persistence_test',
    displayName: 'AI Persistence Test',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table18: {
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table19: {
    name: 'user_data_files',
    displayName: 'user_data_files',
    description: 'Imported from user_database_export_2026-04-06.sql',
    columnCount: 15,
    columns: ['id', 'table_id', 'row_id', 'column_name', 'filename', 'mime_type', 'size_bytes', 'storage_type', 'file_data', 'file_path', 'is_compressed', 'compression_type', 'original_size', 'created_at', 'updated_at']
  } as TableDefinition,
  table20: {
    name: 'promissory_notes',
    displayName: '어음 거래',
    description: 'FinanceHub promissory_notes: 어음(외상매웉채권) 전체 내역 - 를림/수취 포함, metadata 평탄화',
    rowCount: 57,
    columnCount: 37,
    columns: ['id','sourceId','accountId','bankId','bankName','accountNumber','noteNumber','noteType','issuerName','issuerRegistrationNumber','payeeName','amount','currency','issueDate','maturityDate','status','bankBranch','category','isManual','metaSource','metaSerial','metaCancellationRequested','metaCashLike','metaLoanAvailableDate','metaLoanExecuted','metaLoanAmount','metaTaxIssueDate','metaDepositAccountNumber','metaSeizureAmount','metaOriginalNoteAmount','metaSeizureClaimant','metaRawStatus','metaImportSourceFile','metaJson','originalCreatedAt','originalUpdatedAt','importedAt']
  } as TableDefinition,
  table21: {
    name: 'hometax_sales_invoices',
    displayName: '홈택스 매출 세금계산서',
    description: '홈택스 매출 전자세금계산서 목록 (공급자 기준)',
    rowCount: 2,
    columnCount: 40,
    columns: ['id','sourceId','businessNumber','invoiceType','writeDate','approvalNumber','issueDate','sendDate','supplierBizNo','supplierSubBizNo','supplierName','supplierCeoName','supplierAddress','buyerBizNo','buyerSubBizNo','buyerName','buyerCeoName','buyerAddress','totalAmount','supplyAmount','taxAmount','invoiceClass','invoiceKind','issueType','remark','receiptOrClaim','supplierEmail','buyerEmail1','buyerEmail2','itemDate','itemName','itemSpec','itemQty','itemUnitPrice','itemSupplyAmount','itemTaxAmount','itemRemark','excelFilePath','originalCreatedAt','importedAt']
  } as TableDefinition,
  table22: {
    name: 'hometax_purchase_invoices',
    displayName: '홈택스 매입 세금계산서',
    description: '홈택스 매입 전자세금계산서 목록 (공급받는자 기준)',
    rowCount: 5,
    columnCount: 40,
    columns: ['id','sourceId','businessNumber','invoiceType','writeDate','approvalNumber','issueDate','sendDate','supplierBizNo','supplierSubBizNo','supplierName','supplierCeoName','supplierAddress','buyerBizNo','buyerSubBizNo','buyerName','buyerCeoName','buyerAddress','totalAmount','supplyAmount','taxAmount','invoiceClass','invoiceKind','issueType','remark','receiptOrClaim','supplierEmail','buyerEmail1','buyerEmail2','itemDate','itemName','itemSpec','itemQty','itemUnitPrice','itemSupplyAmount','itemTaxAmount','itemRemark','excelFilePath','originalCreatedAt','importedAt']
  } as TableDefinition,
  table23: {
    name: 'hometax_cash_receipts',
    displayName: '홈택스 현금영수증',
    description: '홈택스 현금영수증 발행 목록',
    rowCount: 0,
    columnCount: 18,
    columns: ['id','sourceId','businessNumber','saleDate','approvalNumber','approvalType','transactionType','supplyAmount','taxAmount','serviceCharge','totalAmount','buyerIdentifier','issuerBizNo','issuerName','excelFilePath','originalCreatedAt','rawJson','importedAt']
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
  table1: 'input_guardrail',
  table2: 'department',
  table3: 'action_task',
  table4: 'workflow_instance',
  table5: 'workflow_template',
  table6: 'notification',
  table7: 'workspace_item',
  table8: 'report_row_history',
  table9: 'report_access',
  table10: 'report_row',
  table11: 'workflow_steering',
  table12: 'report',
  table13: 'user',
  table14: 'sync_activity_log',
  table15: 'sync_configurations',
  table16: 'ai_studio_session_persistence',
  table17: 'ai_persistence_test',
  table18: 'ai_studio_session',
  table19: 'user_data_files',
  table20: 'promissory_notes',
  table21: 'hometax_sales_invoices',
  table22: 'hometax_purchase_invoices',
  table23: 'hometax_cash_receipts'
} as const;
