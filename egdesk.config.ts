/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-16T13:50:42.100Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '84eb800a-8612-4ae4-86be-8602c1eb7dc9',
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
    name: 'master_client_employee',
    displayName: '거래처 담당자 마스터',
    rowCount: 3,
    columnCount: 7,
    columns: ['id', 'clientId', 'name', 'position', 'phone', 'email', 'createdAt']
  } as TableDefinition,
  table2: {
    name: 'master_product',
    displayName: '제품 마스터',
    rowCount: 4,
    columnCount: 5,
    columns: ['id', 'name', 'spec', 'unitPrice', 'createdAt']
  } as TableDefinition,
  table3: {
    name: 'master_client',
    displayName: '거래처 마스터',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'name', 'businessNumber', 'address', 'ceoName', 'createdAt']
  } as TableDefinition,
  table4: {
    name: 'workspace_item',
    displayName: 'Workspace Image Items',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', 'creatorId', 'imageUrl', 'originalText', 'suggestedTitle', 'suggestedSummary', 'status', 'reportId', 'rowId', 'aiData', 'createdAt', 'updatedAt', 'location_lat', 'location_lng', 'location_name']
  } as TableDefinition,
  table5: {
    name: 'hometax_cash_receipts',
    displayName: '홈택스 현금영수증',
    description: '홈택스 현금영수증 발행 목록',
    columnCount: 18,
    columns: ['id', 'sourceId', 'businessNumber', 'saleDate', 'approvalNumber', 'approvalType', 'transactionType', 'supplyAmount', 'taxAmount', 'serviceCharge', 'totalAmount', 'buyerIdentifier', 'issuerBizNo', 'issuerName', 'excelFilePath', 'originalCreatedAt', 'rawJson', 'importedAt']
  } as TableDefinition,
  table6: {
    name: 'hometax_purchase_invoices',
    displayName: '홈택스 매입 세금계산서',
    description: '홈택스 매입 전자세금계산서 목록 (공급받는자 기준)',
    rowCount: 5,
    columnCount: 40,
    columns: ['id', 'sourceId', 'businessNumber', 'invoiceType', 'writeDate', 'approvalNumber', 'issueDate', 'sendDate', 'supplierBizNo', 'supplierSubBizNo', 'supplierName', 'supplierCeoName', 'supplierAddress', 'buyerBizNo', 'buyerSubBizNo', 'buyerName', 'buyerCeoName', 'buyerAddress', 'totalAmount', 'supplyAmount', 'taxAmount', 'invoiceClass', 'invoiceKind', 'issueType', 'remark', 'receiptOrClaim', 'supplierEmail', 'buyerEmail1', 'buyerEmail2', 'itemDate', 'itemName', 'itemSpec', 'itemQty', 'itemUnitPrice', 'itemSupplyAmount', 'itemTaxAmount', 'itemRemark', 'excelFilePath', 'originalCreatedAt', 'importedAt']
  } as TableDefinition,
  table7: {
    name: 'hometax_sales_invoices',
    displayName: '홈택스 매출 세금계산서',
    description: '홈택스 매출 전자세금계산서 목록 (공급자 기준)',
    rowCount: 2,
    columnCount: 40,
    columns: ['id', 'sourceId', 'businessNumber', 'invoiceType', 'writeDate', 'approvalNumber', 'issueDate', 'sendDate', 'supplierBizNo', 'supplierSubBizNo', 'supplierName', 'supplierCeoName', 'supplierAddress', 'buyerBizNo', 'buyerSubBizNo', 'buyerName', 'buyerCeoName', 'buyerAddress', 'totalAmount', 'supplyAmount', 'taxAmount', 'invoiceClass', 'invoiceKind', 'issueType', 'remark', 'receiptOrClaim', 'supplierEmail', 'buyerEmail1', 'buyerEmail2', 'itemDate', 'itemName', 'itemSpec', 'itemQty', 'itemUnitPrice', 'itemSupplyAmount', 'itemTaxAmount', 'itemRemark', 'excelFilePath', 'originalCreatedAt', 'importedAt']
  } as TableDefinition,
  table8: {
    name: 'promissory_notes',
    displayName: '어음 거래',
    description: 'FinanceHub promissory_notes: 어음(외상매출채권) 전체 내역 (발행/수취)',
    rowCount: 57,
    columnCount: 37,
    columns: ['id', 'sourceId', 'accountId', 'bankId', 'bankName', 'accountNumber', 'noteNumber', 'noteType', 'issuerName', 'issuerRegistrationNumber', 'payeeName', 'amount', 'currency', 'issueDate', 'maturityDate', 'status', 'bankBranch', 'category', 'isManual', 'metaSource', 'metaSerial', 'metaCancellationRequested', 'metaCashLike', 'metaLoanAvailableDate', 'metaLoanExecuted', 'metaLoanAmount', 'metaTaxIssueDate', 'metaDepositAccountNumber', 'metaSeizureAmount', 'metaOriginalNoteAmount', 'metaSeizureClaimant', 'metaRawStatus', 'metaImportSourceFile', 'metaJson', 'originalCreatedAt', 'originalUpdatedAt', 'importedAt']
  } as TableDefinition,
  table9: {
    name: 'input_guardrail',
    displayName: 'Input Guardrails',
    description: '관리자가 설정한 데이터 입력 제한 규칙 테이블',
    columnCount: 9,
    columns: ['id', 'reportId', 'columnName', 'ruleType', 'ruleValue', 'severity', 'errorMessage', 'adminAdvice', 'createdAt']
  } as TableDefinition,
  table10: {
    name: 'department',
    displayName: 'Organization Departments',
    rowCount: 3,
    columnCount: 5,
    columns: ['id', 'name', 'description', 'icon', 'createdAt']
  } as TableDefinition,
  table11: {
    name: 'action_task',
    displayName: 'Action Tasks',
    columnCount: 12,
    columns: ['id', 'instanceId', 'reportId', 'title', 'description', 'type', 'status', 'assigneeId', 'assigneeRole', 'dueAt', 'completedAt', 'createdAt']
  } as TableDefinition,
  table12: {
    name: 'workflow_instance',
    displayName: 'Workflow Instances',
    columnCount: 6,
    columns: ['id', 'templateId', 'triggerRowId', 'status', 'startedAt', 'completedAt']
  } as TableDefinition,
  table13: {
    name: 'workflow_template',
    displayName: 'Workflow Templates',
    columnCount: 6,
    columns: ['id', 'name', 'triggerReportId', 'triggerCondition', 'tasks', 'createdAt']
  } as TableDefinition,
  table14: {
    name: 'notification',
    displayName: 'User Notifications',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'userId', 'title', 'message', 'link', 'type', 'isRead', 'createdAt']
  } as TableDefinition,
  table15: {
    name: 'report_row_history',
    displayName: 'Report Row History',
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table16: {
    name: 'report_access',
    displayName: 'Report Access Controls',
    columnCount: 6,
    columns: ['id', 'reportId', 'userId', 'role', 'grantedAt', 'grantedBy']
  } as TableDefinition,
  table17: {
    name: 'report_row',
    displayName: 'Virtual Report Rows',
    columnCount: 9,
    columns: ['id', 'reportId', 'data', 'isDeleted', 'deletedAt', 'creatorId', 'updaterId', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table18: {
    name: 'workflow_steering',
    displayName: 'AI Workflow Steering',
    columnCount: 10,
    columns: ['id', 'reportId', 'rowId', 'eventType', 'recommendation', 'reasoning', 'status', 'decidedById', 'decidedAt', 'createdAt']
  } as TableDefinition,
  table19: {
    name: 'report',
    displayName: 'System Reports',
    columnCount: 14,
    columns: ['id', 'name', 'sheetName', 'description', 'tableName', 'columns', 'uiConfig', 'aiConfig', 'isDeleted', 'deletedAt', 'ownerId', 'lastSerial', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table20: {
    name: 'user',
    displayName: 'System Users',
    rowCount: 5,
    columnCount: 11,
    columns: ['id', 'username', 'email', 'password', 'role', 'fullName', 'employeeId', 'departmentId', 'position', 'isActive', 'createdAt']
  } as TableDefinition,
  table21: {
    name: 'sync_activity_log',
    displayName: 'sync_activity_log',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 12,
    columns: ['id', 'config_id', 'file_name', 'file_path', 'status', 'rows_imported', 'rows_skipped', 'duplicates_skipped', 'error_message', 'started_at', 'completed_at', 'duration_ms']
  } as TableDefinition,
  table22: {
    name: 'sync_configurations',
    displayName: 'sync_configurations',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 24,
    columns: ['id', 'script_folder_path', 'script_name', 'folder_name', 'target_table_id', 'header_row', 'skip_bottom_rows', 'sheet_index', 'column_mappings', 'applied_splits', 'file_action', 'enabled', 'auto_sync_enabled', 'unique_key_columns', 'duplicate_action', 'last_sync_at', 'last_sync_status', 'last_sync_rows_imported', 'last_sync_rows_skipped', 'last_sync_duplicates', 'last_sync_error', 'created_at', 'updated_at', 'source']
  } as TableDefinition,
  table23: {
    name: 'ai_studio_session_persistence',
    displayName: 'AI Studio Session',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table24: {
    name: 'ai_persistence_test',
    displayName: 'AI Persistence Test',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table25: {
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table26: {
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
  table1: 'master_client_employee',
  table2: 'master_product',
  table3: 'master_client',
  table4: 'workspace_item',
  table5: 'hometax_cash_receipts',
  table6: 'hometax_purchase_invoices',
  table7: 'hometax_sales_invoices',
  table8: 'promissory_notes',
  table9: 'input_guardrail',
  table10: 'department',
  table11: 'action_task',
  table12: 'workflow_instance',
  table13: 'workflow_template',
  table14: 'notification',
  table15: 'report_row_history',
  table16: 'report_access',
  table17: 'report_row',
  table18: 'workflow_steering',
  table19: 'report',
  table20: 'user',
  table21: 'sync_activity_log',
  table22: 'sync_configurations',
  table23: 'ai_studio_session_persistence',
  table24: 'ai_persistence_test',
  table25: 'ai_studio_session',
  table26: 'user_data_files'
} as const;
