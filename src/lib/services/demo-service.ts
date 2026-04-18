import { 
    createTable, 
    insertRows, 
    queryTable, 
    deleteRows, 
    listTables 
} from '@/egdesk-helpers';
import { SAMPLE_DEPARTMENTS, SAMPLE_USERS, SAMPLE_TAG } from '@/lib/constants/system-samples';
import { INDUSTRY_TEMPLATES } from '@/lib/constants/industry-templates';
import { SYSTEM_TABLES } from '@/app/actions/shared';

/**
 * Service to manage the lifecycle of demo/sample data.
 */
export class DemoService {
    
    /**
     * One-click installation of the full industry suite + organizational samples.
     */
    static async initializeDemoSetup() {
        console.log('[DemoService] Starting Full Suite Initialization...');
        
        // 1. Initialize Departments
        console.log('[DemoService] Creating Departments...');
        const deptRows = SAMPLE_DEPARTMENTS.map(d => ({
            ...d,
            metadata: SAMPLE_TAG,
            createdAt: new Date().toISOString()
        }));
        await insertRows('department', deptRows);

        // 2. Initialize Sample Users
        console.log('[DemoService] Creating Sample Users...');
        const userRows = SAMPLE_USERS.map(u => ({
            ...u,
            isActive: 1,
            metadata: SAMPLE_TAG,
            createdAt: new Date().toISOString()
        }));
        await insertRows('user', userRows);

        // 3. Create 100 Industry Tables & Inject Samples
        console.log('[DemoService] Creating Industry Tables...');
        for (const tpl of INDUSTRY_TEMPLATES) {
            try {
                // Prepare columns
                const columns = tpl.schema.map(col => ({
                    name: col.name,
                    type: col.type,
                    notNull: col.notNull || false
                }));

                // Ensure metadata column is always there
                if (!columns.find(c => c.name === 'metadata')) {
                    columns.push({ name: 'metadata', type: 'TEXT', notNull: false });
                }

                // Create Table
                await createTable({
                    tableName: tpl.id,
                    columns: columns
                });

                // Inject Sample Data if available
                if (tpl.initialData && tpl.initialData.length > 0) {
                    await insertRows(tpl.id, tpl.initialData);
                }
            } catch (err) {
                console.warn(`[DemoService] Failed to create table ${tpl.id}:`, err);
            }
        }

        console.log('[DemoService] Full Suite Initialization Complete!');
        return { success: true };
    }

    /**
     * One-click Purge of all sample data to transition to LIVE mode.
     */
    static async purgeAllSampleData() {
        console.log('[DemoService] Starting Global Sample Purge...');
        
        // Get all tables in the database
        const tables = await listTables();
        const results = [];

        for (const table of tables) {
            try {
                // We use a safe query to find rows with is_sample tag
                // Since SQLite doesn't have native JSON path indexing in all versions, 
                // we use a simple LIKE check on the text column as a safety measure.
                
                // 1. Count samples first (optional, but good for reporting)
                const samples = await queryTable(table, {
                    // Logic: metadata LIKE '%"is_sample":true%'
                    // Note: egdesk-helpers filters are usually exact match. 
                    // If exact match doesn't work for JSON strings, we might need a custom query helper.
                    // For now, let's assume standard filtering logic or a scan-and-purge approach.
                });

                // Real Filter (In-memory for small tables, or we can add 'where' raw support)
                const targetIds = samples
                    .filter(row => {
                        try {
                            const meta = JSON.parse(row.metadata || '{}');
                            return meta.is_sample === true;
                        } catch (e) { return false; }
                    })
                    .map(row => row.id);

                if (targetIds.length > 0) {
                    for (const id of targetIds) {
                        await deleteRows(table, { id });
                    }
                    results.push({ table, deleted: targetIds.length });
                }
            } catch (err) {
                console.warn(`[DemoService] Skipping table ${table} during purge:`, err);
            }
        }

        console.log('[DemoService] Global Sample Purge Complete!', results);
        return { success: true, results };
    }
}

/**
 * Server Action wrappers for the DemoService
 */
export async function initializeDemoSetupAction() {
    return await DemoService.initializeDemoSetup();
}

export async function purgeAllSampleDataAction() {
    return await DemoService.purgeAllSampleData();
}
