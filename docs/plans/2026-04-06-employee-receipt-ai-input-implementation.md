# Employee Receipt AI Input Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 기업 사원이 마이 워크스페이스에서 영수증 사진을 찍으면 AI가 자동으로 테이블을 찾아 데이터를 채워주고, 사용자가 확인 및 수정 후 저장하는 Zero-UI 입력 시스템을 구축합니다.

**Architecture:** 
1. `src/app/workspace/actions.ts`에 이미지 기반 테이블 매칭 및 세부 데이터 추출 서버 액션을 구현합니다.
2. `src/components/workspace/AiInputOverlay.tsx`에서 AI가 채워준 데이터에 대한 수동 수정 인터페이스를 제공합니다.
3. `src/app/actions.ts`의 기존 `addRowAction` 및 `generateContentHash` 로직을 재사용하여 데이터 저장 및 중복 방지를 처리합니다.

**Tech Stack:** Next.js Server Actions, AI Vision API (GPT-4o), TailwindCSS

---

### Task 1: AI 이미지 분석 및 테이블 매칭 서버 액션 고도화

**Files:**
- Modify: `src/app/workspace/actions.ts`

**Step 1: 테이블 목록 조회 및 시스템 프롬프트 구성**
현재 사용 가능한 모든 보고서 목록을 조회하여 AI에게 컨텍스트로 전달하는 로직을 작성합니다.

**Step 2: AI 이미지 분석 함수 업데이트**
`extractDataFromImage`를 호출할 때 테이블 리스트를 함께 넘겨, 사진에 가장 적합한 `reportId`와 매핑된 `rowData` JSON을 받도록 구현합니다.

**Step 3: Commit**
```bash
git add src/app/workspace/actions.ts
git commit -m "feat: implement AI table discovery and data extraction"
```

### Task 2: 자동 채움 및 수동 수정 UI (Overlay 확장)

**Files:**
- Modify: `src/components/workspace/AiInputOverlay.tsx`

**Step 1: 로딩 및 결과 상태 추가**
사진 촬영 직후 "AI가 분석 중..." 상태를 표시하고, 분석 완료 시 데이터를 편집할 수 있는 폼 모드로 전환합니다.

**Step 2: 동적 입력 필드 생성**
AI가 선택한 테이블의 스키마를 가져와, 각 칼럼에 매칭된 데이터를 보여주는 `Input` 필드들을 렌더링합니다. (사원이 직접 수정 가능)

**Step 3: Commit**
```bash
git add src/components/workspace/AiInputOverlay.tsx
git commit -m "feat: add editable auto-fill form to AI overlay"
```

### Task 3: 중복 체크 및 최종 저장 로직 통합

**Files:**
- Modify: `src/app/workspace/actions.ts` (submitWorkspaceDataAction)

**Step 1: 중복 데이터 검증 연동**
`addRowAction` 호출 전 `generateContentHash`를 통해 동일 영수증 데이터의 중복 여부를 체크하고 경고를 띄웁니다.

**Step 2: 실제 DB 저장 파이프라인 활성화**
Mock 데이터 처리를 제거하고, 실제 `report_row` 및 물리 테이블에 `insertRows`를 호출하도록 완성합니다.

**Step 3: Commit**
```bash
git add src/app/workspace/actions.ts
git commit -m "feat: integrate final saving with duplication check"
```

### Task 4: 사용자 경험 폴리싱 (햅틱 및 애니메이션)

**Files:**
- Modify: `src/components/workspace/AiInputOverlay.tsx`

**Step 1: 햅틱 및 시각 피드백 추가**
저장 성공 시 브라우저 내장 `vibrate` API를 사용해 짧은 진동을 주고, 모달이 닫히며 피드로 돌아가는 애니메이션을 부드럽게 구현합니다.

**Step 2: Commit**
```bash
git add src/components/workspace/AiInputOverlay.tsx
git commit -m "style: add haptic and visual feedback for save success"
```

## Verification Plan

### Automated Tests
- `src/lib/ai-vision.ts` 테스트 스크립트를 작성하여 샘플 영수증 이미지가 올바른 테이블 ID를 찾아내는지 검증합니다.

### Manual Verification
1. 관리자로 로그인하여 '법인카드 영수증' 테이블을 엑셀 업로드로 생성.
2. 사원으로 로그인하여 마이 워크스페이스 접속.
3. 카메라 오버레이를 열고 영수증 사진 촬영.
4. AI가 자동으로 '법인카드 영수증' 테이블을 매칭하고 날짜, 금액을 채워주는지 확인.
5. 금액을 '15,000'에서 '16,000'으로 수동 수정한 뒤 제출.
6. 실제 '법인카드 영수증' 테이블에 수정한 데이터가 잘 들어갔는지 확인.
