import { insertRows, queryTable } from './egdesk-helpers';

async function initOrgData() {
    try {
        const existing = await queryTable('department');
        if (existing.length > 0) {
            console.log('Departments already exist.');
            return;
        }

        const depts = [
            { id: 'dept-sales', name: '영업팀', description: '고객사 관리 및 신규 영업', createdAt: new Date().toISOString() },
            { id: 'dept-quality', name: '품질관리팀', description: '제품 품질 검사 및 이슈 대응', createdAt: new Date().toISOString() },
            { id: 'dept-production', name: '생산관리팀', description: '생산 공정 및 납품 관리', createdAt: new Date().toISOString() }
        ];

        await insertRows('department', depts);
        console.log('Initial departments created.');
    } catch (err) {
        console.error('Failed to init departments:', err);
    }
}

initOrgData();
