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

### ⚠️ 홈택스 데이터 쿼리 시 기술적 유의사항 (중요)
데이터베이스에 적재된 홈택스 데이터를 쿼리할 때는 다음 규칙을 준수하지 않으면 `0건`이 반환될 수 있습니다.

1. **명시적 페이징 파라미터 필수**: `queryTaxInvoices` 등 메서드 호출 시 `limit: 100, offset: 0`과 같은 페이징 파라미터를 반드시 명시해야 합니다. 생략 시 서버 기본값 이슈로 데이터를 가져오지 못할 수 있습니다.
2. **필터 값 대소문자 주의**: `invoiceType` 등 필터 값은 반드시 **소문자**(`sales`, `purchase`)를 사용해야 합니다.
3. **Connections 유무 무관**: `listHometaxConnections` 결과가 0건이라도, 이미 파일 임포트로 적재된 데이터가 존재하므로 무시하고 쿼리하세요.
4. **면세 데이터 확인**: 세금계산서 외에도 `queryTaxExemptInvoices`를 통해 매입 리스료 등 면세 데이터를 반드시 함께 수집해야 전체 매입액이 정확해집니다.

