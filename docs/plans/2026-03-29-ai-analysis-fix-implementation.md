# AI 이미지 분석 실패 디버깅 및 해결 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 사용자가 업로드한 이미지가 AI 분석에 실패하는 원인을 파악하고, 분석 성공률을 높이며 에러 메시지를 구체화합니다.

**Architecture:** 서버 액션의 바디 사이즈 제한을 상향(10MB)하고, 모든 로직을 try-catch로 감싸 'An unexpected response' 에러를 방지합니다. 또한 정규식 기반 JSON 파싱을 도입합니다.

**Tech Stack:** Next.js Server Actions, Gemini API, AI Vision Library.

---

### Task 1: 서버 설정 및 상세 로깅 개선
**Files:**
- Modify: `next.config.ts`
- Modify: `src/app/actions.ts`
- Modify: `src/components/AIPhotoImportSection.tsx`

**Step 1: Server Action 바디 사이즈 제한 상향 (10MB)**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};
```

**Step 2: 서버 액션의 모든 로직을 try-catch로 보호**
```typescript
export async function analyzeImageAndExtractDataAction(formData: FormData, columnsJson: string) {
    try {
        const image = formData.get('image') as File;
        // ... 모든 로직 ...
        return { success: true, data: extractedData };
    } catch (error: any) {
        return { success: false, error: error.message }; 
    }
}
```

### Task 2: AI 응답 파싱 및 프롬프트 강화
**Files:**
- Modify: `src/lib/ai-vision.ts`

**Step 1: JSON 추출 로직 개선 (Regex 사용)**
- `indexOf` 대신 정규식을 사용하여 중첩된 중괄호나 노이즈 텍스트 사이에서 JSON을 더 정확히 추출.

**Step 2: 프롬프트 보강**
- 이미지 방향(Rotation)에 관계없이 텍스트를 읽도록 지시 추가.
- "명함"이나 "영수증"과 같이 텍스트가 밀집된 이미지에 대한 추출 정확도 향상 문구 추가.

### Task 3: 최종 검증
- 실패했던 이미지를 다시 업로드하여 상세 에러 메시지가 나오는지 확인.
- 로직 개선 후 분석이 성공적으로 이루어지는지 확인.

---

## Verification Plan

### Automated Tests
- 다양한 형식의 AI 응답(노이즈 텍스트 포함)에서 JSON이 올바르게 추출되는지 단위 테스트 수행.

### Manual Verification
1. 실패 이미지를 다시 업로드.
2. 서버 로그에서 AI의 실제 응답(Raw text) 확인.
3. 파싱 성공 여부 및 추출된 데이터의 정확도 확인.
