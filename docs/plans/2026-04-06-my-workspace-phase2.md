# 마이 워크스페이스 Phase 2 (고도화 단계) 개발 계획서

이 문서는 `main` 브랜치를 체크아웃하여 마이 워크스페이스(My Workspace) 고도화 개발을 이어나갈 개발자를 위한 가이드 및 실행 계획입니다. 이 플랜을 실행하려면 **Antigravity single-flow-task-execution** 스킬이나 **executing-plans** 스킬을 활용하여 순차적으로 작업을 진행하세요.

## 1. 현재 구현 상태 (Phase 1 완료 사항)
- **RBAC 라우팅 제한**: `proxy.ts`에 미들웨어 로직이 통합되어 사원(`employee_user`)과 관리자(`admin_user`) 간의 권한 및 라우트(/workspace vs /) 격리가 완료되었습니다.
- **모바일 셸 UI**: Bottom Navigation, 컨테이너 레이아웃 등이 완료되었습니다.
- **메인 피드 뼈대 (Mock)**: `WorkspacePage`와 `FeedCard` 컴포넌트가 존재하며 하드코딩된 모의 데이터를 렌더링 중입니다.
- **AI 입력 오버레이 (Zero-UI)**: 화면에 고정된 `SmartFAB`을 클릭하면 음성/사진을 입력할 수 있는 폼 오버레이가 올라오도록 구현되었습니다.
- **더미 액션(Actions)**: `submitWorkspaceDataAction` 서버 엑션이 존재하나, 입력 정보를 EGDesk 물리 데이터베이스에 삽입하는 과정은 하드코딩 / Mock 딜레이 상태입니다.

---

## 2. Phase 2 개발 목표 및 방향성
Phase 2의 핵심 과제는 **"Mock 데이터 제거 및 실제 시스템과의 완전한 결합"**입니다. 특히 AI가 비정형 입력(음성/사진)을 EGDesk의 동적 스키마에 맞춰 정형 데이터로 완벽하게 변환하여 물리 테이블에 적재하는 파이프라인을 완성해야 합니다.

---

## 3. 세부 작업 목록 (Task List)

### Task 1: 메인 피드 뷰의 실제 데이터 바인딩
**목표**: `src/app/workspace/page.tsx` 내의 하드코딩된 피드를 실제 EGDesk 데이터로 교체합니다.
- **작업 1-1**: `src/egdesk-helpers.ts`의 `queryTable` 함수 등을 사용해, 전체 공지사항이나 사원에게 배정된 최신 '보고서 열(Report Rows)' 데이터 상위 20개를 불러옵니다.
- **작업 1-2**: 불러온 데이터를 가공하여 `FeedCard` 컴포넌트의 Props 형식에 맞게 치환(Mapping)합니다.

### Task 2: AI 파이프라인 연계 및 정형화 로직 고도화
**목표**: `src/app/workspace/actions.ts`의 `submitWorkspaceDataAction`을 실제 백엔드 AI 툴과 연결합니다.
- **작업 2-1**: 기존에 구현된 `extractDataFromImage` (`src/lib/ai-vision.ts`) 및 `runAITool`을 호출하도록 주석 처리된 부분을 활성화합니다.
- **작업 2-2**: 사용자로부터 입력된 텍스트와 사진을 AI에 전달하여, **"어떤 데이블에"**, **"어떤 컬럼들(key-value)을"** 넣어야 할 지 판단하게 하는 시스템 프롬프트(Tool Calling 체계)를 확립합니다.
- **작업 2-3**: AI가 추출한 최종 JSON 데이터를 `egdesk-helpers.ts`의 `insertRows()` 함수에 넘겨 물리 DB에 실시간 저장합니다.

### Task 3: 양방향 상호작용 피드백 (다이얼로그 핑퐁) 적용
**목표**: 사원의 음성/최초 입력 정보가 불충분할 경우, 오버레이 UI 상에서 추가 정보를 되묻는 기능을 구현합니다.
- **작업 3-1**: AI 모델이 필수 필드 값이 부족하다고 반환(`MISSING_FIELD`)할 경우, `AiInputOverlay.tsx`에서 에러 처리 대신 "현장 위치가 어디입니까?" 같은 추가 질문을 화면에 띄우도록 상태를 관리합니다.
- **작업 3-2**: 대화형(Multi-turn) 방식으로 데이터를 마저 수집한 뒤 서버 액션에 재요청하는 로직을 추가합니다.

### Task 4: 실시간 사내 알림 연동 (Slack / Notification)
**목표**: 스마트 입력 완료 시 관련 부서나 관리자의 대시보드(혹은 Slack)로 통보가 가도록 연동합니다.
- **작업 4-1**: 기존 `src/lib/notifications.ts`의 `notifyNewDataRow` 함수를 재활용하여 모바일 환경에서의 데이터 삽입 성공률과 알림을 통합 테스트합니다.
- **작업 4-2**: 성공적으로 물리 DB에 삽입 완료 시 모바일 환경에 적절한 Toast 애니메이션이나 햅틱/오디오 피드백을 주어 체감 UX를 높입니다.

---

## 4. 환경 변수 및 의존성 규칙
- 모든 DB 접근(쿼리/삽입)은 프론트엔드 직접 호출이 아닌 `src/egdesk-helpers.ts` 래퍼 함수를 반드시 사용해야 합니다.
- `proxy.ts`에 정의된 RBAC 로직은 손상시키지 않고 유지해 주세요.
- 향후 추가되는 모든 Next.js 라우트는 컴포넌트 최상단에서 `await getSessionAction()`을 필수로 체크해야 합니다.
