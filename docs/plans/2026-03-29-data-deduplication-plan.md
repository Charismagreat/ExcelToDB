# 데이터 중복 방지 기능 실증 및 구현 계획

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 동일한 데이터가 중복으로 입력되는 것을 방지하여 데이터 정합성을 확보합니다.

**Architecture:** 
1. **콘텐츠 해싱(Content Hashing):** 각 행의 데이터(JSON)를 해시값으로 변환하여 저장하고, 삽입 전 동일한 해시가 존재하는지 체크합니다.
2. **사용자 정의 고유 키(User-defined Unique Keys):** 특정 컬럼들(예: 날짜 + 이름)을 조합하여 중복 여부를 판단할 수 있도록 설정 기능을 제공합니다.

**Tech Stack:** Prisma (SQLite), Next.js Server Actions, Crypto (Hashing).

---

### Task 1: 데이터베이스 스키마 고도화
**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: `ReportRow`에 `contentHash` 필드 추가**
- 인덱스를 추가하여 검색 속도 최적화.
```prisma
model ReportRow {
  id          String   @id @default(cuid())
  data        String   
  contentHash String?  // 추가: 중복 체크용 해시
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id])
  @@index([reportId, contentHash])
}
```

### Task 2: 중복 처리 로직 구현 (Server Actions)
**Files:**
- Modify: `src/app/actions.ts`

**Step 1: 해시 생성 유틸리티 구현**
- `dataID`를 제외한 필수 데이터들을 정렬하여 해시 생성.

**Step 2: `addRowsAction` 수정**
- 새 데이터를 넣기 전, DB에서 동일한 `contentHash`가 있는지 조회.
- 중복된 데이터는 건너뛰거나(Ignore) 사용자에게 알림.

### Task 3: 고유 키 설정 UI 추가
**Files:**
- Modify: `src/components/SchemaEditor.tsx`

**Step 1: 컬럼 설정에 '중복 체크 기준(Unique)' 옵션 추가**
- 사용자가 여러 컬럼을 체크하여 복합 고유 키를 정의할 수 있게 함.

### Task 4: 기존 데이터 마이그레이션 및 검증
**Files:**
- [NEW] `scripts/generate-hashes.ts`

**Step 1: 기존 데이터에 대한 해시값 일괄 생성**
- 기존에 저장된 데이터들도 중복 체크가 가능하도록 해시값을 채워넣는 스크립트 실행.

---

## Verification Plan

### Automated Tests
- 동일한 데이터를 두 번 업로드했을 때, 두 번째 업로드는 무시되거나 에러를 반환하는지 확인.
- 고유 키로 지정된 컬럼만 같고 다른 컬럼은 다를 때 중복으로 간주하는지 확인.

### Manual Verification
1. 수동 입력 폼에서 완전히 동일한 데이터를 두 번 입력해 봅니다.
2. 엑셀 업로드 시 이미 존재하는 행이 포함된 파일을 올려 중복 제거가 작동하는지 확인합니다.
3. 스키마 편집기에서 '날짜' 컬럼을 고유 키로 설정한 후, 같은 날짜의 데이터를 추가해 봅니다.
