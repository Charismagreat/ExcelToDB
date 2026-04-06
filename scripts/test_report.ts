import { queryTable, listTables } from '../src/egdesk-helpers';

async function main() {
    try {
        const allReports = await queryTable('report', { limit: 100 });
        console.log('All reports count:', allReports.length);
        console.log('First report:', allReports[0]);
        
        const activeReports = await queryTable('report', { filters: { isDeleted: '0' }});
        console.log('Active reports count (isDeleted = "0"):', activeReports.length);
        
        const activeReportsNum = await queryTable('report', { filters: { isDeleted: 0 as any }});
        console.log('Active reports count (isDeleted = 0):', activeReportsNum.length);
        
        const tables = await listTables();
        console.log('System tables count:', tables?.tables?.length);
    } catch (e) {
        console.error(e);
    }
}
main();
