# ExcelToDB Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a Next.js application that dynamiclly generates CRUD UIs and dashboards from uploaded Excel files, with individual ownership for 30 employees.

**Architecture:** Next.js App Router with SQLite as the database. Reports and their rows are stored using a flexible JSON schema to support any Excel format. Ownership is managed via a simple authentication system.

**Tech Stack:** Next.js, Tailwind CSS, Prisma (ORM), SQLite, Lucide Icons, Recharts, `xlsx` (for parsing).

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`

**Step 1: Initialize Next.js project with Tailwind and TypeScript**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-npm --no-git`
Expected: Project files created in the root directory.

**Step 2: Install core dependencies**

Run: `npm install lucide-react prisma @prisma/client xlsx clsx tailwind-merge recharts`
Expected: Dependencies installed.

**Step 3: Commit**

```bash
git add .
git commit -m "chore: initialize next.js project"
```

---

### Task 2: Database Setup (Prisma/SQLite)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

**Step 1: Initialize Prisma**

Run: `npx prisma init --datasource-provider sqlite`
Expected: `prisma/schema.prisma` created.

**Step 2: Define Schema with dynamic support**

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  role      String   @default("VIEWER") // ADMIN, VIEWER
  reports   Report[]
}

model Report {
  id          String   @id @default(cuid())
  name        String
  columns     String   // JSON string of column definitions: { name: string, type: string }[]
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  rows        ReportRow[]
  createdAt   DateTime @default(now())
}

model ReportRow {
  id        String   @id @default(cuid())
  data      String   // JSON string of row data: { [columnName]: value }
  reportId  String
  report    Report   @relation(fields: [reportId], references: [id])
}
```

**Step 3: Apply Migrations**

Run: `npx prisma migrate dev --name init`
Expected: SQLite database created and schema applied.

**Step 4: Commit**

```bash
git add prisma/schema.prisma lib/prisma.ts
git commit -m "feat: setup prisma and initial schema"
```

---

### Task 3: Excel Parser Utility (Enhanced for Multi-sheet)

**Files:**
- Create: `lib/excel-parser.ts`
- Create: `tests/excel-parser.test.ts`

**Step 1: Implement multi-sheet and multi-table detection**

```typescript
import * as XLSX from 'xlsx';

export function parseExcelWorkbook(buffer: Buffer) {
    const workbook = XLSX.read(buffer);
    return workbook.SheetNames.map(name => ({
        sheetName: name,
        // one sheet can have multiple tables separated by empty rows
        tables: parseSheet(workbook.Sheets[name])
    }));
}

function parseSheet(sheet: XLSX.WorkSheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Logic to split data by empty rows and convert to JSON objects
    return splitByEmptyRows(data);
}
```

**Step 2: Write tests for multi-sheet detection**

**Step 3: Commit**

```bash
git add lib/excel-parser.ts tests/excel-parser.test.ts
git commit -m "feat: enhance excel parser for multi-sheet/table support"
```

---

### Task 4: Dynamic UI Components

**Files:**
- Create: `components/DynamicTable.tsx`
- Create: `components/DynamicForm.tsx`

**Step 1: Build a component that renders a table based on column metadata**

**Step 2: Build a form component that renders inputs based on column metadata**

**Step 3: Commit**

```bash
git add components/DynamicTable.tsx components/DynamicForm.tsx
git commit -m "feat: add dynamic ui components"
```
