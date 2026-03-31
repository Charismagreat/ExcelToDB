# Prisma to EGDesk Data Migration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Prisma(SQLite)에 저장된 모든 데이터를 EGDesk `userdata` DB로 동일한 스키마 구조를 유지하며 이전합니다.

**Architecture:** Prisma Client를 사용하여 데이터를 추출하고, EGDesk의 `user_data_sql_query` 도구를 호출하여 데이터를 삽입하는 독립형 마이그레이션 스크립트를 작성합니다.

**Tech Stack:** TypeScript, Prisma, Next.js (Helper APIs), EGDesk MCP Tooling

---

### Task 1: 마이그레이션 스크립트 기반 마련 (Metadata & Config)

**Files:**
- Create: `scripts/migrate-data.ts`
- Modify: `egdesk-helpers.ts` (환경에 따른 URL 처리 보완 필요 시)

**Step 1: 마이그레이션 스크립트의 기본 뼈대 작성**
- Prisma Client 및 EGDesk 헬퍼 임포트
- 메인 함수 구조 잡기

```typescript
import prisma from '../src/lib/prisma';
// Note: Node 환경에서 fetch-based helper를 사용하기 위해 환경 설정이 필요할 수 있음
// 실제로는 직접 callUserDataTool을 Node-fetch나 axios로 재구현하거나
// 기존 헬퍼를 Node 환경에서도 동작하도록 수정
```

**Step 2: EGDesk 직접 통신 함수 작성 (Node 환경용)**
- `egdesk-helpers.ts`는 프록시(`/__user_data_proxy`)를 사용하므로, 스크립트에서는 `localhost:8080`에 직접 요청을 보내는 로직이 필요함

**Step 3: 커밋**
```bash
git add scripts/migrate-data.ts
git commit -m "feat: add migration script skeleton"
```

### Task 2: 테이블 생성 로직 (DLL)

**Files:**
- Modify: `scripts/migrate-data.ts`

**Step 1: CREATE TABLE SQL 작성**
- `user`, `report`, `report_row`, `report_row_history` 테이블 생성을 위한 SQL 작성

**Step 2: 실행 및 확인**
- `executeSQL` 함수를 호출하여 테이블 생성 확인

**Step 3: 커밋**
```bash
git commit -am "feat: implement table creation logic in migration script"
```

### Task 3: 데이터 마이그레이션 구현 (ETL)

**Files:**
- Modify: `scripts/migrate-data.ts`

**Step 1: User 데이터 이전**
- Prisma에서 User 조회 및 EGDesk 삽입 로직 작성

**Step 2: Report 데이터 이전**
- Prisma에서 Report 조회 및 EGDesk 삽입 로직 작성

**Step 3: ReportRow 및 History 데이터 이전**
- 대용량 데이터를 고려하여 순차적 처리 구현

**Step 4: 커밋**
```bash
git commit -am "feat: implement ETL logic for all models"
```

### Task 4: 애플리케이션 전환 및 검증

**Files:**
- Modify: `src/lib/prisma.ts` (또는 해당 라이브러리를 사용하는 곳들)
- Modify: `src/app/...` (Prisma 호출부를 `egdesk-helpers.ts`로 교체)

**Step 1: 데이터 검증 테스트 실행**
- 이전된 데이터의 카운트 비교 및 샘플 데이터 정합성 확인

**Step 2: 애플리케이션 내 Prisma 호출부 교체 시작**
- `src/lib/data-utils.ts` 등에서 Prisma 전역 객체 대신 EGDesk 헬퍼 사용하도록 수정

**Step 3: 커밋**
```bash
git commit -am "feat: switch application data source to EGDesk"
```

### Task 5: 정리 및 Prisma 제거

**Files:**
- Modify: `package.json`
- Delete: `prisma/` directory (optional, after backup)

**Step 1: Prisma 의존성 제거**
- `package.json`에서 `@prisma/client` 등 제거

**Step 2: 최종 코드 정리**
- 사용하지 않는 Prisma 설정 파일들 제거

**Step 3: 커밋**
```bash
git commit -am "refactor: remove prisma dependency and files"
```
