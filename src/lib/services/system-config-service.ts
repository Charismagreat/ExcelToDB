import { queryTable, updateRows, listTables } from '@/egdesk-helpers';

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
            const tables: any[] = await listTables();
            const tableExists = tables.some(t => 
                (typeof t === 'string' && t === 'system_settings') || 
                (t.name === 'system_settings')
            );

            if (!tableExists) {
                // Table doesn't exist yet, which is expected during initial setup
                return null;
            }

            const rows: any = await queryTable('system_settings', { 
                filters: { id: this.SETTINGS_ID } 
            });
            
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
     */
    static async updateSettings(updates: Partial<SystemSettings>): Promise<boolean> {
        try {
            const dataToUpdate: any = { ...updates };
            
            // Convert boolean to numeric for SQLite if needed
            if (updates.isInitialized !== undefined) {
                dataToUpdate.isInitialized = updates.isInitialized ? 1 : 0;
            }
            
            dataToUpdate.updatedAt = new Date().toISOString();

            await updateRows('system_settings', dataToUpdate, { 
                filters: { id: this.SETTINGS_ID } 
            });
            return true;
        } catch (error) {
            console.error('[SystemConfigService] Failed to update settings:', error);
            return false;
        }
    }
}
