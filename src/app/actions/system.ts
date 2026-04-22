'use server';

import { SystemConfigService, SystemSettings } from '@/lib/services/system-config-service';
import { getSessionAction } from './auth';
import { revalidatePath } from 'next/cache';

/**
 * ⚙️ 전역 시스템 설정 조회
 */
export async function getSystemSettingsAction() {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    return await SystemConfigService.getSettings();
}

/**
 * 💾 전역 시스템 설정 업데이트
 */
export async function updateSystemSettingsAction(updates: Partial<SystemSettings>) {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') throw new Error('권한 부족');

    const success = await SystemConfigService.updateSettings(updates);
    if (success) {
        revalidatePath('/');
        revalidatePath('/dashboard');
    }
    return { success };
}
