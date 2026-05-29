import cron from 'node-cron';
import { processAllUsers } from '../services/nudge-engine';

/**
 * Run the nudge engine immediately (useful for manual triggers / tests).
 */
export async function runDailyNudgeJob(): Promise<void> {
  console.log('[DailyNudgeJob] Running...');
  try {
    const count = await processAllUsers();
    console.log(`[DailyNudgeJob] Complete — ${count} nudge(s) sent.`);
  } catch (err) {
    console.error('[DailyNudgeJob] Unexpected error:', err);
  }
}

/**
 * Register the cron schedule.
 * "0 10 * * *" = every day at 10:00 UTC.
 * Call once from index.ts after server starts.
 */
export function startDailyNudgeJob(): void {
  cron.schedule('0 10 * * *', () => {
    void runDailyNudgeJob();
  });
  console.log('[DailyNudgeJob] Scheduled: daily at 10:00 UTC');
}
