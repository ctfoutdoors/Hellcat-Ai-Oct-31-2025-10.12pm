/**
 * Sync Scheduler Service
 * Handles scheduled syncs for ShipStation and other integrations
 */

import cron from 'node-cron';
import { ShipStationSyncService } from './shipstationSync';

let dailySyncJob: cron.ScheduledTask | null = null;

/**
 * Initialize daily sync scheduler
 * Runs at 2 AM every day
 */
export function initializeDailySyncScheduler() {
  // Stop existing job if any
  if (dailySyncJob) {
    dailySyncJob.stop();
  }

  // Schedule daily sync at 2 AM
  dailySyncJob = cron.schedule('0 2 * * *', async () => {
    console.log('[Daily Sync] Starting scheduled ShipStation sync at', new Date().toISOString());
    
    try {
      const syncService = new ShipStationSyncService();
      await syncService.syncShipments();
      console.log('[Daily Sync] Completed successfully');
    } catch (error: any) {
      console.error('[Daily Sync] Failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York', // Adjust to your timezone
  });

  console.log('✅ Daily sync scheduler initialized: 0 2 * * *');
}

/**
 * Stop the daily sync scheduler
 */
export function stopDailySyncScheduler() {
  if (dailySyncJob) {
    dailySyncJob.stop();
    dailySyncJob = null;
    console.log('Daily sync scheduler stopped');
  }
}

/**
 * Trigger manual sync immediately
 */
export async function triggerManualSync() {
  console.log('[Manual Sync] Starting ShipStation sync at', new Date().toISOString());
  
  try {
    const syncService = new ShipStationSyncService();
    await syncService.syncShipments();
    console.log('[Manual Sync] Completed successfully');
    return { success: true, message: 'Sync completed successfully' };
  } catch (error: any) {
    console.error('[Manual Sync] Failed:', error.message);
    throw new Error(`Sync failed: ${error.message}`);
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: dailySyncJob !== null,
    schedule: '0 2 * * * (Daily at 2 AM)',
    timezone: 'America/New_York',
    nextRun: dailySyncJob ? 'Scheduled' : 'Not scheduled',
  };
}
