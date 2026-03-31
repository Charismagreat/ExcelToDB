# Prisma to EGDesk Data Migration Design

이 문서는 기존 Prisma(SQLite) 기반의 데이터를 EGDesk `userdata` DB로 마이그레이션하고, Prisma 의존성을 제거하기 위한 설계안을 담고 있습니다.

## 1. 개요 (Background)

현재 프로젝트는 `User`, `Report`, `ReportRow`, `ReportRowHistory` 모델을 Prisma를 통해 `prisma/dev.db`에 저장하고 있습니다. 이를 EGDesk에서 제공하는 `user_data_sql_query`를 활용하여 `userdata` DB로 완전히 이전하고, 향후 애플리케이션 프론트엔드 및 백엔드가 EGDesk 인터페이스를 통해 데이터에 접근하도록 구성하는 것이 목표입니다.

## 2. 목표 (Objectives)

- Prisma의 스키마 구조를 **동일하게 유지**하며 EGDesk에 테이블 생성
- Prisma(SQLite)에서 모든 레코드를 추출하여 EGDesk로 이전
- 마이그레이션 도구(스크립트) 제공 및 실행 결과 검증
- 마이그레이션 완료 후 애플리케이션 코드를 Prisma 대신 EGDesk 헬퍼를 사용하도록 전환 준비

## 3. 상세 설계 (Detailed Design)

### 3.1. 테이블 매핑 (Mapping Table)

Prisma 모델과 EGDesk 테이블 간의 매핑 전략은 다음과 같습니다:

| Prisma Model | EGDesk Table Name | Columns (Data Types) |
|--------------|-------------------|----------------------|
| User         | user              | id (TEXT, PK), username (TEXT, UNIQUE), password (TEXT), fullName (TEXT), employeeId (TEXT, UNIQUE), role (TEXT), isActive (INTEGER), lastLoginAt (DATETIME) |
| Report       | report            | id (TEXT, PK), name (TEXT), sheetName (TEXT), columns (TEXT), ownerId (TEXT), createdAt (DATETIME), isDeleted (INTEGER), deletedAt (DATETIME), slackWebhookUrl (TEXT) |
| ReportRow    | report_row        | id (TEXT, PK), data (TEXT), contentHash (TEXT), reportId (TEXT), creatorId (TEXT), createdAt (DATETIME), updaterId (TEXT), updatedAt (DATETIME), isDeleted (INTEGER), deletedAt (DATETIME) |
| ReportRowHistory | report_row_history | id (TEXT, PK), rowId (TEXT), oldData (TEXT), newData (TEXT), changeType (TEXT), changedById (TEXT), changedAt (DATETIME) |

> [!NOTE]
> SQLite(EGDesk)에서는 Boolean 타입을 0/1 (INTEGER)로 처리하며, DateTime은 ISO8601 문자열 또는 포맷된 문자열로 저장됩니다.

### 3.2. 마이그레이션 프로세스 (Migration Process)

1.  **테이블 생성 (DLL 단계)**:
    - `user_data_sql_query`를 사용하여 `CREATE TABLE IF NOT EXISTS ...` 쿼리 실행
    - 외래 키 제약 조건은 명시적으로 선언하되, 마이그레이션 효율을 위해 순차적 삽입(Top-down) 수행
2.  **데이터 추출 (Extraction Phase)**:
    - Prisma Client (`src/lib/prisma.ts`)를 초기화하여 `findMany()`로 모든 데이터를 가져옴
3.  **데이터 변환 (Transformation Phase)**:
    - 객체 필드들을 SQL INSERT 밸류 포맷에 맞게 변환
    - NULL 값 처리 및 특수 문자 이스케이프 수행
4.  **데이터 삽입 (Loading Phase)**:
    - EGDesk의 `executeSQL` (via `egdesk-helpers.ts`)를 사용하여 데이터를 전송
    - 전송 시 배치(Batch) 처리는 하지 않고, 안정성을 위해 레코드별 삽입을 기본으로 함

### 3.3. 검증 전략 (Validation)

- **레코드 수 비교**: Prisma에서 읽어온 행 수와 EGDesk에 성공적으로 삽입된 행 수가 일치하는지 확인
- **데이터 샘플링**: 가장 최근의 `ReportRow` 데이터를 랜덤 조회하여 JSON 데이터 내용이 온전한지 수동/자동 체크

## 4. 리스크 및 고려 사항 (Risks)

- **EGDesk 서버 가동 여부**: 마이그레이션 중에는 `localhost:8080` 포트에 서버가 기동되어 있어야 함
- **트랜잭션 제한**: 현재 EGDesk 인터페이스 사양상 명시적 트랜잭션 관리가 어려울 수 있으므로, 실패 시 재시작이 용이하도록 구현됨

## 5. 단계별 실행 계획 (Next Steps)

1. `scripts/migrate-data.ts` 작성
2. 마이그레이션 테스트 및 테이블 생성 확인
3. 최종 데이터 이전 수행
4. (후속) Prisma 코드 베이스를 EGDesk 헬퍼를 사용하도록 교체

---
작성일: 2026-03-31
작성자: Antigravity
