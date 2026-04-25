# 커스텀 HTML 템플릿 사용 가이드 (자금일보 예시)

이 가이드는 외부 디자인 도구에서 만든 HTML/CSS를 이지데스크 마이크로 앱에 연결하는 방법을 설명합니다.

## 1. 사용 가능한 변수 (Handlebars 스타일)

HTML 내에 다음과 같은 변수를 사용하여 데이터를 동적으로 바인딩할 수 있습니다.

### 기본 정보
- `{{appName}}`: 앱의 이름
- `{{currentTime}}`: 최종 데이터 업데이트 시간
- `{{totalBalance}}`: 현재 통합 가용 자금 (포맷팅된 문자열)
- `{{totalInflow}}`: 당월 총 입금액
- `{{totalOutflow}}`: 당월 총 출금액

### 계좌 목록 (`{{#each accounts}}` 블록 내)
- `{{name}}`: 계좌 별칭 또는 은행명
- `{{balance}}`: 계좌 잔액

### 거래 내역 (`{{#each transactions}}` 블록 내)
- `{{description}}`: 거래 적요
- `{{date}}`: 거래 일자
- `{{bankName}}`: 은행명
- `{{amount}}`: 거래 금액
- `{{inflow}}`: 입금 여부 (Boolean, `#if` 조건문에서 사용 가능)

## 2. 데이터 매핑 예시

```html
<!-- 계좌 루프 예시 -->
<div class="grid">
  {{#each accounts}}
  <div class="card">
    <h4>{{name}}</h4>
    <p>{{balance}}원</p>
  </div>
  {{/each}}
</div>

<!-- 조건부 스타일 예시 -->
{{#each transactions}}
<p class="{{#if inflow}}text-green{{else}}text-red{{/if}}">
  {{amount}}원
</p>
{{/each}}
```

## 3. 테스트 방법

1. 제공된 `index.html` 파일을 열어 디자인을 수정합니다.
2. 수정된 HTML 코드를 마이크로 앱 스튜디오의 **[커스텀 코드 입력]** 영역에 붙여넣습니다. (기능 추가 예정)
3. 데이터 소스를 선택하면 AI가 자동으로 변수 위치에 실제 데이터를 주입하여 앱을 생성합니다.
