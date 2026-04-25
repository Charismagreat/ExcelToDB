# [Plan] 퍼블리싱 허브 전면 재구축 (마이크로 앱 스튜디오)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 퍼블리싱 허브를 단일 테이블 위저드 방식에서 멀티 테이블 앱 프로젝트 스튜디오 방식으로 전면 재구축하여 데이터 정합성을 완벽히 보장하고 확장성을 확보합니다.

**Architecture:** 
- **App Builder State**: 현재 편집 중인 앱의 메타데이터와 선택된 테이블 목록을 관리하는 중앙 상태 시스템 구축.
- **Preview Engine**: 직접 렌더링 대신 MY DB의 실제 리포트 URL(`/report/[id]`)을 새 탭으로 여는 방식으로 전환하여 100% 정합성 실현.
- **Metadata Sync**: 앱 구성 정보를 서버 액션을 통해 저장하고, 최종 발행 시 워크스페이스 메뉴에 통합.

**Tech Stack:** Next.js (App Router), Server Actions, Tailwind CSS, Lucide Icons, Framer Motion (애니메이션).

---

### Task 1: 데이터 모델 및 기본 액션 정의

**Files:**
- Create: `c:\dev\egdesk_won3\ExcelToDB\src\app\actions\micro-app.ts`

**Step 1: 마이크로 앱 관리를 위한 Server Action 생성**
앱 생성, 테이블 추가/삭제, 앱 목록 조회를 위한 기본 CRUD 액션을 작성합니다.

**Step 2: 커밋**

---

### Task 2: 퍼블리싱 허브 메인 레이아웃 재구축

**Files:**
- Modify: `c:\dev\egdesk_won3\ExcelToDB\src\components\publishing\PublishingHubClient.tsx`
- Create: `c:\dev\egdesk_won3\ExcelToDB\src\components\publishing\AppProjectList.tsx`

**Step 1: 기존 위저드 진입점 대신 앱 프로젝트 리스트 화면 구현**
사용자가 현재 보유한 앱 프로젝트 목록을 보여주고, [+ 새 마이크로 앱 만들기] 버튼이 포함된 메인 UI를 구성합니다.

**Step 2: 커밋**

---

### Task 3: 마이크로 앱 빌더(Studio) 핵심 UI 구현

**Files:**
- Create: `c:\dev\egdesk_won3\ExcelToDB\src\components\publishing\MicroAppStudio.tsx`
- Create: `c:\dev\egdesk_won3\ExcelToDB\src\components\publishing\SourceSelectorModal.tsx`

**Step 1: 3분할 느낌의 스튜디오 레이아웃 구현**
- 상단: 앱 메타데이터 편집 (이름, 아이콘)
- 중앙: 선택된 테이블 카드 리스트
- 모달: 전체 테이블(물리/금융/홈택스) 탐색 및 선택기

**Step 2: 새 탭 미리보기 연동**
각 테이블 카드의 [데이터 확인] 버튼 클릭 시 `window.open('/report/' + tableId, '_blank')`가 작동하도록 구현합니다.

**Step 3: 커밋**

---

### Task 4: 기존 PublishingWizard 제거 및 신규 Studio 연동

**Files:**
- Modify: `c:\dev\egdesk_won3\ExcelToDB\src\app\(dashboard)\publishing\new\page.tsx`
- Delete: `c:\dev\egdesk_won3\ExcelToDB\src\components\publishing\PublishingWizard.tsx`

**Step 1: 새 앱 생성 시 위저드가 아닌 MicroAppStudio로 연결**
기존의 복잡하고 비효율적이었던 `PublishingWizard`를 완전히 제거하고 새로운 스튜디오 경험으로 대체합니다.

**Step 2: 커밋**

---

### Task 5: 최종 발행 로직 및 워크스페이스 통합

**Files:**
- Modify: `c:\dev\egdesk_won3\ExcelToDB\src\app\actions\publishing.ts`

**Step 1: 멀티 테이블을 지원하는 최종 발행 액션 수정**
단일 테이블이 아닌 여러 테이블 정보를 포함하여 마이크로 앱을 정식 발행하고, 사이드바 메뉴에 나타나도록 처리합니다.

**Step 2: 최종 검증 및 커밋**
