'use server';

import { cookies } from 'next/headers';
import { queryTable, insertRows, updateRows } from '@/egdesk-helpers';
import { 
    generateId, 
    hashPassword, 
    verifyPassword 
} from './shared';

/**
 * 사용자 세션을 가져옵니다.
 */
export async function getSessionAction() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;

    if (!userId || userId === '') {
        return null;
    }

    try {
        const users = await queryTable('user', { filters: { id: String(userId) } });
        const user = users[0];

        if (!user || user.isActive === 0) {
            return null;
        }

        return user;
    } catch (err) {
        console.error("Session fetch failed:", err);
        return null;
    }
}

/**
 * 로그인 처리를 수행합니다.
 */
export async function loginAction(username: string, password?: string) {
    const trimmedUsername = username.trim();

    // [보안 지침] 데이터 복구 기간 동안 자동 계정 생성 기능을 비활성화합니다.
    // 기존에 존재하던 admin_user / employee_user 로직은 백업 데이터 복원 후 처리됩니다.

    const users = await queryTable('user', { filters: { username: trimmedUsername } });
    const user = users[0];
    
    if (!user || user.isActive === 0) {
        throw new Error('존재하지 않거나 비활성화된 계정입니다. (복구된 admin 계정으로 로그인해 주세요)');
    }

    // 비밀번호 검증
    if (user.password && password) {
        const isValid = verifyPassword(password, user.password);
        if (!isValid) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }
    } else if (user.password && !password) {
        throw new Error('비밀번호를 입력해 주세요.');
    }

    const cookieStore = await cookies();
    
    cookieStore.set('session_user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/' 
    });

    cookieStore.set('session_user_role', user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
    });

    return { success: true, user };
}

/**
 * 로그아웃 처리를 수행합니다.
 */
export async function logoutAction() {
    const cookieStore = await cookies();
    const options = { path: '/', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
    
    cookieStore.delete('session_user_id');
    cookieStore.delete('session_user_role');
    
    cookieStore.set('session_user_id', '', options);
    cookieStore.set('session_user_role', '', options);
    
    return { success: true };
}
