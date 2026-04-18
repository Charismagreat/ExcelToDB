/**
 * Sample Dashboard Chart Configurations
 * These charts are automatically pinned to the dashboard when the Industry Suite is installed.
 */

export interface DemoChartConfig {
    title: string;
    type: 'bar' | 'pie' | 'line' | 'table';
    tableId: string;
    span: 'half' | 'full';
    xAxis?: string;
    series: Array<{ key: string, name: string, color?: string }>;
    description: string;
    refreshMetadata: {
        tool: string;
        args: any;
        mapping: any;
    };
}

export const DEMO_DASHBOARD_CHARTS: DemoChartConfig[] = [
    // -------------------------------------------------------------------
    // MANUFACTURING DASHBOARD
    // -------------------------------------------------------------------
    {
        title: "실시간 생산 공정 목표 달성률 ($TODAY)",
        type: "bar",
        tableId: "tpl_mfg_work_log",
        span: "half",
        xAxis: "label",
        series: [{ key: "value", name: "실생산수량", color: "#3b82f6" }],
        description: "오늘 기준 각 작업자별 생산 실적과 목표 대비 달성 현황을 분석한 리포트입니다.",
        refreshMetadata: {
            tool: "get_aggregated_report_data",
            args: {
                tableId: "tpl_mfg_work_log",
                groupByKey: "worker_name",
                sumKey: "actual_quantity"
            },
            mapping: { label: "label", value: "value" }
        }
    },
    {
        title: "공정별 불량 발생 비중 분석",
        type: "pie",
        tableId: "tpl_mfg_work_log",
        span: "half",
        series: [{ key: "value", name: "불량수" }],
        description: "작업 과정에서 발생한 불량 데이터를 집계하여 품질 관리 우선순위를 제안합니다.",
        refreshMetadata: {
            tool: "get_aggregated_report_data",
            args: {
                tableId: "tpl_mfg_work_log",
                groupByKey: "worker_name",
                sumKey: "defect_count"
            },
            mapping: { label: "label", value: "value" }
        }
    },

    // -------------------------------------------------------------------
    // DISTRIBUTION & SALES DASHBOARD
    // -------------------------------------------------------------------
    {
        title: "창고별 재고 자산 가치 현황",
        type: "bar",
        tableId: "tpl_dist_inventory_stock",
        span: "half",
        xAxis: "label",
        series: [{ key: "value", name: "현재고량", color: "#10b981" }],
        description: "전사 창고에 분산된 주요 품목들의 재고 레벨을 시각화합니다.",
        refreshMetadata: {
            tool: "get_aggregated_report_data",
            args: {
                tableId: "tpl_dist_inventory_stock",
                groupByKey: "warehouse_id",
                sumKey: "current_qty"
            },
            mapping: { label: "label", value: "value" }
        }
    },
    {
        title: "월간 매출 목표 대비 달성 현황",
        type: "bar",
        tableId: "tpl_sales_revenue_target",
        span: "half",
        xAxis: "label",
        series: [
            { key: "target", name: "목표액", color: "#94a3b8" },
            { key: "actual", name: "실적액", color: "#f59e0b" }
        ],
        description: "이번 달 세일즈 목표와 현재까지의 실제 매출액을 비교 분석합니다.",
        refreshMetadata: {
            tool: "get_aggregated_report_data",
            args: {
                tableId: "tpl_sales_revenue_target",
                groupByKey: "month",
                sumKey: "actual"
            },
            mapping: { 
                label: "month", 
                target: "target", 
                actual: "actual" 
            }
        }
    },

    // -------------------------------------------------------------------
    // HR & OPERATIONS (TABLE WIDGETS)
    // -------------------------------------------------------------------
    {
        title: "부서별 인원 구성 현황",
        type: "pie",
        tableId: "tpl_hr_employee_master",
        span: "half",
        series: [{ key: "value", name: "인원수" }],
        description: "조직 내 부서별 인력 배치 현황을 시각화한 지표입니다.",
        refreshMetadata: {
            tool: "get_aggregated_report_data",
            args: {
                tableId: "tpl_hr_employee_master",
                groupByKey: "dept",
                sumKey: "emp_id" // count logic in tool
            },
            mapping: { label: "label", value: "value" }
        }
    },
    {
        title: "주요 법인카드 지출 상세 (Top 5)",
        type: "table",
        tableId: "tpl_fin_card_expenses",
        span: "full",
        series: [
            { key: "date", name: "결제일" },
            { key: "merchant", name: "가맹점" },
            { key: "amount", name: "금액" },
            { key: "user", name: "사용자" }
        ],
        description: "가장 최근에 발생한 법인카드 지출 내역 중 주요 항목을 대시보드에 요약 표시합니다.",
        refreshMetadata: {
            tool: "query_workspace_table",
            args: {
                tableId: "tpl_fin_card_expenses",
                limit: 5
            },
            mapping: {
                date: "date",
                merchant: "merchant",
                amount: "amount",
                user: "user"
            }
        }
    }
];
