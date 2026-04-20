import { queryTable, updateRows, listTables, createTable, insertRows } from '@/egdesk-helpers';

export interface SystemSettings {
    id: string;
    companyName: string;
    logoUrl: string;
    themeColor: string;
    businessContext: string;
    isInitialized: boolean;
    updatedAt: string;
}

/**
 * Service to manage system-wide settings for white-labeling and onboarding.
 */
export class SystemConfigService {
    private static readonly SETTINGS_ID = 'global-settings';

    /**
     * Retrieve the global system settings.
     */
    static async getSettings(): Promise<SystemSettings | null> {
        try {
            // First, check if the table exists to avoid unnecessary 500 logs during setup
            const result = await listTables();
            const tables = Array.isArray(result) ? result : (result?.tables || []);
            const tableExists = tables.some((t: any) => 
                (typeof t === 'string' && t === 'system_settings') || 
                (t.tableName === 'system_settings') ||
                (t.name === 'system_settings')
            );

            if (!tableExists) {
                // Table doesn't exist yet, which is expected during initial setup
                return null;
            }

            const queryResult: any = await queryTable('system_settings', { 
                filters: { id: this.SETTINGS_ID } 
            });
            
            const rows = Array.isArray(queryResult) ? queryResult : (queryResult?.rows || []);
            const settings = rows[0] || null;
            if (settings) {
                // SQLite uses 0/1 for booleans; convert to native boolean
                settings.isInitialized = Number(settings.isInitialized) === 1;
            }
            return settings;
        } catch (error) {
            // Only log if it's not a missing table issue (already handled above)
            // But we keep this catch for other potential connection issues
            console.warn('[SystemConfigService] Could not fetch settings. This is normal during initial setup.');
            return null;
        }
    }

    /**
     * Update the global system settings.
     * Ensures the table and initial row exist before updating.
     */
    static async updateSettings(updates: Partial<SystemSettings>): Promise<boolean> {
        try {
            // 1. Ensure the table exists
            let result;
            try {
                result = await listTables();
            } catch (e: any) {
                throw new Error(`listTables failed: ${e.message}`);
            }

            const tables = Array.isArray(result) ? result : (result?.tables || []);
            const tableExists = tables.some((t: any) => 
                (typeof t === 'string' && t === 'system_settings') || 
                (t.tableName === 'system_settings') ||
                (t.name === 'system_settings')
            );

            if (!tableExists) {
                console.log('[SystemConfigService] system_settings table missing, creating...');
                try {
                // Create the table if it's missing
                await createTable('System Settings', [
                    { name: 'id', type: 'TEXT', notNull: true },
                    { name: 'companyName', type: 'TEXT' },
                    { name: 'logoUrl', type: 'TEXT' },
                    { name: 'themeColor', type: 'TEXT' },
                    { name: 'businessContext', type: 'TEXT' },
                    { name: 'isInitialized', type: 'INTEGER', defaultValue: 0 },
                    { name: 'updatedAt', type: 'TEXT' }
                ], { tableName: 'system_settings' });
                } catch (e: any) {
                    throw new Error(`createTable(system_settings) failed: ${e.message}`);
                }
                console.log('[SystemConfigService] Created missing system_settings table');
            }

            // 2. Prepare data for update
            const dataToUpdate: any = { ...updates };
            if (updates.isInitialized !== undefined) {
                dataToUpdate.isInitialized = updates.isInitialized ? 1 : 0;
            }
            dataToUpdate.updatedAt = new Date().toISOString();

            console.log('[SystemConfigService] Checking for existing record with ID:', this.SETTINGS_ID);
            
            // 3. Check if the record already exists
            let queryResult;
            try {
                queryResult = await queryTable('system_settings', { 
                    filters: { id: this.SETTINGS_ID } 
                });
            } catch (e: any) {
                throw new Error(`queryTable(system_settings) failed: ${e.message}`);
            }

            const rows = Array.isArray(queryResult) ? queryResult : (queryResult?.rows || []);
            
            if (rows && rows.length > 0) {
                console.log('[SystemConfigService] Record exists, updating...');
                // Update existing record
                try {
                    await updateRows('system_settings', dataToUpdate, { 
                        filters: { id: this.SETTINGS_ID } 
                    });
                } catch (e: any) {
                    throw new Error(`updateRows(system_settings) failed: ${e.message}`);
                }
            } else {
                console.log('[SystemConfigService] Record missing, inserting...');
                // Insert new record
                dataToUpdate.id = this.SETTINGS_ID;
                // Add default theme if missing for the first insertion
                if (dataToUpdate.themeColor === undefined) {
                    dataToUpdate.themeColor = '#2563eb';
                }
                try {
                    await insertRows('system_settings', [dataToUpdate]);
                } catch (e: any) {
                    throw new Error(`insertRows(system_settings) failed: ${e.message}`);
                }
            }

            return true;
        } catch (error: any) {
            console.error('[SystemConfigService] Failed to update settings:', error);
            return false;
        }
    }
}

