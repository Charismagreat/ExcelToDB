# My Workspace Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 원컨덕터 사원을 위한 '마이 워크스페이스' 앱(Zero-UI 폰 기반, 피드/할일 중심, EGDesk 연동)을 구축합니다.

**Architecture:** 기존 `ExcelToDB` Next.js 앱 내부에 `/workspace` 경로를 만들고, 세션 기반 RBAC(Role-Based Access Control)를 적용하여 관리자와 사원을 분리합니다.

**Tech Stack:** Next.js, TailwindCSS, Lucide React, EGDesk MCP, AI Vision/Text APIs

---

### Task 1: 인증 및 RBAC 미들웨어 보강

**Files:**
- Modify: `src/app/actions.ts` (로그인 시 Role 주입 로직)
- Modify: `src/middleware.ts` (라우트 보호 로직 변경/생성, 없으면 `middleware.ts` 신규 생성)

**Step 1: Role 기반 로그인 구현**
기존 로그인(단일 계정) 구조에 `admin_user` 외에 `employee_user` 인증을 추가하고, 발급되는 쿠키 세션에 `role: 'admin' | 'employee'` 속성을 포함합니다.

**Step 2: 라우팅 접근 제어 미들웨어**
Next.js `middleware.ts`를 사용해 `/dashboard`는 `admin` 롤만, `/workspace`는 `admin` 및 `employee` 모두 접근 가능하도록 리다이렉트 필터를 추가합니다.

**Step 3: Commit**
```bash
git add src/app/actions.ts src/middleware.ts
git commit -m "feat: add RBAC for admin and employee roles"
```

### Task 2: 모바일 셸 (바텀 네비게이션 및 레이아웃)

**Files:**
- Create: `src/app/workspace/layout.tsx`
- Create: `src/components/workspace/BottomNav.tsx`

**Step 1: BottomNav 컴포넌트 생성**
홈, 검색, 내 근태 등을 포함하는 고정형 모바일 하단 탭 바(Lucide React 아이콘 활용)를 만듭니다.

**Step 2: Workspace Layout 구성**
`min-h-screen`, `pb-16`(바텀 네비게이션 여백)의 모바일 최적화 컨테이너로 `children`을 감싸는 전용 레이아웃을 구성합니다.

**Step 3: Commit**
```bash
git add src/app/workspace/layout.tsx src/components/workspace/BottomNav.tsx
git commit -m "feat: build mobile shell layout with bottom navigation"
```

### Task 3: 메인 피드 뷰 (할 일 및 공지)

**Files:**
- Create: `src/app/workspace/page.tsx`
- Create: `src/components/workspace/FeedCard.tsx`

**Step 1: Feed 카드 디자인**
인스타그램 피드 스타일로 시인성이 좋은 맞춤형 Task 카드(예: 품질 이상 보고, 안전 체크) 컴포넌트를 구현합니다.

**Step 2: 메인 화면 적용**
Mock 데이터를 사용해 세로 스크롤이 가능한 피드 목록을 메인 페이지에 렌더링합니다.

**Step 3: Commit**
```bash
git add src/app/workspace/page.tsx src/components/workspace/FeedCard.tsx
git commit -m "feat: implement main feed view for workspace"
```

### Task 4: 스마트 FAB 및 오버레이 (Zero-UI 인터페이스)

**Files:**
- Create: `src/components/workspace/SmartFAB.tsx`
- Create: `src/components/workspace/AiInputOverlay.tsx`

**Step 1: FAB 컴포넌트 생성**
화면 우측 하단에 상시 떠 있는 강력한 시각적 포인트(예: 마이크/카메라 통합 버튼)를 제작하여 `layout.tsx` 또는 `page.tsx`에 배치합니다.

**Step 2: 풀스크린 오버레이 구현**
FAB 탭 시 화면 전체를 어둡게 또는 밝게 덮새 씌우고 마이크(음성 인식)/카메라(이미지 첨부) 입력 모드로 즉시 전환되는 상태 처리 컴포넌트 완성.

**Step 3: Commit**
```bash
git add src/components/workspace/SmartFAB.tsx src/components/workspace/AiInputOverlay.tsx
git commit -m "feat: add smart FAB and zero-UI AI input overlay"
```

### Task 5: AI 파이프라인 및 EGDesk 연동

**Files:**
- Create: `src/app/workspace/actions.ts`

**Step 1: 오버레이 데이터 전송**
오버레이에서 획득한 음성 인식 결과(텍스트) 또는 이미지(Base64)를 서버 액션에 전달하는 로직 추가.

**Step 2: AI 분석 및 EGDesk DB 저장**
`dashboard-ai.ts` 로직을 호출하여 입력값을 정형화하고, 완성된 레코드를 `egdesk-helpers.ts`를 통해 `user_data_sql_query`로 넘겨 DB에 영구 저장합니다.

**Step 3: Commit**
```bash
git add src/app/workspace/actions.ts src/components/workspace/AiInputOverlay.tsx
git commit -m "feat: integrate AI input with EGDesk database"
```
