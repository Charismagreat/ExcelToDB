# EGDesk Knowledge Base: 가상 금융 데이터 통합 분석

## 1. 개요 (Overview)
이지데스크(EGDesk) 시스템은 물리적인 SQLite 데이터베이스 외에도, 여러 소스의 데이터를 실시간으로 조인하여 제공하는 **가상 테이블(Virtual Tables)** 개념을 사용합니다. 특히 금융 분석(FinanceHub) 영역에서 이 개념이 핵심적으로 사용됩니다.

## 2. 가상 테이블 매핑 가이드 (ID Mapping)

| UI 상의 이름 | 내부 가상 ID | 실제 데이터 소스 (물리/API) |
| :--- | :--- | :--- |
| **은행 계좌 거래 내역** | `finance-hub-bank-table` | `accounts` API + `bank_transactions` API |
| **신용카드 거래 내역** | `finance-hub-card-table` | `cards` API + `card_transactions` API |
| **MY DB 통합 리포트** | `rep-xxxx-xxxx` | `report_row` 테이블 (JSON data 컬럼) |

## 3. 기술적 구현 상세 (Implementation Details)

### 3.1 통합 쿼리 로직 (The "Smart Way")
사용자가 "MY DB에 이미 있는 데이터를 가져오라"고 요청할 경우, 단순 SQL 쿼리가 아닌 서버의 통합 로직을 타야 합니다.
*   **참조 로직**: `src/app/actions/publishing.ts`의 `fetchSingleSourceData` 함수.
*   **AI 도구**: `src/lib/ai-tools.ts`의 `get_finance_dashboard_summary`.

### 3.2 조인(Join) 프로세스
1.  **마스터 정보**: `listAccounts()`를 통해 전체 계좌 목록(UUID 기반)을 가져옵니다.
2.  **은행명 매핑**: `listBanks()` 결과에서 `bankId`를 한글 은행명(`nameKo`)으로 치환합니다.
3.  **최신 잔액 매핑**: `queryBankTransactions()`로 최근 거래(최대 5000건)를 스캔하여 각 계좌 ID(`accountId`)별로 가장 마지막 행의 `balance`를 추출합니다.

## 4. 주의사항 (Gotchas)
*   **ID 불일치**: UI에서 보이는 테이블 ID로 직접 DB 쿼리를 날리면 `Table not found` 에러가 발생합니다. 반드시 가상화 레이어를 거쳐야 합니다.
*   **데이터 요약**: AI 모델은 대량의 데이터(71건 등)를 임의로 요약하려는 경향이 있습니다. 금융 분석 시에는 `fullTableMarkdown` 필드를 사용하여 전체 리스트를 누락 없이 출력하도록 강제해야 합니다.
*   **삭제 필터링**: 일반 워크스페이스 테이블(`report_row`) 조회 시에는 반드시 `isDeleted = 0` 조건을 SQL에 포함하거나 필터로 걸어야 합니다.

---
*Last Updated: 2026-04-25*
*Author: Antigravity AI (Inspired by User's "Smart Way")*
