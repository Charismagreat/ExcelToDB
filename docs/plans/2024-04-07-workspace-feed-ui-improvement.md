# Workspace Feed UI Improvement Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Improve scannability of the workspace feed by displaying the Table Name as the primary title and a data summary as the content.

**Architecture:** 
1. Modify `getWorkspaceFeedAction` in `src/app/workspace/actions.ts` to transform raw DB data into the requested title/content format.
2. Update `FeedCard.tsx` in `src/components/workspace/FeedCard.tsx` to enhance the visual hierarchy (Bold Title, High-contrast Content).

**Tech Stack:** Next.js (Server Actions), Tailwind CSS, TypeScript.

---

### Task 1: Update `getWorkspaceFeedAction` Data Logic

**Files:**
- Modify: `src/app/workspace/actions.ts`

**Step 1: Modify data transformation loop**
Update the `workspaceItems.map` and `rawRows.map` logic to:
- `title`: `reportMap.get(item.reportId)?.name || '기타/미분류'`
- `content`: A summary generated from `aiData`.

**Step 2: Implement summary generator helper**
Add a helper function to create a concise string from `aiData` (e.g., "date merchant amount").

**Step 3: Commit**
```bash
git add src/app/workspace/actions.ts
git commit -m "feat(workspace): update feed data transformation logic"
```

---

### Task 2: Update `FeedCard.tsx` Component Styling

**Files:**
- Modify: `src/components/workspace/FeedCard.tsx`

**Step 1: Update title and content styles**
- Title (Table Name): Change to `text-base font-black text-gray-900`.
- Content (Data Summary): Change to `text-sm font-semibold text-gray-700`.

**Step 2: Update badge styling**
Ensure the "완료" / "분석중" badges remain visible but don't clash with the new dual-title layout.

**Step 3: Commit**
```bash
git add src/components/workspace/FeedCard.tsx
git commit -m "style(workspace): enhance FeedCard visual hierarchy"
```

---

### Task 3: Verification

**Step 1: Manual Verification**
- Access `/workspace` with the base path.
- Verify that items show the "Table Name" as the primary title.
- Verify that the summary (e.g., "스타벅스 15,000원") is clearly visible below.

**Step 2: Final Walkthrough**
Update `walkthrough.md` with screenshots of the improved UI.
