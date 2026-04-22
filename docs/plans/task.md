# Database Backup Scheduling Implementation Tasks

- [x] Task 1: Install dependencies and extend SystemConfigService
    - [x] Install node-cron and @types/node-cron
    - [x] Enable instrumentationHook in next.config.ts (Enabled by default in Next.js 16.2.1, cleaned up config)
    - [x] Extend SystemSettings and table schema
- [x] Task 2: Implement BackupScheduler Service
    - [x] Create BackupScheduler class
    - [x] Implement init, update, and trigger logic
- [x] Task 3: Apply Retention Policy
    - [x] Implement enforceRetention logic in backup actions (Moved to BackupService)
    - [x] Integrate with createBackupAction
- [x] Task 4: System Initialization and UI Integration
    - [x] Create instrumentation.ts
    - [x] Update BackupManager UI with scheduling settings
