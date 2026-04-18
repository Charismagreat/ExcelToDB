import { queryTable, updateRows } from '@/egdesk-helpers';

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
            console.error('[SystemConfigService] Failed to fetch settings:', error);
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
