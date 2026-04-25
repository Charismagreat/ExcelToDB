<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Critical Business Knowledge

## 📌 홈택스(Hometax) 데이터 구조 및 관리 규칙
홈택스에서 데이터를 가져오거나 분석할 때는 반드시 다음 **5가지 데이터 소스**를 개별적으로 취합해야 정확한 재무 데이터 산출이 가능합니다.

### 1. 매출 관련 데이터 (3종 필수 합산)
*   **매출 세금계산서**: 부가세 과세 대상 매출 증빙
*   **매출 계산서**: 부가세 면세 대상 매출 증빙
*   **매출 현금영수증**: 현금 결제에 대한 증빙 (API 호출 시 별도 확인 필요)
*   *주의: 이 3가지를 모두 합산해야 전체 매출 규모가 정확히 파악됨.*

### 2. 매입 관련 데이터 (2종 필수 합산)
*   **매입 세금계산서**: 물품/서비스 구매 시 과세 증빙
*   **매입 계산서**: 면세 품목 구매 시 증빙
*   *주의: 세금계산서만 확인하면 면세 매입분이 누락될 수 있음.*


AI 에이전트들은 이지데스크 서버에서 데이터를 쿼리하거나 대시보드 통계를 작성할 때 위 분류 체계를 반드시 준수해야 합니다.

### 🛠 개발 필수 도구
데이터 쿼리, 통계 작성, 또는 외부 API(홈택스, 금융 등) 연동 시에는 반드시 **`egdesk-helpers.ts`** (루트 경로)에 정의된 헬퍼 함수를 사용하여 개발해야 합니다. 
*   **주의**: 프로젝트 코드 내에서는 이 원본을 래핑하여 하위 호환성을 제공하는 `@/egdesk-helpers` (`src/egdesk-helpers.ts`)를 주로 사용합니다. 직접 API를 호출하지 말고 헬퍼 내의 검증된 로직을 활용하세요.


### ⚠️ 홈택스 데이터 쿼리 시 기술적 유의사항 (중요)
데이터베이스에 적재된 홈택스 데이터를 쿼리할 때는 다음 규칙을 준수하지 않으면 `0건`이 반환될 수 있습니다.

1. **명시적 페이징 파라미터 필수**: `queryTaxInvoices` 등 메서드 호출 시 `limit: 100, offset: 0`과 같은 페이징 파라미터를 반드시 명시해야 합니다. 생략 시 서버 기본값 이슈로 데이터를 가져오지 못할 수 있습니다.
2. **필터 값 대소문자 주의**: `invoiceType` 등 필터 값은 반드시 **소문자**(`sales`, `purchase`)를 사용해야 합니다.
3. **Connections 유무 무관**: `listHometaxConnections` 결과가 0건이라도, 이미 파일 임포트로 적재된 데이터가 존재하므로 무시하고 쿼리하세요.
4. **면세 데이터 확인**: 세금계산서 외에도 `queryTaxExemptInvoices`를 통해 매입 리스료 등 면세 데이터를 반드시 함께 수집해야 전체 매입액이 정확해집니다.

## 📱 프로젝트 내 주요 앱 구성
이 프로젝트는 대상 사용자에 따라 두 개의 주요 앱으로 구성되어 있습니다.

1.  **대시보드앱** (CEO 및 관리자용)
    *   공식 명칭: **CEO DASHBOARD**
    *   주요 경로: `/dashboard`, `/admin`, `/workflow`
    *   역할: 리포트 분석, 조직 관리, 시스템 설정 등 관리자 기능 수행

2.  **워크스페이스앱** (사원용)
    *   공식 명칭: **Won Conductor** (마이 워크스페이스 2.0)
    *   주요 경로: `/workspace`, `/m`
    *   역할: 개인 업무 기록, 할 일(TODO) 관리, 타임라인 피드 확인 등 실무 기능 수행

AI 에이전트는 앞으로의 대화에서 사용자가 지정한 '대시보드앱'과 '워크스페이스앱'이라는 명칭을 우선적으로 사용하여 소통해야 합니다.

## 🤖 AI 모델 사용 규칙
이 프로젝트에서 AI 분석, 추천, 대시보드 생성 등을 수행할 때는 반드시 다음 모델을 사용해야 합니다.

*   **표준 모델**: `gemini-3-flash-preview`
*   **주의**: `gemini-1.5-flash`나 `gemini-2.0-flash` 등 표준 Google 모델명을 사용하면 404 에러가 발생할 수 있습니다. 반드시 위 명칭을 준수하세요.


