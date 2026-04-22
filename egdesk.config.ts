/**
 * EGDesk User Data Configuration
 * Generated at: 2026-04-22T00:06:15.370Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: 'dccf10a2-2887-4488-95c1-02b789ff1d08',
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
    name: 'tpl_it_it_policy',
    displayName: 'IT 보안 정책 및 가이드',
    columnCount: 5,
    columns: ['id', 'policy_name', 'last_update', 'metadata', 'isDeleted']
  } as TableDefinition,
  table2: {
    name: 'tpl_it_domain_ssl',
    displayName: '도메인 및 SSL 관리',
    columnCount: 5,
    columns: ['id', 'domain', 'expiry', 'metadata', 'isDeleted']
  } as TableDefinition,
  table3: {
    name: 'tpl_it_access_control',
    displayName: '전산실 출입 기록',
    columnCount: 5,
    columns: ['id', 'visitor', 'in_out', 'metadata', 'isDeleted']
  } as TableDefinition,
  table4: {
    name: 'tpl_it_repair_logs',
    displayName: 'IT 기기 수리 및 교체 이력',
    columnCount: 5,
    columns: ['id', 'asset_id', 'reason', 'metadata', 'isDeleted']
  } as TableDefinition,
  table5: {
    name: 'tpl_it_server_resources',
    displayName: '서버/클라우드 자원 현황',
    columnCount: 5,
    columns: ['id', 'resource_name', 'cost_last_month', 'metadata', 'isDeleted']
  } as TableDefinition,
  table6: {
    name: 'tpl_it_backup_history',
    displayName: '백업 및 복구 테스트',
    columnCount: 5,
    columns: ['id', 'backup_date', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table7: {
    name: 'tpl_it_security_logs',
    displayName: '보안 사고 및 탐지 일지',
    columnCount: 5,
    columns: ['id', 'date', 'event', 'metadata', 'isDeleted']
  } as TableDefinition,
  table8: {
    name: 'tpl_it_accounts',
    displayName: '시스템 계정 및 권한',
    columnCount: 5,
    columns: ['id', 'user_id', 'permissions', 'metadata', 'isDeleted']
  } as TableDefinition,
  table9: {
    name: 'tpl_it_sw_license',
    displayName: 'SW 라이선스 현황',
    columnCount: 5,
    columns: ['id', 'sw_name', 'exp_date', 'metadata', 'isDeleted']
  } as TableDefinition,
  table10: {
    name: 'tpl_it_hw_inventory',
    displayName: 'PC 및 하드웨어 자산',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'asset_no', 'user', 'spec', 'metadata', 'isDeleted']
  } as TableDefinition,
  table11: {
    name: 'tpl_leg_standard_forms',
    displayName: '사외 표준 문서 양식집',
    columnCount: 5,
    columns: ['id', 'form_name', 'version', 'metadata', 'isDeleted']
  } as TableDefinition,
  table12: {
    name: 'tpl_leg_risk_mgmt',
    displayName: '리스크 관리 대장',
    columnCount: 5,
    columns: ['id', 'risk_item', 'level', 'metadata', 'isDeleted']
  } as TableDefinition,
  table13: {
    name: 'tpl_leg_shareholders_mtg',
    displayName: '이사회/주총 의사록',
    columnCount: 5,
    columns: ['id', 'date', 'resolutions', 'metadata', 'isDeleted']
  } as TableDefinition,
  table14: {
    name: 'tpl_leg_insurance',
    displayName: '기업 보험 가입 현황',
    columnCount: 5,
    columns: ['id', 'type', 'premium', 'metadata', 'isDeleted']
  } as TableDefinition,
  table15: {
    name: 'tpl_leg_esg_data',
    displayName: 'ESG 경영 공시 데이터',
    columnCount: 5,
    columns: ['id', 'metric', 'value', 'metadata', 'isDeleted']
  } as TableDefinition,
  table16: {
    name: 'tpl_leg_privacy_check',
    displayName: '개인정보 보호 자가점검',
    columnCount: 5,
    columns: ['id', 'check_item', 'is_ok', 'metadata', 'isDeleted']
  } as TableDefinition,
  table17: {
    name: 'tpl_leg_safety_audit',
    displayName: '정기 소방/안전 진단',
    columnCount: 5,
    columns: ['id', 'audit_date', 'score', 'metadata', 'isDeleted']
  } as TableDefinition,
  table18: {
    name: 'tpl_leg_licenses',
    displayName: '사업 면허/인허가 관리',
    columnCount: 5,
    columns: ['id', 'license_name', 'expiry', 'metadata', 'isDeleted']
  } as TableDefinition,
  table19: {
    name: 'tpl_leg_patents',
    displayName: '특허 및 지식재산권',
    columnCount: 5,
    columns: ['id', 'title', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table20: {
    name: 'tpl_leg_contracts',
    displayName: '중요 계약서 대장',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'partner', 'end_date', 'metadata', 'isDeleted']
  } as TableDefinition,
  table21: {
    name: 'tpl_ops_mail_log',
    displayName: '우편/택배 수발신 대장',
    columnCount: 5,
    columns: ['id', 'is_incoming', 'sender', 'metadata', 'isDeleted']
  } as TableDefinition,
  table22: {
    name: 'tpl_ops_task_mgmt',
    displayName: '부서별 업무 관리(To-Do)',
    columnCount: 6,
    columns: ['id', 'task', 'assignee', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table23: {
    name: 'tpl_ops_visitor_log',
    displayName: '외부인 방문 기록',
    columnCount: 5,
    columns: ['id', 'visitor', 'purpose', 'metadata', 'isDeleted']
  } as TableDefinition,
  table24: {
    name: 'tpl_ops_supplies_request',
    displayName: '비품 구매 신청서',
    columnCount: 5,
    columns: ['id', 'requester', 'item', 'metadata', 'isDeleted']
  } as TableDefinition,
  table25: {
    name: 'tpl_ops_facility_check',
    displayName: '시설물 안전 점검표',
    columnCount: 5,
    columns: ['id', 'facility', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table26: {
    name: 'tpl_ops_notices',
    displayName: '사내 공지 사항',
    columnCount: 5,
    columns: ['id', 'title', 'content', 'metadata', 'isDeleted']
  } as TableDefinition,
  table27: {
    name: 'tpl_ops_seal_usage',
    displayName: '법인 인감 날인 대장',
    columnCount: 5,
    columns: ['id', 'date', 'use_case', 'metadata', 'isDeleted']
  } as TableDefinition,
  table28: {
    name: 'tpl_ops_vehicle_log',
    displayName: '업무용 차량 운행 일지',
    columnCount: 6,
    columns: ['id', 'date', 'destination', 'mileage', 'metadata', 'isDeleted']
  } as TableDefinition,
  table29: {
    name: 'tpl_ops_office_supplies',
    displayName: '비품/소모품 관리',
    columnCount: 5,
    columns: ['id', 'item', 'stock', 'metadata', 'isDeleted']
  } as TableDefinition,
  table30: {
    name: 'tpl_ops_meeting_minutes',
    displayName: '회의록 및 결정사항',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'date', 'title', 'metadata', 'isDeleted']
  } as TableDefinition,
  table31: {
    name: 'tpl_cs_defect_reports',
    displayName: '고객 발굴 제품 결함',
    columnCount: 5,
    columns: ['id', 'product', 'issue', 'metadata', 'isDeleted']
  } as TableDefinition,
  table32: {
    name: 'tpl_cs_callback_list',
    displayName: '콜백/해피콜 대장',
    columnCount: 5,
    columns: ['id', 'customer', 'result', 'metadata', 'isDeleted']
  } as TableDefinition,
  table33: {
    name: 'tpl_cs_loyalty_program',
    displayName: '우수 고객 관리',
    columnCount: 5,
    columns: ['id', 'customer', 'grade', 'metadata', 'isDeleted']
  } as TableDefinition,
  table34: {
    name: 'tpl_cs_product_manuals',
    displayName: '매뉴얼 버전 관리',
    columnCount: 5,
    columns: ['id', 'product', 'version', 'metadata', 'isDeleted']
  } as TableDefinition,
  table35: {
    name: 'tpl_cs_field_support',
    displayName: '현장 파견 지원 기록',
    columnCount: 5,
    columns: ['id', 'customer', 'work_done', 'metadata', 'isDeleted']
  } as TableDefinition,
  table36: {
    name: 'tpl_cs_warranty_data',
    displayName: '제품 보증 및 워런티',
    columnCount: 5,
    columns: ['id', 'serial_no', 'expiry', 'metadata', 'isDeleted']
  } as TableDefinition,
  table37: {
    name: 'tpl_cs_faq_library',
    displayName: '자주 묻는 질문(FAQ) DB',
    columnCount: 6,
    columns: ['id', 'question', 'answer', 'category', 'metadata', 'isDeleted']
  } as TableDefinition,
  table38: {
    name: 'tpl_cs_satisfaction',
    displayName: '고객 만족도 조사',
    columnCount: 5,
    columns: ['id', 'customer', 'score', 'metadata', 'isDeleted']
  } as TableDefinition,
  table39: {
    name: 'tpl_cs_repair_logs',
    displayName: 'AS 수리 일지',
    columnCount: 6,
    columns: ['id', 'product', 'repair_summary', 'cost', 'metadata', 'isDeleted']
  } as TableDefinition,
  table40: {
    name: 'tpl_cs_tickets',
    displayName: '고객 문의(Ticket) 관리',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'customer', 'subject', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table41: {
    name: 'tpl_pur_cost_reduction',
    displayName: '원가 절감 활동 기록',
    columnCount: 5,
    columns: ['id', 'activity', 'saving', 'metadata', 'isDeleted']
  } as TableDefinition,
  table42: {
    name: 'tpl_pur_sample_request',
    displayName: '샘플 구매 및 검토',
    columnCount: 5,
    columns: ['id', 'item', 'decision', 'metadata', 'isDeleted']
  } as TableDefinition,
  table43: {
    name: 'tpl_pur_defect_claims',
    displayName: '자재 불량 클레임',
    columnCount: 5,
    columns: ['id', 'vendor', 'reason', 'metadata', 'isDeleted']
  } as TableDefinition,
  table44: {
    name: 'tpl_pur_contract_mgmt',
    displayName: '구매 계약 관리',
    columnCount: 5,
    columns: ['id', 'vendor', 'expiry', 'metadata', 'isDeleted']
  } as TableDefinition,
  table45: {
    name: 'tpl_pur_outsourcing',
    displayName: '외주 가공 요청서',
    columnCount: 5,
    columns: ['id', 'vendor', 'item', 'metadata', 'isDeleted']
  } as TableDefinition,
  table46: {
    name: 'tpl_pur_rfq_history',
    displayName: 'RFQ(견적요청) 이력',
    columnCount: 5,
    columns: ['id', 'project', 'vendor_count', 'metadata', 'isDeleted']
  } as TableDefinition,
  table47: {
    name: 'tpl_pur_import_clearance',
    displayName: '수입 통관 진행 현황',
    columnCount: 5,
    columns: ['id', 'bl_no', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table48: {
    name: 'tpl_pur_raw_material_prices',
    displayName: '원자재 시세 기록',
    columnCount: 5,
    columns: ['id', 'item', 'market_price', 'metadata', 'isDeleted']
  } as TableDefinition,
  table49: {
    name: 'tpl_pur_purchase_orders',
    displayName: '구매 발주 대장',
    columnCount: 6,
    columns: ['id', 'po_no', 'vendor', 'amount', 'metadata', 'isDeleted']
  } as TableDefinition,
  table50: {
    name: 'tpl_pur_vendor_eval',
    displayName: '협력업체 평가 기록',
    columnCount: 5,
    columns: ['id', 'vendor_name', 'score', 'metadata', 'isDeleted']
  } as TableDefinition,
  table51: {
    name: 'tpl_fin_stock_management',
    displayName: '주주 및 자본금 변동',
    columnCount: 5,
    columns: ['id', 'shareholder', 'shares', 'metadata', 'isDeleted']
  } as TableDefinition,
  table52: {
    name: 'tpl_fin_tax_invoices',
    displayName: '세금계산서 발행 대장',
    columnCount: 5,
    columns: ['id', 'invoice_no', 'customer', 'metadata', 'isDeleted']
  } as TableDefinition,
  table53: {
    name: 'tpl_fin_external_audit',
    displayName: '외부 감사 대응 이력',
    columnCount: 6,
    columns: ['id', 'year', 'auditor', 'findings', 'metadata', 'isDeleted']
  } as TableDefinition,
  table54: {
    name: 'tpl_fin_budget_vs_actual',
    displayName: '예산 대비 집행 실적',
    columnCount: 6,
    columns: ['id', 'dept', 'budget', 'used', 'metadata', 'isDeleted']
  } as TableDefinition,
  table55: {
    name: 'tpl_fin_cashflow',
    displayName: '일일 자금 수지 현황',
    columnCount: 6,
    columns: ['id', 'date', 'income', 'expense', 'metadata', 'isDeleted']
  } as TableDefinition,
  table56: {
    name: 'tpl_fin_loans',
    displayName: '대출 및 금융 부채',
    columnCount: 6,
    columns: ['id', 'bank', 'principal', 'interest_rate', 'metadata', 'isDeleted']
  } as TableDefinition,
  table57: {
    name: 'tpl_fin_accounts_payable',
    displayName: '외상매입금(AP) 관리',
    columnCount: 6,
    columns: ['id', 'supplier', 'amount', 'pay_date', 'metadata', 'isDeleted']
  } as TableDefinition,
  table58: {
    name: 'tpl_fin_assets',
    displayName: '고정 자산 대장',
    columnCount: 6,
    columns: ['id', 'asset_id', 'name', 'purchase_price', 'metadata', 'isDeleted']
  } as TableDefinition,
  table59: {
    name: 'tpl_fin_vat_report',
    displayName: '부가세 신고 기초 자료',
    columnCount: 6,
    columns: ['id', 'invoice_date', 'supply_value', 'tax', 'metadata', 'isDeleted']
  } as TableDefinition,
  table60: {
    name: 'tpl_fin_card_expenses',
    displayName: '법인카드 경비 내역',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'date', 'merchant', 'amount', 'user', 'metadata', 'isDeleted']
  } as TableDefinition,
  table61: {
    name: 'tpl_sales_partnership',
    displayName: '전략적 제휴 이력',
    columnCount: 5,
    columns: ['id', 'partner', 'scope', 'metadata', 'isDeleted']
  } as TableDefinition,
  table62: {
    name: 'tpl_sales_marketing_eff',
    displayName: '마케팅 캠페인 효율',
    columnCount: 5,
    columns: ['id', 'campaign', 'lead_count', 'metadata', 'isDeleted']
  } as TableDefinition,
  table63: {
    name: 'tpl_sales_collections',
    displayName: '수금/채권 관리',
    columnCount: 6,
    columns: ['id', 'customer', 'unpaid', 'due_date', 'metadata', 'isDeleted']
  } as TableDefinition,
  table64: {
    name: 'tpl_sales_revenue_target',
    displayName: '매출 목표 대비 실적',
    rowCount: 2,
    columnCount: 6,
    columns: ['id', 'month', 'target', 'actual', 'metadata', 'isDeleted']
  } as TableDefinition,
  table65: {
    name: 'tpl_sales_competitors',
    displayName: '경쟁사 동향 분석',
    columnCount: 5,
    columns: ['id', 'competitor', 'intel', 'metadata', 'isDeleted']
  } as TableDefinition,
  table66: {
    name: 'tpl_sales_customer_contacts',
    displayName: '거래처 담당자 명부',
    columnCount: 6,
    columns: ['id', 'company', 'person', 'phone', 'metadata', 'isDeleted']
  } as TableDefinition,
  table67: {
    name: 'tpl_sales_orders',
    displayName: '수주/주문 대장',
    columnCount: 5,
    columns: ['id', 'order_no', 'amount', 'metadata', 'isDeleted']
  } as TableDefinition,
  table68: {
    name: 'tpl_sales_quotations',
    displayName: '견적서 발행 이력',
    columnCount: 5,
    columns: ['id', 'quote_no', 'total_amount', 'metadata', 'isDeleted']
  } as TableDefinition,
  table69: {
    name: 'tpl_sales_meetings',
    displayName: '영업 상담 일지',
    columnCount: 5,
    columns: ['id', 'customer', 'summary', 'metadata', 'isDeleted']
  } as TableDefinition,
  table70: {
    name: 'tpl_sales_leads',
    displayName: '영업 기회(Leads)',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'customer', 'value', 'probability', 'metadata', 'isDeleted']
  } as TableDefinition,
  table71: {
    name: 'tpl_hr_resignation',
    displayName: '퇴직자 관리',
    columnCount: 6,
    columns: ['id', 'emp_name', 'resign_date', 'reason', 'metadata', 'isDeleted']
  } as TableDefinition,
  table72: {
    name: 'tpl_hr_praise_punish',
    displayName: '포상 및 징계 기록',
    columnCount: 6,
    columns: ['id', 'emp_name', 'type', 'reason', 'metadata', 'isDeleted']
  } as TableDefinition,
  table73: {
    name: 'tpl_hr_benefits',
    displayName: '복리후생 지원금',
    columnCount: 5,
    columns: ['id', 'type', 'amount', 'metadata', 'isDeleted']
  } as TableDefinition,
  table74: {
    name: 'tpl_hr_performance',
    displayName: '인사 고과 평정',
    columnCount: 6,
    columns: ['id', 'year', 'emp_name', 'grade', 'metadata', 'isDeleted']
  } as TableDefinition,
  table75: {
    name: 'tpl_hr_recruiting',
    displayName: '채용 후보자 관리',
    columnCount: 6,
    columns: ['id', 'candidate', 'position', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table76: {
    name: 'tpl_hr_training',
    displayName: '교육 이수 현황',
    columnCount: 5,
    columns: ['id', 'course_name', 'completion_date', 'metadata', 'isDeleted']
  } as TableDefinition,
  table77: {
    name: 'tpl_hr_payroll',
    displayName: '급여 지급 대장',
    columnCount: 6,
    columns: ['id', 'month', 'base_salary', 'total_pay', 'metadata', 'isDeleted']
  } as TableDefinition,
  table78: {
    name: 'tpl_hr_vacation',
    displayName: '연차/휴가 신청',
    columnCount: 6,
    columns: ['id', 'emp_name', 'start_date', 'days', 'metadata', 'isDeleted']
  } as TableDefinition,
  table79: {
    name: 'tpl_hr_attendance',
    displayName: '일일 근태 기록',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'date', 'emp_name', 'check_in', 'metadata', 'isDeleted']
  } as TableDefinition,
  table80: {
    name: 'tpl_hr_employee_master',
    displayName: '사원 명부',
    rowCount: 1,
    columnCount: 6,
    columns: ['id', 'emp_id', 'name', 'dept', 'metadata', 'isDeleted']
  } as TableDefinition,
  table81: {
    name: 'tpl_dist_inventory_survey',
    displayName: '재고 실사 기록',
    columnCount: 6,
    columns: ['id', 'survey_date', 'actual_qty', 'diff', 'metadata', 'isDeleted']
  } as TableDefinition,
  table82: {
    name: 'tpl_dist_return_log',
    displayName: '반품/교환 대장',
    columnCount: 5,
    columns: ['id', 'customer', 'reason', 'metadata', 'isDeleted']
  } as TableDefinition,
  table83: {
    name: 'tpl_dist_shipping_cost',
    displayName: '운송비 정산 대장',
    columnCount: 5,
    columns: ['id', 'delivery_id', 'cost', 'metadata', 'isDeleted']
  } as TableDefinition,
  table84: {
    name: 'tpl_dist_fleet_mgmt',
    displayName: '운송 차량 관리',
    columnCount: 5,
    columns: ['id', 'vehicle_no', 'driver', 'metadata', 'isDeleted']
  } as TableDefinition,
  table85: {
    name: 'tpl_dist_expired_goods',
    displayName: '유통기한/폐기 대장',
    columnCount: 5,
    columns: ['id', 'item_name', 'expiry_date', 'metadata', 'isDeleted']
  } as TableDefinition,
  table86: {
    name: 'tpl_dist_warehouse_move',
    displayName: '창고간 이동 내역',
    columnCount: 6,
    columns: ['id', 'from_wh', 'to_wh', 'qty', 'metadata', 'isDeleted']
  } as TableDefinition,
  table87: {
    name: 'tpl_dist_delivery_tracker',
    displayName: '배송 추적 현황',
    columnCount: 6,
    columns: ['id', 'invoice_no', 'status', 'recipient', 'metadata', 'isDeleted']
  } as TableDefinition,
  table88: {
    name: 'tpl_dist_outgoing_log',
    displayName: '물품 출고 일지',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'outgoing_date', 'customer_name', 'item_name', 'qty', 'metadata', 'isDeleted']
  } as TableDefinition,
  table89: {
    name: 'tpl_dist_incoming_log',
    displayName: '물품 입고 일지',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'incoming_date', 'supplier', 'item_name', 'qty', 'metadata', 'isDeleted']
  } as TableDefinition,
  table90: {
    name: 'tpl_dist_inventory_stock',
    displayName: '전사 재고 현황',
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'warehouse_id', 'item_name', 'current_qty', 'safety_qty', 'metadata', 'isDeleted']
  } as TableDefinition,
  table91: {
    name: 'tpl_mfg_energy_usage',
    displayName: '공장 에너지 사용량',
    columnCount: 5,
    columns: ['id', 'date', 'usage_kwh', 'metadata', 'isDeleted']
  } as TableDefinition,
  table92: {
    name: 'tpl_mfg_process_leadtime',
    displayName: '공정 리드타임 측정',
    columnCount: 5,
    columns: ['id', 'process_name', 'avg_time', 'metadata', 'isDeleted']
  } as TableDefinition,
  table93: {
    name: 'tpl_mfg_mold_inventory',
    displayName: '금형 자산 관리',
    columnCount: 5,
    columns: ['id', 'mold_no', 'location', 'metadata', 'isDeleted']
  } as TableDefinition,
  table94: {
    name: 'tpl_mfg_defect_analysis',
    displayName: '불량 원인 분석 대장',
    columnCount: 5,
    columns: ['id', 'item_name', 'root_cause', 'metadata', 'isDeleted']
  } as TableDefinition,
  table95: {
    name: 'tpl_mfg_safety_training',
    displayName: '안전 교육 기록',
    rowCount: 1,
    columnCount: 5,
    columns: ['id', 'training_date', 'topic', 'metadata', 'isDeleted']
  } as TableDefinition,
  table96: {
    name: 'tpl_mfg_machine_maintenance',
    displayName: '설비 점검 및 수리 대장',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'machine_id', 'check_date', 'repair_cost', 'status', 'metadata', 'isDeleted']
  } as TableDefinition,
  table97: {
    name: 'tpl_mfg_quality_inspection',
    displayName: '품질 검사 보고서',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'inspection_date', 'inspector', 'result', 'defect_reason', 'metadata', 'isDeleted']
  } as TableDefinition,
  table98: {
    name: 'tpl_mfg_work_log',
    displayName: '작업 실적 일지',
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'work_date', 'worker_name', 'actual_quantity', 'defect_count', 'metadata', 'isDeleted']
  } as TableDefinition,
  table99: {
    name: 'tpl_mfg_production_order',
    displayName: '생산 작업지시서',
    rowCount: 2,
    columnCount: 7,
    columns: ['id', 'order_no', 'target_date', 'product_name', 'target_quantity', 'metadata', 'isDeleted']
  } as TableDefinition,
  table100: {
    name: 'tpl_mfg_bom',
    displayName: '제품 부품 구성표 (BOM)',
    rowCount: 3,
    columnCount: 7,
    columns: ['id', 'product_code', 'material_name', 'quantity', 'unit', 'metadata', 'isDeleted']
  } as TableDefinition,
  table101: {
    name: 'system_settings',
    displayName: '시스템 설정 (System Settings)',
    rowCount: 1,
    columnCount: 7,
    columns: ['id', 'companyName', 'logoUrl', 'themeColor', 'businessContext', 'isInitialized', 'updatedAt']
  } as TableDefinition,
  table102: {
    name: 'master_client_employee',
    displayName: '거래처 담당자 마스터',
    rowCount: 3,
    columnCount: 7,
    columns: ['id', 'clientId', 'name', 'position', 'phone', 'email', 'createdAt']
  } as TableDefinition,
  table103: {
    name: 'master_product',
    displayName: '제품 마스터',
    rowCount: 4,
    columnCount: 5,
    columns: ['id', 'name', 'spec', 'unitPrice', 'createdAt']
  } as TableDefinition,
  table104: {
    name: 'master_client',
    displayName: '거래처 마스터',
    rowCount: 4,
    columnCount: 6,
    columns: ['id', 'name', 'businessNumber', 'address', 'ceoName', 'createdAt']
  } as TableDefinition,
  table105: {
    name: 'workspace_item',
    displayName: 'Workspace Image Items',
    rowCount: 1,
    columnCount: 15,
    columns: ['id', 'creatorId', 'imageUrl', 'originalText', 'suggestedTitle', 'suggestedSummary', 'status', 'reportId', 'rowId', 'aiData', 'createdAt', 'updatedAt', 'location_lat', 'location_lng', 'location_name']
  } as TableDefinition,
  table106: {
    name: 'hometax_cash_receipts',
    displayName: '홈택스 현금영수증',
    description: '홈택스 현금영수증 발행 목록',
    columnCount: 18,
    columns: ['id', 'sourceId', 'businessNumber', 'saleDate', 'approvalNumber', 'approvalType', 'transactionType', 'supplyAmount', 'taxAmount', 'serviceCharge', 'totalAmount', 'buyerIdentifier', 'issuerBizNo', 'issuerName', 'excelFilePath', 'originalCreatedAt', 'rawJson', 'importedAt']
  } as TableDefinition,
  table107: {
    name: 'hometax_purchase_invoices',
    displayName: '홈택스 매입 세금계산서',
    description: '홈택스 매입 전자세금계산서 목록 (공급받는자 기준)',
    rowCount: 5,
    columnCount: 40,
    columns: ['id', 'sourceId', 'businessNumber', 'invoiceType', 'writeDate', 'approvalNumber', 'issueDate', 'sendDate', 'supplierBizNo', 'supplierSubBizNo', 'supplierName', 'supplierCeoName', 'supplierAddress', 'buyerBizNo', 'buyerSubBizNo', 'buyerName', 'buyerCeoName', 'buyerAddress', 'totalAmount', 'supplyAmount', 'taxAmount', 'invoiceClass', 'invoiceKind', 'issueType', 'remark', 'receiptOrClaim', 'supplierEmail', 'buyerEmail1', 'buyerEmail2', 'itemDate', 'itemName', 'itemSpec', 'itemQty', 'itemUnitPrice', 'itemSupplyAmount', 'itemTaxAmount', 'itemRemark', 'excelFilePath', 'originalCreatedAt', 'importedAt']
  } as TableDefinition,
  table108: {
    name: 'hometax_sales_invoices',
    displayName: '홈택스 매출 세금계산서',
    description: '홈택스 매출 전자세금계산서 목록 (공급자 기준)',
    rowCount: 2,
    columnCount: 40,
    columns: ['id', 'sourceId', 'businessNumber', 'invoiceType', 'writeDate', 'approvalNumber', 'issueDate', 'sendDate', 'supplierBizNo', 'supplierSubBizNo', 'supplierName', 'supplierCeoName', 'supplierAddress', 'buyerBizNo', 'buyerSubBizNo', 'buyerName', 'buyerCeoName', 'buyerAddress', 'totalAmount', 'supplyAmount', 'taxAmount', 'invoiceClass', 'invoiceKind', 'issueType', 'remark', 'receiptOrClaim', 'supplierEmail', 'buyerEmail1', 'buyerEmail2', 'itemDate', 'itemName', 'itemSpec', 'itemQty', 'itemUnitPrice', 'itemSupplyAmount', 'itemTaxAmount', 'itemRemark', 'excelFilePath', 'originalCreatedAt', 'importedAt']
  } as TableDefinition,
  table109: {
    name: 'promissory_notes',
    displayName: '어음 거래',
    description: 'FinanceHub promissory_notes: 어음(외상매출채권) 전체 내역 (발행/수취)',
    rowCount: 57,
    columnCount: 37,
    columns: ['id', 'sourceId', 'accountId', 'bankId', 'bankName', 'accountNumber', 'noteNumber', 'noteType', 'issuerName', 'issuerRegistrationNumber', 'payeeName', 'amount', 'currency', 'issueDate', 'maturityDate', 'status', 'bankBranch', 'category', 'isManual', 'metaSource', 'metaSerial', 'metaCancellationRequested', 'metaCashLike', 'metaLoanAvailableDate', 'metaLoanExecuted', 'metaLoanAmount', 'metaTaxIssueDate', 'metaDepositAccountNumber', 'metaSeizureAmount', 'metaOriginalNoteAmount', 'metaSeizureClaimant', 'metaRawStatus', 'metaImportSourceFile', 'metaJson', 'originalCreatedAt', 'originalUpdatedAt', 'importedAt']
  } as TableDefinition,
  table110: {
    name: 'input_guardrail',
    displayName: 'Input Guardrails',
    description: '관리자가 설정한 데이터 입력 제한 규칙 테이블',
    columnCount: 9,
    columns: ['id', 'reportId', 'columnName', 'ruleType', 'ruleValue', 'severity', 'errorMessage', 'adminAdvice', 'createdAt']
  } as TableDefinition,
  table111: {
    name: 'department',
    displayName: 'Organization Departments',
    rowCount: 9,
    columnCount: 5,
    columns: ['id', 'name', 'description', 'icon', 'createdAt']
  } as TableDefinition,
  table112: {
    name: 'action_task',
    displayName: 'Action Tasks',
    columnCount: 12,
    columns: ['id', 'instanceId', 'reportId', 'title', 'description', 'type', 'status', 'assigneeId', 'assigneeRole', 'dueAt', 'completedAt', 'createdAt']
  } as TableDefinition,
  table113: {
    name: 'workflow_instance',
    displayName: 'Workflow Instances',
    columnCount: 6,
    columns: ['id', 'templateId', 'triggerRowId', 'status', 'startedAt', 'completedAt']
  } as TableDefinition,
  table114: {
    name: 'workflow_template',
    displayName: 'Workflow Templates',
    columnCount: 6,
    columns: ['id', 'name', 'triggerReportId', 'triggerCondition', 'tasks', 'createdAt']
  } as TableDefinition,
  table115: {
    name: 'notification',
    displayName: 'User Notifications',
    rowCount: 4,
    columnCount: 8,
    columns: ['id', 'userId', 'title', 'message', 'link', 'type', 'isRead', 'createdAt']
  } as TableDefinition,
  table116: {
    name: 'report_row_history',
    displayName: 'Report Row History',
    columnCount: 7,
    columns: ['id', 'rowId', 'oldData', 'newData', 'changeType', 'changedById', 'changedAt']
  } as TableDefinition,
  table117: {
    name: 'report_access',
    displayName: 'Report Access Controls',
    columnCount: 6,
    columns: ['id', 'reportId', 'userId', 'role', 'grantedAt', 'grantedBy']
  } as TableDefinition,
  table118: {
    name: 'report_row',
    displayName: 'Virtual Report Rows',
    columnCount: 9,
    columns: ['id', 'reportId', 'data', 'isDeleted', 'deletedAt', 'creatorId', 'updaterId', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table119: {
    name: 'workflow_steering',
    displayName: 'AI Workflow Steering',
    columnCount: 10,
    columns: ['id', 'reportId', 'rowId', 'eventType', 'recommendation', 'reasoning', 'status', 'decidedById', 'decidedAt', 'createdAt']
  } as TableDefinition,
  table120: {
    name: 'report',
    displayName: 'System Reports',
    rowCount: 100,
    columnCount: 14,
    columns: ['id', 'name', 'sheetName', 'description', 'tableName', 'columns', 'uiConfig', 'aiConfig', 'isDeleted', 'deletedAt', 'ownerId', 'lastSerial', 'createdAt', 'updatedAt']
  } as TableDefinition,
  table121: {
    name: 'user',
    displayName: 'System Users',
    rowCount: 10,
    columnCount: 11,
    columns: ['id', 'username', 'email', 'password', 'role', 'fullName', 'employeeId', 'departmentId', 'position', 'isActive', 'createdAt']
  } as TableDefinition,
  table122: {
    name: 'sync_activity_log',
    displayName: 'sync_activity_log',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 12,
    columns: ['id', 'config_id', 'file_name', 'file_path', 'status', 'rows_imported', 'rows_skipped', 'duplicates_skipped', 'error_message', 'started_at', 'completed_at', 'duration_ms']
  } as TableDefinition,
  table123: {
    name: 'sync_configurations',
    displayName: 'sync_configurations',
    description: 'Imported from user_database_export_2026-04-11.sql',
    columnCount: 24,
    columns: ['id', 'script_folder_path', 'script_name', 'folder_name', 'target_table_id', 'header_row', 'skip_bottom_rows', 'sheet_index', 'column_mappings', 'applied_splits', 'file_action', 'enabled', 'auto_sync_enabled', 'unique_key_columns', 'duplicate_action', 'last_sync_at', 'last_sync_status', 'last_sync_rows_imported', 'last_sync_rows_skipped', 'last_sync_duplicates', 'last_sync_error', 'created_at', 'updated_at', 'source']
  } as TableDefinition,
  table124: {
    name: 'ai_studio_session_persistence',
    displayName: 'AI Studio Session',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table125: {
    name: 'ai_persistence_test',
    displayName: 'AI Persistence Test',
    columnCount: 5,
    columns: ['id', 'userId', 'data', 'updatedAt', 'isDeleted']
  } as TableDefinition,
  table126: {
    name: 'ai_studio_session',
    displayName: 'AI Studio Session',
    rowCount: 1,
    columnCount: 4,
    columns: ['id', 'userId', 'data', 'updatedAt']
  } as TableDefinition,
  table127: {
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
  table1: 'tpl_it_it_policy',
  table2: 'tpl_it_domain_ssl',
  table3: 'tpl_it_access_control',
  table4: 'tpl_it_repair_logs',
  table5: 'tpl_it_server_resources',
  table6: 'tpl_it_backup_history',
  table7: 'tpl_it_security_logs',
  table8: 'tpl_it_accounts',
  table9: 'tpl_it_sw_license',
  table10: 'tpl_it_hw_inventory',
  table11: 'tpl_leg_standard_forms',
  table12: 'tpl_leg_risk_mgmt',
  table13: 'tpl_leg_shareholders_mtg',
  table14: 'tpl_leg_insurance',
  table15: 'tpl_leg_esg_data',
  table16: 'tpl_leg_privacy_check',
  table17: 'tpl_leg_safety_audit',
  table18: 'tpl_leg_licenses',
  table19: 'tpl_leg_patents',
  table20: 'tpl_leg_contracts',
  table21: 'tpl_ops_mail_log',
  table22: 'tpl_ops_task_mgmt',
  table23: 'tpl_ops_visitor_log',
  table24: 'tpl_ops_supplies_request',
  table25: 'tpl_ops_facility_check',
  table26: 'tpl_ops_notices',
  table27: 'tpl_ops_seal_usage',
  table28: 'tpl_ops_vehicle_log',
  table29: 'tpl_ops_office_supplies',
  table30: 'tpl_ops_meeting_minutes',
  table31: 'tpl_cs_defect_reports',
  table32: 'tpl_cs_callback_list',
  table33: 'tpl_cs_loyalty_program',
  table34: 'tpl_cs_product_manuals',
  table35: 'tpl_cs_field_support',
  table36: 'tpl_cs_warranty_data',
  table37: 'tpl_cs_faq_library',
  table38: 'tpl_cs_satisfaction',
  table39: 'tpl_cs_repair_logs',
  table40: 'tpl_cs_tickets',
  table41: 'tpl_pur_cost_reduction',
  table42: 'tpl_pur_sample_request',
  table43: 'tpl_pur_defect_claims',
  table44: 'tpl_pur_contract_mgmt',
  table45: 'tpl_pur_outsourcing',
  table46: 'tpl_pur_rfq_history',
  table47: 'tpl_pur_import_clearance',
  table48: 'tpl_pur_raw_material_prices',
  table49: 'tpl_pur_purchase_orders',
  table50: 'tpl_pur_vendor_eval',
  table51: 'tpl_fin_stock_management',
  table52: 'tpl_fin_tax_invoices',
  table53: 'tpl_fin_external_audit',
  table54: 'tpl_fin_budget_vs_actual',
  table55: 'tpl_fin_cashflow',
  table56: 'tpl_fin_loans',
  table57: 'tpl_fin_accounts_payable',
  table58: 'tpl_fin_assets',
  table59: 'tpl_fin_vat_report',
  table60: 'tpl_fin_card_expenses',
  table61: 'tpl_sales_partnership',
  table62: 'tpl_sales_marketing_eff',
  table63: 'tpl_sales_collections',
  table64: 'tpl_sales_revenue_target',
  table65: 'tpl_sales_competitors',
  table66: 'tpl_sales_customer_contacts',
  table67: 'tpl_sales_orders',
  table68: 'tpl_sales_quotations',
  table69: 'tpl_sales_meetings',
  table70: 'tpl_sales_leads',
  table71: 'tpl_hr_resignation',
  table72: 'tpl_hr_praise_punish',
  table73: 'tpl_hr_benefits',
  table74: 'tpl_hr_performance',
  table75: 'tpl_hr_recruiting',
  table76: 'tpl_hr_training',
  table77: 'tpl_hr_payroll',
  table78: 'tpl_hr_vacation',
  table79: 'tpl_hr_attendance',
  table80: 'tpl_hr_employee_master',
  table81: 'tpl_dist_inventory_survey',
  table82: 'tpl_dist_return_log',
  table83: 'tpl_dist_shipping_cost',
  table84: 'tpl_dist_fleet_mgmt',
  table85: 'tpl_dist_expired_goods',
  table86: 'tpl_dist_warehouse_move',
  table87: 'tpl_dist_delivery_tracker',
  table88: 'tpl_dist_outgoing_log',
  table89: 'tpl_dist_incoming_log',
  table90: 'tpl_dist_inventory_stock',
  table91: 'tpl_mfg_energy_usage',
  table92: 'tpl_mfg_process_leadtime',
  table93: 'tpl_mfg_mold_inventory',
  table94: 'tpl_mfg_defect_analysis',
  table95: 'tpl_mfg_safety_training',
  table96: 'tpl_mfg_machine_maintenance',
  table97: 'tpl_mfg_quality_inspection',
  table98: 'tpl_mfg_work_log',
  table99: 'tpl_mfg_production_order',
  table100: 'tpl_mfg_bom',
  table101: 'system_settings',
  table102: 'master_client_employee',
  table103: 'master_product',
  table104: 'master_client',
  table105: 'workspace_item',
  table106: 'hometax_cash_receipts',
  table107: 'hometax_purchase_invoices',
  table108: 'hometax_sales_invoices',
  table109: 'promissory_notes',
  table110: 'input_guardrail',
  table111: 'department',
  table112: 'action_task',
  table113: 'workflow_instance',
  table114: 'workflow_template',
  table115: 'notification',
  table116: 'report_row_history',
  table117: 'report_access',
  table118: 'report_row',
  table119: 'workflow_steering',
  table120: 'report',
  table121: 'user',
  table122: 'sync_activity_log',
  table123: 'sync_configurations',
  table124: 'ai_studio_session_persistence',
  table125: 'ai_persistence_test',
  table126: 'ai_studio_session',
  table127: 'user_data_files'
} as const;
