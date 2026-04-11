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

    // Check if admin_user exists, create if not
    const admins = await queryTable('user', { filters: { username: 'admin_user' } });
    const existingAdmin = admins[0];
    
    if (!existingAdmin) {
        await insertRows('user', [{ 
            id: generateId(),
            username: 'admin_user', 
            role: 'ADMIN', 
            fullName: '초기 관리자', 
            isActive: 1,
            password: hashPassword('admin123!') // 기본 비밀번호 설정
        }]);
    } else if (!existingAdmin.isActive && trimmedUsername === 'admin_user') {
        // Emergency reactivate admin_user if it's the target login and is deactivated
        await updateRows('user', { isActive: 1 }, { filters: { username: 'admin_user' } });
    }

    // Check if employee_user exists, create if not
    const employees = await queryTable('user', { filters: { username: 'employee_user' } });
    const existingEmployee = employees[0];

    if (!existingEmployee) {
        await insertRows('user', [{ 
            id: generateId(),
            username: 'employee_user', 
            role: 'VIEWER', 
            fullName: '테스트 사원', 
            isActive: 1,
            password: hashPassword('employee123!') // 기본 비밀번호 설정
        }]);
    } else if (!existingEmployee.isActive && trimmedUsername === 'employee_user') {
        await updateRows('user', { isActive: 1 }, { filters: { username: 'employee_user' } });
    }

    const users = await queryTable('user', { filters: { username: trimmedUsername } });
    const user = users[0];
    
    if (!user || user.isActive === 0) {
        throw new Error('존재하지 않거나 비활성화된 계정입니다.');
    }

    // 비밀번호 검증 (이미 설정된 비밀번호가 있는 경우)
    if (user.password && password) {
        const isValid = verifyPassword(password, user.password);
        if (!isValid) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }
    } else if (user.password && !password) {
        throw new Error('비밀번호를 입력해 주세요.');
    }

    const cookieStore = await cookies();
    // basePath is used elsewhere in client-side, but here we use root for cookies
    
    cookieStore.set('session_user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/' // Keep as root for cross-path access
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
    
    // 이중 보안 삭제: delete()와 set(maxAge: 0)을 병행하여 브라우저 강제 순응 유도
    const options = { path: '/', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
    
    cookieStore.delete('session_user_id');
    cookieStore.delete('session_user_role');
    
    cookieStore.set('session_user_id', '', options);
    cookieStore.set('session_user_role', '', options);
    
    return { success: true };
}
