# White-label AI Onboarding Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform the project into a white-label corporate solution with an AI-driven onboarding wizard that scaffolds the system based on business context and Excel data.

**Architecture:**
- **Dynamic Configuration**: DB-backed system settings.
- **Branding Injection**: React Context (BrandingProvider) for real-time UI updates.
- **Generative Scaffolding**: Gemini-powered API to convert Excel to table schemas and business rules.

**Tech Stack:** Next.js, TypeScript, Gemini API, SQLite (via MCP).

---

### Task 1: System Settings Backend

**Files:**
- Create: `src/lib/services/system-config-service.ts`
- Modify: `egdesk-helpers.ts` (if needed for utility)
- Test: `tests/services/system-config-service.test.ts`

**Step 1: Write a script to create the system_settings table**
```typescript
// Run via scratch script or one-off tool call
// Table: system_settings
// Columns: id, companyName, logoUrl, themeColor, businessContext, isInitialized
```

**Step 2: Implement getSystemSettings in SystemConfigService**
```typescript
export class SystemConfigService {
  static async getSettings() {
    const rows = await queryTable('system_settings', { limit: 1 });
    return rows[0] || null;
  }
}
```

**Step 3: Commit**
```bash
git add src/lib/services/system-config-service.ts
git commit -m "feat: add system settings service and db structure"
```

---

### Task 2: Branding Provider & UI Abstraction

**Files:**
- Create: `src/components/providers/BrandingProvider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/NavigationSidebar.tsx`

**Step 1: Create BrandingProvider Context**
```typescript
'use client';
import React, { createContext, useContext } from 'react';

const BrandingContext = createContext({ companyName: 'EGDesk', logoUrl: '', themeColor: '#2563eb' });

export const BrandingProvider = ({ settings, children }) => {
  return <BrandingContext.Provider value={settings}>{children}</BrandingContext.Provider>;
}
```

**Step 2: Refactor NavigationSidebar to use Context**
```tsx
// Replace "WON CONDUCTOR" with {branding.companyName}
const { companyName } = useBranding();
```

**Step 3: Commit**
```bash
git add src/components/providers/BrandingProvider.tsx src/components/NavigationSidebar.tsx
git commit -m "feat: implement BrandingProvider and refactor sidebar"
```

---

### Task 3: AI Onboarding Wizard (Phase 1: Setup Route)

**Files:**
- Create: `src/app/setup/page.tsx`
- Create: `src/app/api/setup/initialize/route.ts`

**Step 1: Create a basic Setup Wizard UI**
- A form asking for Company Name and Logo file.

**Step 2: Add middleware or layout check**
- If `isInitialized` is false, redirect to `/setup`.

**Step 3: Commit**
```bash
git add src/app/setup/page.tsx
git commit -m "feat: add basic corporate setup route"
```

---

### Task 4: Generative Scaffolding API

**Files:**
- Create: `src/app/api/setup/analyze-excel/route.ts`
- Create: `src/lib/services/scaffolding-service.ts`

**Step 1: Implement Excel Analysis with Gemini**
- Takes Buffer, returns JSON schema for `user_data_create_table`.

**Step 2: Implement Scaffolding Logic**
- Calls `createTable` and registers it in `report` metadata.

**Step 3: Commit**
```bash
git add src/app/api/setup/analyze-excel/route.ts
git commit -m "feat: add AI-driven excel scaffolding logic"
```
