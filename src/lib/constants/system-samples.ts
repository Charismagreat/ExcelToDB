/**
 * System Sample Data for SME Organizations
 * Used to demonstrate RBAC and workflow features during demo mode.
 * All records include the 'is_sample' tag in metadata for easy purging.
 */

export const SAMPLE_DEPARTMENTS = [
    { id: 'dept-plan', name: '전략기획실', description: 'Business planning and strategy', icon: 'Target' },
    { id: 'dept-sales', name: '국내영업팀', description: 'Domestic sales and CRM', icon: 'Briefcase' },
    { id: 'dept-mfg1', name: '생산1팀(가공)', description: 'Core manufacturing and processing', icon: 'Settings' },
    { id: 'dept-mfg2', name: '생산2팀(조립)', description: 'Assembly and final production', icon: 'Layers' },
    { id: 'dept-qc', name: '품질관리팀', description: 'Quality control and safety', icon: 'ShieldCheck' },
    { id: 'dept-hr', name: '인사총무팀', description: 'Human resources and general affairs', icon: 'Users' },
];

export const SAMPLE_USERS = [
    { 
        id: 'u-ceo', 
        username: 'ceo_demo', 
        fullName: '김대표', 
        role: 'ADMIN', 
        departmentId: 'dept-plan', 
        position: '대표이사', 
        employeeId: 'CEO001' 
    },
    { 
        id: 'u-m1', 
        username: 'manager_mfg', 
        fullName: '이팀장', 
        role: 'EDITOR', 
        departmentId: 'dept-mfg1', 
        position: '팀장', 
        employeeId: 'MFG101' 
    },
    { 
        id: 'u-s1', 
        username: 'staff_mfg', 
        fullName: '박사원', 
        role: 'VIEWER', 
        departmentId: 'dept-mfg1', 
        position: '사원', 
        employeeId: 'MFG102' 
    },
    { 
        id: 'u-sales1', 
        username: 'sales_star', 
        fullName: '최영업', 
        role: 'EDITOR', 
        departmentId: 'dept-sales', 
        position: '과장', 
        employeeId: 'SAL001' 
    },
    { 
        id: 'u-hr1', 
        username: 'hr_admin', 
        fullName: '정무명', 
        role: 'EDITOR', 
        departmentId: 'dept-hr', 
        position: '차장', 
        employeeId: 'HR001' 
    },
];

export const SAMPLE_TAG = JSON.stringify({ is_sample: true });
