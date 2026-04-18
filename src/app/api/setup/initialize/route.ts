import { NextResponse } from 'next/server';
import { SystemConfigService } from '@/lib/services/system-config-service';

/**
 * API to initialize the system settings for a new company.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyName, logoUrl, themeColor, businessContext } = body;

        if (!companyName) {
            return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
        }

        const success = await SystemConfigService.updateSettings({
            companyName,
            logoUrl: logoUrl || '',
            themeColor: themeColor || '#2563eb',
            businessContext: businessContext || '',
            isInitialized: true // Mark as initialized
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to update settings in database' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'System initialized successfully' });
    } catch (error: any) {
        console.error('[InitializeAPI] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
