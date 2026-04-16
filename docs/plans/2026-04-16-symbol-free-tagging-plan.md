# 기호 없는 지능형 태그 인식 (Symbol-free Intelligent Tagging) 구현 계획

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 사용자가 `@`, `#` 기호를 입력하지 않아도 실시간으로 마스터 데이터를 인식하여 태그로 변환할 수 있도록 지원합니다.

**Architecture:** 프론트엔드 입력 감지 로직을 확장하여 '암시적 트리거'를 감지하고, 백엔드의 통합 검색 액션을 통해 추천 리스트를 제공합니다. 모든 변환은 데이터 상태(Value)를 우선적으로 처리한 뒤 화면을 재랜더링하는 방식으로 구현됩니다.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, SQLite, Lucide React

---

### Task 1: 백엔드 통합 검색 기능 확장

**Files:**
- Modify: `src/app/workspace/actions.ts:870-900`

**Step 1: searchAutocompleteTagsAction 수정**
`trigger` 파라미터가 `null`인 경우 모든 마스터 테이블을 통합 검색하도록 로직을 보강합니다.

```typescript
// src/app/workspace/actions.ts 수정 예시
export async function searchAutocompleteTagsAction(query: string, trigger: string | null) {
    // ... 기존 로직 유지 ...
    if (!trigger) {
        // 기호가 없을 경우 모든 카테고리 병렬 쿼리 수행
        const [clients, products, employees, departments] = await Promise.all([
            queryTable('master_client', { ... }),
            queryTable('master_product', { ... }),
            // ... 사원, 부서 등 ...
        ]);
        // 결과 통합 및 반환
    }
}
```

**Step 2: Commit**
```bash
git add src/app/workspace/actions.ts
git commit -m "feat: extend searchAutocompleteTagsAction to support trigger-free search"
```

---

### Task 2: 프론트엔드 암시적 트리거 감지 로직 구현

**Files:**
- Modify: `src/components/workspace/AiInputOverlay.tsx:300-340`

**Step 1: handleEditorInput 확장**
매칭되는 기호가 없을 경우, 현재 커서 바로 앞의 단어를 추출하여 검색을 시도하는 로직을 추가합니다. (한글 2자 이상 제한)

```typescript
// src/components/workspace/AiInputOverlay.tsx 수정 예시
const currentWordMatch = beforeText.match(/([^\s@#]{2,})$/);
if (currentWordMatch) {
    const word = currentWordMatch[0];
    setSuggestionQuery(word);
    handleSearchTags(word, null); // trigger 없이 호출
}
```

**Step 2: Commit**
```bash
git add src/components/workspace/AiInputOverlay.tsx
git commit -m "feat: add ambient trigger detection to AiInputOverlay"
```

---

### Task 3: 추천 UI 차별화 및 인터랙션 폴리싱

**Files:**
- Modify: `src/components/workspace/AiInputOverlay.tsx:450-500`

**Step 1: 추천 리스트 헤더 및 뱃지 추가**
기호 없이 감지된 경우 "✨ 태그 제안" 헤더를 리스트 상단에 표시합니다.

**Step 2: 커서 및 상태 정렬**
사용자님의 조언대로 텍스트 데이터 치환 후 HTML을 재랜더링하는 로직이 암시적 트리거에서도 완벽하게 동작하는지 최종 검증합니다.

**Step 3: Commit**
```bash
git add src/components/workspace/AiInputOverlay.tsx
git commit -m "ui: differentiate ambient suggestions with visual badges"
```
