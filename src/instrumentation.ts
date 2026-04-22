export async function register() {
    if (process.env.NEXT_RUNTIME === 'node') {
        const { BackupScheduler } = await import('@/lib/services/backup-scheduler');
        await BackupScheduler.init();
    }
}
