import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const userIdCookie = request.cookies.get('session_user_id');
    const roleCookie = request.cookies.get('session_user_role');
    const pathname = request.nextUrl.pathname;

    const isAuthenticated = !!userIdCookie?.value;
    const role = roleCookie?.value;

    // Public Assets & Next.js internal paths: Bypass middleware
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // like favicon.ico, images, etc.
    ) {
        return NextResponse.next();
    }

    // 1. 공통 접근 제어 - 비로그인 시 /login으로 무조건 리다이렉트
    if (!isAuthenticated && pathname !== '/login') {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // 2. 이미 로그인한 사용자가 로그인 페이지 접근 시
    if (isAuthenticated && pathname === '/login') {
        if (role === 'EMPLOYEE') {
            return NextResponse.redirect(new URL('/workspace', request.url));
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 3. 역할(Role) 기반 라우팅 제한
    if (isAuthenticated) {
        if (role === 'EMPLOYEE') {
            // EMPLOYEE는 오직 /workspace 하위 경로만 접근 가능
            if (!pathname.startsWith('/workspace')) {
                return NextResponse.redirect(new URL('/workspace', request.url));
            }
        } else {
            // ADMIN, EDITOR 등은 기존 CEO 대시보드(/) 및 모든 경로 접근 가능하지만
            // 혹시라도 EMPLOYEE 전용 앱 기능을 테스트하고 싶다면 /workspace 접근도 허용
            // 특별한 제약 설정 없음
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
