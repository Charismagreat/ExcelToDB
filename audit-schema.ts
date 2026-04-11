import { getTableSchema, listTables } from './egdesk-helpers';

async function auditSchema() {
    try {
        console.log('--- Auditing Real DB Schema ---');
        
        const deptsSchema = await getTableSchema('department');
        console.log('Department Schema:', JSON.stringify(deptsSchema, null, 2));

        const tasksSchema = await getTableSchema('action_task');
        console.log('Action Task Schema:', JSON.stringify(tasksSchema, null, 2));

        const reports = await listTables();
        console.log('List Tables Result Type:', typeof reports);
        console.log('List Tables Keys:', Object.keys(reports));
    } catch (err) {
        console.error('Audit failed:', err);
    }
}

auditSchema();
