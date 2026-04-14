'use server';

import { cookies } from 'next/headers';
import { queryTable } from '@/egdesk-helpers';

/**
 * 사용자 세션을 가져옵니다. (독립된 세션 액션)
 */
export async function getSessionAction() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log(`[SERVER DEBUG] Total Cookies Received: ${allCookies.length}`);
    allCookies.forEach(c => {
        console.log(`   - Cookie: name=${c.name}, value=${c.name.includes('id') ? c.value : '***'}`);
    });

    const sessionId = cookieStore.get('session_user_id')?.value;
    const sessionRole = cookieStore.get('session_user_role')?.value;

    console.log(`[SERVER DEBUG] Checking session: ID=${sessionId || 'NONE'}, ROLE=${sessionRole || 'NONE'}`);

    if (!sessionId || sessionId === '') {
        return null;
    }

    try {
        const users = await queryTable('user', { filters: { id: String(sessionId) } });
        const user = users[0];

        if (!user || user.isActive === 0) {
            console.log(`[SERVER DEBUG] User not found or inactive for ID: ${sessionId}`);
            return null;
        }

        console.log(`[SERVER DEBUG] Session Verified Case: ${user.username} (${user.role})`);
        return user;
    } catch (err) {
        console.error("[SERVER DEBUG] Session fetch failed:", err);
        return null;
    }
}
