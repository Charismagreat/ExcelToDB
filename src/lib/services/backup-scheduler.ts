import cron from 'node-cron';
import { SystemConfigService } from './system-config-service';
import { BackupService } from './backup-service';

export class BackupScheduler {
    private static activeJob: cron.ScheduledTask | null = null;

    /**
     * 서버 시작 시 스케줄러 초기화
     */
    static async init() {
        console.log('[BackupScheduler] Initializing...');
        const settings = await SystemConfigService.getSettings();
        
        if (settings && settings.backupScheduleEnabled) {
            this.startJob(settings.backupScheduleDays, settings.backupScheduleTime);
        } else {
            console.log('[BackupScheduler] Scheduled backup is disabled.');
        }
    }

    /**
     * 설정 변경 시 스케줄러 업데이트
     */
    static async update() {
        console.log('[BackupScheduler] Updating schedule due to settings change...');
        if (this.activeJob) {
            this.activeJob.stop();
            this.activeJob = null;
        }
        
        const settings = await SystemConfigService.getSettings();
        if (settings && settings.backupScheduleEnabled) {
            this.startJob(settings.backupScheduleDays, settings.backupScheduleTime);
        }
    }

    /**
     * 크론 잡 시작
     */
    private static startJob(days: string, time: string) {
        // time format: "HH:mm" (e.g. "03:00")
        const [hour, minute] = time.split(':');
        
        // cron format: "minute hour day-of-month month day-of-week"
        // days: "1,2,3,4,5,6" (Mon-Sat)
        const cronExpression = `${minute} ${hour} * * ${days}`;
        
        console.log(`[BackupScheduler] Registering cron job: ${cronExpression}`);
        
        this.activeJob = cron.schedule(cronExpression, async () => {
            console.log('[BackupScheduler] Triggering scheduled backup...');
            try {
                await BackupService.createBackup();
                console.log('[BackupScheduler] Scheduled backup completed successfully.');
            } catch (error) {
                console.error('[BackupScheduler] Scheduled backup failed:', error);
            }
        });
        
        this.activeJob.start();
    }
}
