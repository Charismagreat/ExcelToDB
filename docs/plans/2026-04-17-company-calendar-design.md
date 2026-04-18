# Company-wide Calendar Design Specification (2026-04-17)

## 1. Overview
The Company-wide Calendar provides a unified view of tasks, company announcements, events, and employee absences. It leverages the existing infrastructure of the EGDesk platform to ensure data consistency and minimal overhead.

## 2. Requirement Analysis
- **Target Users**: Both CEOs/Managers (Dashboard) and Employees (Workspace).
- **Scope**: Comprehensive view of all scheduled activities in the system.
- **Data Source**: Unified storage in the existing `action_task` table.
- **Permissions**: 
    - Admins: Full access (View, Create, Edit, Delete all events).
    - Employees: View-only access (Filtered based on own assignments and public records).

## 3. Data Design
### Existing Table: `action_task` (Table ID: 11)
We will utilize the `type` column to categorize entries for the calendar.

| Value | Category | Description |
|---|---|---|
| `TASK` | Project Tasks | Existing task management items with deadlines. |
| `NOTICE` | Announcements | Public company notifications (e.g., policy changes, news). |
| `EVENT` | Company Events | Shared events like workshops, holidays, or company birthdays. |
| `VACATION` | Employee Absences | Records of employee leaves/holidays. |

### Logic Constraints
- **Date Handling**: All calendar events will be driven by the `dueAt` column (Single-day view).
- **RBAC**: 
    - Fetching logic will filter out non-public `TASK` and `VACATION` items for regular employees.
    - `type IN ('NOTICE', 'EVENT')` rows are generally public.

## 4. Architecture & Service Layer
- **Service Responsibility**: `CalendarService` (or a utility in `egdesk-helpers.ts`) to fetch and transform `action_task` rows.
- **Query Logic**: 
    - Use `queryTable` with date filters on `dueAt`.
    - Apply role-based filtering on the server side.

## 5. UI/UX Design
### Dashboard App (Admin)
- **Menu**: Sidebar navigation link added to the main dashboard layout.
- **Main View**: Full-screen monthly grid calendar.
- **Widget**: "Upcoming Events" summary on the main dashboard hub.
- **Interaction**: Ability to add new `NOTICE` or `EVENT` directly from the calendar UI.

### Workspace App (Employee)
- **Menu**: Bottom navigation menu for quick-access on mobile/web-app.
- **Main View**: View-only monthly/weekly calendar grid.
- **Interaction**: View event details in a modal.

## 6. Verification Plan
- **Data Integrity**: Ensure adding an `action_task` with a specific type correctly appears on the calendar.
- **Permission Test**: Verify that employee accounts cannot see private tasks of other employees.
- **Layout Test**: Verify responsiveness of the calendar in both sidebar (desktop) and bottom-nav (workspace) layouts.
