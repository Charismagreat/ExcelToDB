/**
 * SME Industry-Standard Table Templates (100 Items)
 * Categorized by business domains for SME Manufacturing and Distribution.
 * Each schema includes the mandatory 'metadata' column.
 */

export interface TableTemplate {
    id: string;
    category: string;
    displayName: string;
    description: string;
    schema: Array<{
        name: string;
        type: 'TEXT' | 'INTEGER' | 'REAL' | 'DATE';
        displayName: string;
        notNull?: boolean;
    }>;
    initialData?: any[]; // 샘플 데이터셋
}

export const INDUSTRY_TEMPLATES: TableTemplate[] = [
    // -------------------------------------------------------------------
    // CATEGORY 1: MANUFACTURING (제조)
    // -------------------------------------------------------------------
    {
        id: 'tpl_mfg_bom',
        category: 'Manufacturing',
        displayName: '제품 부품 구성표 (BOM)',
        description: 'Bill of Materials for products. 제품을 구성하는 자재 및 부품 목록입니다.',
        schema: [
            { name: 'product_code', type: 'TEXT', displayName: '제품코드', notNull: true },
            { name: 'material_name', type: 'TEXT', displayName: '자재명', notNull: true },
            { name: 'quantity', type: 'REAL', displayName: '소요량' },
            { name: 'unit', type: 'TEXT', displayName: '단위' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { product_code: 'SMART-001', material_name: '메인보드 모듈', quantity: 1, unit: 'EA', metadata: JSON.stringify({ is_sample: true }) },
            { product_code: 'SMART-001', material_name: '알루미늄 바디', quantity: 1, unit: 'EA', metadata: JSON.stringify({ is_sample: true }) },
            { product_code: 'SMART-001', material_name: '고정용 나사 M3', quantity: 12, unit: 'EA', metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    {
        id: 'tpl_mfg_production_order',
        category: 'Manufacturing',
        displayName: '생산 작업지시서',
        description: 'Daily or weekly production orders issues to factory floors.',
        schema: [
            { name: 'order_no', type: 'TEXT', displayName: '지시번호', notNull: true },
            { name: 'target_date', type: 'DATE', displayName: '지시일자' },
            { name: 'product_name', type: 'TEXT', displayName: '생산제품명' },
            { name: 'target_quantity', type: 'INTEGER', displayName: '목표수량' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { order_no: 'PO-2026-001', target_date: '2026-04-20', product_name: '스마트 센서 v2', target_quantity: 500, metadata: JSON.stringify({ is_sample: true }) },
            { order_no: 'PO-2026-002', target_date: '2026-04-21', product_name: 'IoT 컨트롤러', target_quantity: 200, metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    {
        id: 'tpl_mfg_work_log',
        category: 'Manufacturing',
        displayName: '작업 실적 일지',
        description: 'Records of actual work done on the factory floor.',
        schema: [
            { name: 'work_date', type: 'DATE', displayName: '작업일자', notNull: true },
            { name: 'worker_name', type: 'TEXT', displayName: '작업자' },
            { name: 'actual_quantity', type: 'INTEGER', displayName: '실생산수량' },
            { name: 'defect_count', type: 'INTEGER', displayName: '불량수' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { work_date: '2026-04-18', worker_name: '박철수', actual_quantity: 120, defect_count: 2, metadata: JSON.stringify({ is_sample: true }) },
            { work_date: '2026-04-18', worker_name: '이미영', actual_quantity: 115, defect_count: 0, metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    {
        id: 'tpl_mfg_quality_inspection',
        category: 'Manufacturing',
        displayName: '품질 검사 보고서',
        description: 'Quality checks and safety audits for produced goods.',
        schema: [
            { name: 'inspection_date', type: 'DATE', displayName: '검사일시' },
            { name: 'inspector', type: 'TEXT', displayName: '검사자' },
            { name: 'result', type: 'TEXT', displayName: '검사결과(Pass/Fail)' },
            { name: 'defect_reason', type: 'TEXT', displayName: '불량사유' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { inspection_date: '2026-04-18', inspector: '김품질', result: 'Pass', defect_reason: '', metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    {
        id: 'tpl_mfg_machine_maintenance',
        category: 'Manufacturing',
        displayName: '설비 점검 및 수리 대장',
        description: 'Records of equipment maintenance and repairs.',
        schema: [
            { name: 'machine_id', type: 'TEXT', displayName: '설비ID' },
            { name: 'check_date', type: 'DATE', displayName: '점검일자' },
            { name: 'repair_cost', type: 'REAL', displayName: '수리비용' },
            { name: 'status', type: 'TEXT', displayName: '가동상태' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { machine_id: 'CNC-01', check_date: '2026-04-15', repair_cost: 0, status: '정상', metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    { id: 'tpl_mfg_safety_training', category: 'Manufacturing', displayName: '안전 교육 기록', description: 'Safety training logs.', schema: [{ name: 'training_date', type: 'DATE', displayName: '교육일' }, { name: 'topic', type: 'TEXT', displayName: '교육주제' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ training_date: '2026-04-10', topic: '공장 안전 수칙 교육', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_mfg_defect_analysis', category: 'Manufacturing', displayName: '불량 원인 분석 대장', description: 'Detailed defect analysis.', schema: [{ name: 'item_name', type: 'TEXT', displayName: '품목' }, { name: 'root_cause', type: 'TEXT', displayName: '원인' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_mfg_mold_inventory', category: 'Manufacturing', displayName: '금형 자산 관리', description: 'Inventory of molds.', schema: [{ name: 'mold_no', type: 'TEXT', displayName: '금형번호' }, { name: 'location', type: 'TEXT', displayName: '보관위치' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_mfg_process_leadtime', category: 'Manufacturing', displayName: '공정 리드타임 측정', description: 'Lead time analysis.', schema: [{ name: 'process_name', type: 'TEXT', displayName: '공정명' }, { name: 'avg_time', type: 'REAL', displayName: '평균시간(분)' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_mfg_energy_usage', category: 'Manufacturing', displayName: '공장 에너지 사용량', description: 'Utility usage logs.', schema: [{ name: 'date', type: 'DATE', displayName: '날짜' }, { name: 'usage_kwh', type: 'REAL', displayName: '사용량(kWh)' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 2: DISTRIBUTION (유통)
    // -------------------------------------------------------------------
    {
        id: 'tpl_dist_inventory_stock',
        category: 'Distribution',
        displayName: '전사 재고 현황',
        description: 'Tracking stock levels across warehouses.',
        schema: [
            { name: 'warehouse_id', type: 'TEXT', displayName: '창고ID' },
            { name: 'item_name', type: 'TEXT', displayName: '품목명', notNull: true },
            { name: 'current_qty', type: 'INTEGER', displayName: '현재고' },
            { name: 'safety_qty', type: 'INTEGER', displayName: '적정재고' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { warehouse_id: 'WH-A1', item_name: '고급 와인 750ml', current_qty: 450, safety_qty: 100, metadata: JSON.stringify({ is_sample: true }) },
            { warehouse_id: 'WH-B1', item_name: '수입 원두 10kg', current_qty: 12, safety_qty: 20, metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    {
        id: 'tpl_dist_incoming_log',
        category: 'Distribution',
        displayName: '물품 입고 일지',
        description: 'Log of incoming goods and materials.',
        schema: [
            { name: 'incoming_date', type: 'DATE', displayName: '입고일자' },
            { name: 'supplier', type: 'TEXT', displayName: '공급처' },
            { name: 'item_name', type: 'TEXT', displayName: '입고품목' },
            { name: 'qty', type: 'INTEGER', displayName: '입고수량' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { incoming_date: '2026-04-18', supplier: '글로벌 유통', item_name: '박스 포장재 L', qty: 1000, metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    {
        id: 'tpl_dist_outgoing_log',
        category: 'Distribution',
        displayName: '물품 출고 일지',
        description: 'Log of outgoing orders to customers.',
        schema: [
            { name: 'outgoing_date', type: 'DATE', displayName: '출하일자' },
            { name: 'customer_name', type: 'TEXT', displayName: '고객사' },
            { name: 'item_name', type: 'TEXT', displayName: '출고품목' },
            { name: 'qty', type: 'INTEGER', displayName: '출고수량' },
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ],
        initialData: [
            { outgoing_date: '2026-04-18', customer_name: '우리동네 카페', item_name: '수입 원두 10kg', qty: 5, metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    { id: 'tpl_dist_delivery_tracker', category: 'Distribution', displayName: '배송 추적 현황', description: 'Shipping status tracking.', schema: [{ name: 'invoice_no', type: 'TEXT', displayName: '송장번호' }, { name: 'status', type: 'TEXT', displayName: '배송상태' }, { name: 'recipient', type: 'TEXT', displayName: '수령인' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_dist_warehouse_move', category: 'Distribution', displayName: '창고간 이동 내역', description: 'Internal stock movement.', schema: [{ name: 'from_wh', type: 'TEXT', displayName: '출발지' }, { name: 'to_wh', type: 'TEXT', displayName: '도착지' }, { name: 'qty', type: 'INTEGER', displayName: '수량' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_dist_expired_goods', category: 'Distribution', displayName: '유통기한/폐기 대장', description: 'Expired goods tracking.', schema: [{ name: 'item_name', type: 'TEXT', displayName: '품목' }, { name: 'expiry_date', type: 'DATE', displayName: '유통기한' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_dist_fleet_mgmt', category: 'Distribution', displayName: '운송 차량 관리', description: 'Vehicle management.', schema: [{ name: 'vehicle_no', type: 'TEXT', displayName: '차량번호' }, { name: 'driver', type: 'TEXT', displayName: '운전원' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_dist_shipping_cost', category: 'Distribution', displayName: '운송비 정산 대장', description: 'Shipping cost analysis.', schema: [{ name: 'delivery_id', type: 'TEXT', displayName: '배송ID' }, { name: 'cost', type: 'REAL', displayName: '운송비' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_dist_return_log', category: 'Distribution', displayName: '반품/교환 대장', description: 'Returns and exchanges.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객사' }, { name: 'reason', type: 'TEXT', displayName: '반품사유' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_dist_inventory_survey', category: 'Distribution', displayName: '재고 실사 기록', description: 'Stocktaking logs.', schema: [{ name: 'survey_date', type: 'DATE', displayName: '실사일' }, { name: 'actual_qty', type: 'INTEGER', displayName: '실사수량' }, { name: 'diff', type: 'INTEGER', displayName: '차이' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 3: HR & PEOPLE (인사/노무)
    // -------------------------------------------------------------------
    { id: 'tpl_hr_employee_master', category: 'HR', displayName: '사원 명부', description: 'Employee directory.', schema: [{ name: 'emp_id', type: 'TEXT', displayName: '사번' }, { name: 'name', type: 'TEXT', displayName: '성명' }, { name: 'dept', type: 'TEXT', displayName: '부서' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ emp_id: 'HRM-001', name: '홍길동', dept: '경영지원팀', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_hr_attendance', category: 'HR', displayName: '일일 근태 기록', description: 'Daily attendance logs.', schema: [{ name: 'date', type: 'DATE', displayName: '날짜' }, { name: 'emp_name', type: 'TEXT', displayName: '사원명' }, { name: 'check_in', type: 'TEXT', displayName: '출근시간' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ date: '2026-04-18', emp_name: '홍길동', check_in: '08:55', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_hr_vacation', category: 'HR', displayName: '연차/휴가 신청', description: 'Vacation requests.', schema: [{ name: 'emp_name', type: 'TEXT', displayName: '사원명' }, { name: 'start_date', type: 'DATE', displayName: '시작일' }, { name: 'days', type: 'REAL', displayName: '사용일수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_payroll', category: 'HR', displayName: '급여 지급 대장', description: 'Payroll history.', schema: [{ name: 'month', type: 'TEXT', displayName: '지급월' }, { name: 'base_salary', type: 'REAL', displayName: '기본급' }, { name: 'total_pay', type: 'REAL', displayName: '총지급액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_training', category: 'HR', displayName: '교육 이수 현황', description: 'Employee training.', schema: [{ name: 'course_name', type: 'TEXT', displayName: '과정명' }, { name: 'completion_date', type: 'DATE', displayName: '이수일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_recruiting', category: 'HR', displayName: '채용 후보자 관리', description: 'Recruiting pipeline.', schema: [{ name: 'candidate', type: 'TEXT', displayName: '후보자' }, { name: 'position', type: 'TEXT', displayName: '지원직무' }, { name: 'status', type: 'TEXT', displayName: '전형상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_performance', category: 'HR', displayName: '인사 고과 평정', description: 'Performance reviews.', schema: [{ name: 'year', type: 'TEXT', displayName: '연도' }, { name: 'emp_name', type: 'TEXT', displayName: '사원명' }, { name: 'grade', type: 'TEXT', displayName: '등급' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_benefits', category: 'HR', displayName: '복리후생 지원금', description: 'Employee benefits.', schema: [{ name: 'type', type: 'TEXT', displayName: '구분' }, { name: 'amount', type: 'REAL', displayName: '지원금액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_praise_punish', category: 'HR', displayName: '포상 및 징계 기록', description: 'Discipline and rewards.', schema: [{ name: 'emp_name', type: 'TEXT', displayName: '사원명' }, { name: 'type', type: 'TEXT', displayName: '구분' }, { name: 'reason', type: 'TEXT', displayName: '사유' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_hr_resignation', category: 'HR', displayName: '퇴직자 관리', description: 'Offboarding logs.', schema: [{ name: 'emp_name', type: 'TEXT', displayName: '사원명' }, { name: 'resign_date', type: 'DATE', displayName: '퇴사일' }, { name: 'reason', type: 'TEXT', displayName: '퇴회사유' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 4: SALES & CRM (영업/고객)
    // -------------------------------------------------------------------
    { id: 'tpl_sales_leads', category: 'Sales', displayName: '영업 기회(Leads)', description: 'Sales pipeline monitoring.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객사' }, { name: 'value', type: 'REAL', displayName: '예상규모' }, { name: 'probability', type: 'INTEGER', displayName: '가능성(%)' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ customer: '대형 유통 그룹', value: 50000000, probability: 70, metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_sales_meetings', category: 'Sales', displayName: '영업 상담 일지', description: 'Meeting logs.', schema: [{ name: 'customer', type: 'TEXT', displayName: '상담처' }, { name: 'summary', type: 'TEXT', displayName: '상담내용' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_sales_quotations', category: 'Sales', displayName: '견적서 발행 이력', description: 'Quotation tracking.', schema: [{ name: 'quote_no', type: 'TEXT', displayName: '견적번호' }, { name: 'total_amount', type: 'REAL', displayName: '견적총액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_sales_orders', category: 'Sales', displayName: '수주/주문 대장', description: 'Confirmed orders.', schema: [{ name: 'order_no', type: 'TEXT', displayName: '주문번호' }, { name: 'amount', type: 'REAL', displayName: '주문액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_sales_customer_contacts', category: 'Sales', displayName: '거래처 담당자 명부', description: 'Contact list.', schema: [{ name: 'company', type: 'TEXT', displayName: '회사명' }, { name: 'person', type: 'TEXT', displayName: '담당자' }, { name: 'phone', type: 'TEXT', displayName: '연락처' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_sales_competitors', category: 'Sales', displayName: '경쟁사 동향 분석', description: 'Market intelligence.', schema: [{ name: 'competitor', type: 'TEXT', displayName: '경쟁사' }, { name: 'intel', type: 'TEXT', displayName: '특이사항' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { 
        id: 'tpl_sales_revenue_target', 
        category: 'Sales', 
        displayName: '매출 목표 대비 실적', 
        description: 'Performance vs Target.', 
        schema: [
            { name: 'month', type: 'TEXT', displayName: '해당월' }, 
            { name: 'target', type: 'REAL', displayName: '목표액' }, 
            { name: 'actual', type: 'REAL', displayName: '실적액' }, 
            { name: 'metadata', type: 'TEXT', displayName: '기타정보' }
        ], 
        initialData: [
            { month: '2026-03', target: 500000000, actual: 485000000, metadata: JSON.stringify({ is_sample: true }) },
            { month: '2026-04', target: 550000000, actual: 520000000, metadata: JSON.stringify({ is_sample: true }) }
        ]
    },
    { id: 'tpl_sales_collections', category: 'Sales', displayName: '수금/채권 관리', description: 'Accounts receivable tracking.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객사' }, { name: 'unpaid', type: 'REAL', displayName: '미수금액' }, { name: 'due_date', type: 'DATE', displayName: '입금예정일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_sales_marketing_eff', category: 'Sales', displayName: '마케팅 캠페인 효율', description: 'Marketing ROI.', schema: [{ name: 'campaign', type: 'TEXT', displayName: '캠페인명' }, { name: 'lead_count', type: 'INTEGER', displayName: '리드수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_sales_partnership', category: 'Sales', displayName: '전략적 제휴 이력', description: 'Partnerships.', schema: [{ name: 'partner', type: 'TEXT', displayName: '제휴사' }, { name: 'scope', type: 'TEXT', displayName: '협력범위' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 5: FINANCE & ACCOUNTING (재무/회계)
    // -------------------------------------------------------------------
    { id: 'tpl_fin_card_expenses', category: 'Finance', displayName: '법인카드 경비 내역', description: 'Corporate card spending.', schema: [{ name: 'date', type: 'DATE', displayName: '결제일' }, { name: 'merchant', type: 'TEXT', displayName: '가맹점' }, { name: 'amount', type: 'REAL', displayName: '금액' }, { name: 'user', type: 'TEXT', displayName: '사용자' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ date: '2026-04-18', merchant: '스타벅스 강남점', amount: 12500, user: '이과장', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_fin_vat_report', category: 'Finance', displayName: '부가세 신고 기초 자료', description: 'VAT filing basics.', schema: [{ name: 'invoice_date', type: 'DATE', displayName: '발행일' }, { name: 'supply_value', type: 'REAL', displayName: '공급가액' }, { name: 'tax', type: 'REAL', displayName: '세액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_assets', category: 'Finance', displayName: '고정 자산 대장', description: 'Fixed assets inventory.', schema: [{ name: 'asset_id', type: 'TEXT', displayName: '자산번호' }, { name: 'name', type: 'TEXT', displayName: '자산명' }, { name: 'purchase_price', type: 'REAL', displayName: '취득가액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_accounts_payable', category: 'Finance', displayName: '외상매입금(AP) 관리', description: 'Accounts payable.', schema: [{ name: 'supplier', type: 'TEXT', displayName: '공급처' }, { name: 'amount', type: 'REAL', displayName: '미지급액' }, { name: 'pay_date', type: 'DATE', displayName: '지급예정일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_loans', category: 'Finance', displayName: '대출 및 금융 부채', description: 'Loans and debts.', schema: [{ name: 'bank', type: 'TEXT', displayName: '금융기관' }, { name: 'principal', type: 'REAL', displayName: '원금' }, { name: 'interest_rate', type: 'REAL', displayName: '이율(%)' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_cashflow', category: 'Finance', displayName: '일일 자금 수지 현황', description: 'Daily cash flow.', schema: [{ name: 'date', type: 'DATE', displayName: '날짜' }, { name: 'income', type: 'REAL', displayName: '입금총액' }, { name: 'expense', type: 'REAL', displayName: '출금총액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_budget_vs_actual', category: 'Finance', displayName: '예산 대비 집행 실적', description: 'Budget monitoring.', schema: [{ name: 'dept', type: 'TEXT', displayName: '부서' }, { name: 'budget', type: 'REAL', displayName: '예산액' }, { name: 'used', type: 'REAL', displayName: '집행액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_external_audit', category: 'Finance', displayName: '외부 감사 대응 이력', description: 'Audit history.', schema: [{ name: 'year', type: 'TEXT', displayName: '연도' }, { name: 'auditor', type: 'TEXT', displayName: '감사인' }, { name: 'findings', type: 'TEXT', displayName: '주요사항' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_tax_invoices', category: 'Finance', displayName: '세금계산서 발행 대장', description: 'Issued tax invoices.', schema: [{ name: 'invoice_no', type: 'TEXT', displayName: '계산서번호' }, { name: 'customer', type: 'TEXT', displayName: '공급받는자' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_fin_stock_management', category: 'Finance', displayName: '주주 및 자본금 변동', description: 'Shareholder registry.', schema: [{ name: 'shareholder', type: 'TEXT', displayName: '주주명' }, { name: 'shares', type: 'INTEGER', displayName: '주식수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 6: PURCHASE & SOURCING (구매/조달)
    // -------------------------------------------------------------------
    { id: 'tpl_pur_vendor_eval', category: 'Purchase', displayName: '협력업체 평가 기록', description: 'Supplier rating.', schema: [{ name: 'vendor_name', type: 'TEXT', displayName: '업체명' }, { name: 'score', type: 'INTEGER', displayName: '평가점수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_purchase_orders', category: 'Purchase', displayName: '구매 발주 대장', description: 'PO management.', schema: [{ name: 'po_no', type: 'TEXT', displayName: '발주번호' }, { name: 'vendor', type: 'TEXT', displayName: '발주처' }, { name: 'amount', type: 'REAL', displayName: '발주금액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_raw_material_prices', category: 'Purchase', displayName: '원자재 시세 기록', description: 'Material market price.', schema: [{ name: 'item', type: 'TEXT', displayName: '품목' }, { name: 'market_price', type: 'REAL', displayName: '시장단가' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_import_clearance', category: 'Purchase', displayName: '수입 통관 진행 현황', description: 'Import tracking.', schema: [{ name: 'bl_no', type: 'TEXT', displayName: 'B/L번호' }, { name: 'status', type: 'TEXT', displayName: '통관상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_rfq_history', category: 'Purchase', displayName: 'RFQ(견적요청) 이력', description: 'RFQ logs.', schema: [{ name: 'project', type: 'TEXT', displayName: '프로젝트' }, { name: 'vendor_count', type: 'INTEGER', displayName: '참여업체수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_outsourcing', category: 'Purchase', displayName: '외주 가공 요청서', description: 'Outsourcing orders.', schema: [{ name: 'vendor', type: 'TEXT', displayName: '외주처' }, { name: 'item', type: 'TEXT', displayName: '가공품목' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_contract_mgmt', category: 'Purchase', displayName: '구매 계약 관리', description: 'Purchasing contracts.', schema: [{ name: 'vendor', type: 'TEXT', displayName: '업체명' }, { name: 'expiry', type: 'DATE', displayName: '만료일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_defect_claims', category: 'Purchase', displayName: '자재 불량 클레임', description: 'Defect claims to vendors.', schema: [{ name: 'vendor', type: 'TEXT', displayName: '업체명' }, { name: 'reason', type: 'TEXT', displayName: '불량사유' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_sample_request', category: 'Purchase', displayName: '샘플 구매 및 검토', description: 'Samples evaluation.', schema: [{ name: 'item', type: 'TEXT', displayName: '품목' }, { name: 'decision', type: 'TEXT', displayName: '채택여부' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_pur_cost_reduction', category: 'Purchase', displayName: '원가 절감 활동 기록', description: 'Cost reduction efforts.', schema: [{ name: 'activity', type: 'TEXT', displayName: '활동명' }, { name: 'saving', type: 'REAL', displayName: '절감액' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 7: CS & CUSTOMER SUCCESS (고객지원)
    // -------------------------------------------------------------------
    { id: 'tpl_cs_tickets', category: 'CustomerSuccess', displayName: '고객 문의(Ticket) 관리', description: 'Support ticket tracking.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객명' }, { name: 'subject', type: 'TEXT', displayName: '제목' }, { name: 'status', type: 'TEXT', displayName: '상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ customer: '우리전자 서비스', subject: '전원 버튼 함몰 건', status: '진행중', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_cs_repair_logs', category: 'CustomerSuccess', displayName: 'AS 수리 일지', description: 'After-sales service logs.', schema: [{ name: 'product', type: 'TEXT', displayName: '제품명' }, { name: 'repair_summary', type: 'TEXT', displayName: '수리내역' }, { name: 'cost', type: 'REAL', displayName: '수리비' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_satisfaction', category: 'CustomerSuccess', displayName: '고객 만족도 조사', description: 'Customer feedback survey.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객' }, { name: 'score', type: 'INTEGER', displayName: '만족도점수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_faq_library', category: 'CustomerSuccess', displayName: '자주 묻는 질문(FAQ) DB', description: 'FAQ knowledge base.', schema: [{ name: 'question', type: 'TEXT', displayName: '질문' }, { name: 'answer', type: 'TEXT', displayName: '답변' }, { name: 'category', type: 'TEXT', displayName: '분류' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_warranty_data', category: 'CustomerSuccess', displayName: '제품 보증 및 워런티', description: 'Warranty records.', schema: [{ name: 'serial_no', type: 'TEXT', displayName: '시리얼번호' }, { name: 'expiry', type: 'DATE', displayName: '보증만료일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_field_support', category: 'CustomerSuccess', displayName: '현장 파견 지원 기록', description: 'On-site support logs.', schema: [{ name: 'customer', type: 'TEXT', displayName: '방문처' }, { name: 'work_done', type: 'TEXT', displayName: '지원내용' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_product_manuals', category: 'CustomerSuccess', displayName: '매뉴얼 버전 관리', description: 'Manual versioning.', schema: [{ name: 'product', type: 'TEXT', displayName: '제품' }, { name: 'version', type: 'TEXT', displayName: '버전' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_loyalty_program', category: 'CustomerSuccess', displayName: '우수 고객 관리', description: 'VIP program.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객명' }, { name: 'grade', type: 'TEXT', displayName: '등급' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_callback_list', category: 'CustomerSuccess', displayName: '콜백/해피콜 대장', description: 'Follow-up calls.', schema: [{ name: 'customer', type: 'TEXT', displayName: '고객명' }, { name: 'result', type: 'TEXT', displayName: '통화결과' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_cs_defect_reports', category: 'CustomerSuccess', displayName: '고객 발굴 제품 결함', description: 'Customer discovered bugs.', schema: [{ name: 'product', type: 'TEXT', displayName: '제품' }, { name: 'issue', type: 'TEXT', displayName: '이슈내역' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 8: INTERNAL OPERATIONS (총무/운영)
    // -------------------------------------------------------------------
    { id: 'tpl_ops_meeting_minutes', category: 'Operations', displayName: '회의록 및 결정사항', description: 'Meeting minutes.', schema: [{ name: 'date', type: 'DATE', displayName: '날짜' }, { name: 'title', type: 'TEXT', displayName: '회의명' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ date: '2026-04-18', title: '주간 업무 보고 회의', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_ops_office_supplies', category: 'Operations', displayName: '비품/소모품 관리', description: 'Office supplies.', schema: [{ name: 'item', type: 'TEXT', displayName: '비품명' }, { name: 'stock', type: 'INTEGER', displayName: '재고' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_vehicle_log', category: 'Operations', displayName: '업무용 차량 운행 일지', description: 'Car usage logs.', schema: [{ name: 'date', type: 'DATE', displayName: '날짜' }, { name: 'destination', type: 'TEXT', displayName: '목적지' }, { name: 'mileage', type: 'INTEGER', displayName: '주행거리' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_seal_usage', category: 'Operations', displayName: '법인 인감 날인 대장', description: 'Seal usage log.', schema: [{ name: 'date', type: 'DATE', displayName: '일시' }, { name: 'use_case', type: 'TEXT', displayName: '날인용도' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_notices', category: 'Operations', displayName: '사내 공지 사항', description: 'Internal notices.', schema: [{ name: 'title', type: 'TEXT', displayName: '제목' }, { name: 'content', type: 'TEXT', displayName: '공지내용' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_facility_check', category: 'Operations', displayName: '시설물 안전 점검표', description: 'Facility safety check.', schema: [{ name: 'facility', type: 'TEXT', displayName: '시설물' }, { name: 'status', type: 'TEXT', displayName: '상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_supplies_request', category: 'Operations', displayName: '비품 구매 신청서', description: 'Supply requests.', schema: [{ name: 'requester', type: 'TEXT', displayName: '신청자' }, { name: 'item', type: 'TEXT', displayName: '품목' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_visitor_log', category: 'Operations', displayName: '외부인 방문 기록', description: 'Visitor logs.', schema: [{ name: 'visitor', type: 'TEXT', displayName: '방문객' }, { name: 'purpose', type: 'TEXT', displayName: '방문목적' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_task_mgmt', category: 'Operations', displayName: '부서별 업무 관리(To-Do)', description: 'Task board.', schema: [{ name: 'task', type: 'TEXT', displayName: '할일' }, { name: 'assignee', type: 'TEXT', displayName: '담당자' }, { name: 'status', type: 'TEXT', displayName: '상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_ops_mail_log', category: 'Operations', displayName: '우편/택배 수발신 대장', description: 'Mail logs.', schema: [{ name: 'is_incoming', type: 'INTEGER', displayName: '수신여부' }, { name: 'sender', type: 'TEXT', displayName: '보낸이' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 9: LEGAL & COMPLIANCE (법무/인증)
    // -------------------------------------------------------------------
    { id: 'tpl_leg_contracts', category: 'Legal', displayName: '중요 계약서 대장', description: 'Legal contracts registry.', schema: [{ name: 'partner', type: 'TEXT', displayName: '거래처' }, { name: 'end_date', type: 'DATE', displayName: '계약종료일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ partner: '강남 법무법인', end_date: '2027-12-31', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_leg_patents', category: 'Legal', displayName: '특허 및 지식재산권', description: 'Intellectual property.', schema: [{ name: 'title', type: 'TEXT', displayName: '명칭' }, { name: 'status', type: 'TEXT', displayName: '등록상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_licenses', category: 'Legal', displayName: '사업 면허/인허가 관리', description: 'Licenses monitoring.', schema: [{ name: 'license_name', type: 'TEXT', displayName: '면허명' }, { name: 'expiry', type: 'DATE', displayName: '갱신일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_safety_audit', category: 'Legal', displayName: '정기 소방/안전 진단', description: 'Safety audits.', schema: [{ name: 'audit_date', type: 'DATE', displayName: '진단일' }, { name: 'score', type: 'INTEGER', displayName: '점수' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_privacy_check', category: 'Legal', displayName: '개인정보 보호 자가점검', description: 'Privacy compliance.', schema: [{ name: 'check_item', type: 'TEXT', displayName: '점검항목' }, { name: 'is_ok', type: 'INTEGER', displayName: '준수여부' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_esg_data', category: 'Legal', displayName: 'ESG 경영 공시 데이터', description: 'ESG data collection.', schema: [{ name: 'metric', type: 'TEXT', displayName: '지표명' }, { name: 'value', type: 'REAL', displayName: '측정값' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_insurance', category: 'Legal', displayName: '기업 보험 가입 현황', description: 'Insurance policies.', schema: [{ name: 'type', type: 'TEXT', displayName: '보험종류' }, { name: 'premium', type: 'REAL', displayName: '보험료' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_shareholders_mtg', category: 'Legal', displayName: '이사회/주총 의사록', description: 'Board meetings.', schema: [{ name: 'date', type: 'DATE', displayName: '개최일' }, { name: 'resolutions', type: 'TEXT', displayName: '결정사항' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_risk_mgmt', category: 'Legal', displayName: '리스크 관리 대장', description: 'Risk register.', schema: [{ name: 'risk_item', type: 'TEXT', displayName: '리스크요소' }, { name: 'level', type: 'TEXT', displayName: '위험등급' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_leg_standard_forms', category: 'Legal', displayName: '사외 표준 문서 양식집', description: 'Templates catalog.', schema: [{ name: 'form_name', type: 'TEXT', displayName: '양식명' }, { name: 'version', type: 'TEXT', displayName: '버전' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },

    // -------------------------------------------------------------------
    // CATEGORY 10: IT & DIGITAL (IT 자산)
    // -------------------------------------------------------------------
    { id: 'tpl_it_hw_inventory', category: 'IT', displayName: 'PC 및 하드웨어 자산', description: 'IT hardware management.', schema: [{ name: 'asset_no', type: 'TEXT', displayName: '자산번호' }, { name: 'user', type: 'TEXT', displayName: '사용자' }, { name: 'spec', type: 'TEXT', displayName: '사양' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }], initialData: [{ asset_no: 'HW-NB-001', user: '홍길동', spec: 'MacBook Pro 16', metadata: JSON.stringify({ is_sample: true }) }] },
    { id: 'tpl_it_sw_license', category: 'IT', displayName: 'SW 라이선스 현황', description: 'Software license tracking.', schema: [{ name: 'sw_name', type: 'TEXT', displayName: 'SW명' }, { name: 'exp_date', type: 'DATE', displayName: '만료일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_accounts', category: 'IT', displayName: '시스템 계정 및 권한', description: 'User account management.', schema: [{ name: 'user_id', type: 'TEXT', displayName: '계정ID' }, { name: 'permissions', type: 'TEXT', displayName: '권한그룹' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_security_logs', category: 'IT', displayName: '보안 사고 및 탐지 일지', description: 'Security incident logs.', schema: [{ name: 'date', type: 'DATE', displayName: '일시' }, { name: 'event', type: 'TEXT', displayName: '탐지사건' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_backup_history', category: 'IT', displayName: '백업 및 복구 테스트', description: 'Backup verification.', schema: [{ name: 'backup_date', type: 'DATE', displayName: '백업일' }, { name: 'status', type: 'TEXT', displayName: '상태' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_server_resources', category: 'IT', displayName: '서버/클라우드 자원 현황', description: 'Cloud resource tracking.', schema: [{ name: 'resource_name', type: 'TEXT', displayName: '자원명' }, { name: 'cost_last_month', type: 'REAL', displayName: '전월비용' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_repair_logs', category: 'IT', displayName: 'IT 기기 수리 및 교체 이력', description: 'IT repair logs.', schema: [{ name: 'asset_id', type: 'TEXT', displayName: '자산ID' }, { name: 'reason', type: 'TEXT', displayName: '수리사유' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_access_control', category: 'IT', displayName: '전산실 출입 기록', description: 'Server room access.', schema: [{ name: 'visitor', type: 'TEXT', displayName: '출입자' }, { name: 'in_out', type: 'TEXT', displayName: '입출내역' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_domain_ssl', category: 'IT', displayName: '도메인 및 SSL 관리', description: 'Domain/SSL renewal.', schema: [{ name: 'domain', type: 'TEXT', displayName: '도메인' }, { name: 'expiry', type: 'DATE', displayName: '만료일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
    { id: 'tpl_it_it_policy', category: 'IT', displayName: 'IT 보안 정책 및 가이드', description: 'IT policy library.', schema: [{ name: 'policy_name', type: 'TEXT', displayName: '정책명' }, { name: 'last_update', type: 'DATE', displayName: '개정일' }, { name: 'metadata', type: 'TEXT', displayName: '기타정보' }] },
];
