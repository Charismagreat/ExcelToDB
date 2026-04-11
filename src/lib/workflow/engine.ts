import { queryTable, insertRows } from '@/egdesk-helpers';

/**
 * 워크플로우 템플릿의 변수를 실제 데이터 값으로 치환합니다.
 * 예: "품번 {{part_no}} 입고됨" -> "품번 ABC-123 입고됨"
 */
function substituteVariables(template: string, data: any): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match;
    });
}

/**
 * 특정 레포트에 데이터가 추가될 때 워크플로우를 실행합니다.
 */
export async function triggerWorkflow(reportId: string, rowData: any, creatorId: string) {
    console.log(`[Workflow Engine] Triggering for Report: ${reportId}`);

    try {
        // 1. 해당 레포트에 걸려있는 워크플로우 템플릿 조회
        const templates = await queryTable('workflow_template', { 
            filters: { triggerReportId: reportId } 
        });

        if (templates.length === 0) {
            console.log(`[Workflow Engine] No templates found for report ${reportId}`);
            return;
        }

        for (const template of templates) {
            // 2. 트리거 조건 검사 (간단한 JSON 기반 조건 판별)
            let isTriggered = false;
            try {
                if (!template.triggerCondition || template.triggerCondition === '*') {
                    isTriggered = true;
                } else {
                    const condition = JSON.parse(template.triggerCondition);
                    // 예: { "status": "불량" }
                    isTriggered = Object.keys(condition).every(key => 
                        String(rowData[key]) === String(condition[key])
                    );
                }
            } catch (e) {
                console.warn(`[Workflow Engine] Condition parsing failed for template ${template.id}`, e);
                isTriggered = true; // 조건 파싱 실패 시 기본적으로 실행
            }

            if (!isTriggered) continue;

            console.log(`[Workflow Engine] Template matched: ${template.name}`);

            // 3. 워크플로우 인스턴스 생성
            const instanceId = `wf-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            await insertRows('workflow_instance', [{
                id: instanceId,
                templateId: template.id,
                triggerRowId: rowData.id || 'N/A',
                status: 'RUNNING',
                startedAt: new Date().toISOString()
            }]);

            // 4. 정의된 태스크(Tasks) 생성
            if (template.tasks) {
                const taskTemplates = JSON.parse(template.tasks);
                const tasksToInsert = taskTemplates.map((t: any, idx: number) => ({
                    id: `task-${Date.now()}-${idx}`,
                    instanceId: instanceId,
                    title: substituteVariables(t.title, rowData),
                    description: substituteVariables(t.description || '', rowData),
                    type: t.type || 'TASK',
                    status: 'TODO',
                    assigneeId: t.assigneeId || 'UNASSIGNED',
                    assigneeRole: t.assigneeRole || 'MANAGER',
                    dueAt: t.dueDays ? new Date(Date.now() + (t.dueDays * 86400000)).toISOString() : null
                }));

                await insertRows('action_task', tasksToInsert);
                console.log(`[Workflow Engine] ${tasksToInsert.length} tasks created for instance ${instanceId}`);
            }
        }
    } catch (err) {
        console.error('[Workflow Engine] Error during execution:', err);
    }
}
