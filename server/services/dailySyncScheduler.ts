import cron from "node-cron";
import { ShipStationSyncService } from "./shipstationSync";
import { sendEmail } from "./emailServiceCustomizable";

interface SchedulerConfig {
  enabled: boolean;
  cronExpression: string; // e.g., "0 2 * * *" for 2 AM daily
  dateRange: string; // e.g., "last_7_days"
  notifyOnCompletion: boolean;
  notifyOnError: boolean;
  adminEmail: string;
}

export class DailySyncScheduler {
  private static tasks: Map<string, cron.ScheduledTask> = new Map();
  private static config: SchedulerConfig = {
    enabled: true,
    cronExpression: "0 2 * * *", // 2 AM daily
    dateRange: "last_7_days",
    notifyOnCompletion: true,
    notifyOnError: true,
    adminEmail: process.env.OWNER_EMAIL || "herve@catchthefever.com",
  };

  /**
   * Initialize the daily sync scheduler
   */
  static initialize(config?: Partial<SchedulerConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this.config.enabled) {
      this.scheduleShipStationSync();
      console.log(
        `✅ Daily sync scheduler initialized: ${this.config.cronExpression}`
      );
    }
  }

  /**
   * Schedule ShipStation sync
   */
  static scheduleShipStationSync(): void {
    const taskName = "shipstation_sync";

    // Stop existing task if any
    if (this.tasks.has(taskName)) {
      this.tasks.get(taskName)?.stop();
    }

    // Create new scheduled task
    const task = cron.schedule(
      this.config.cronExpression,
      async () => {
        console.log(`🔄 Starting scheduled ShipStation sync...`);
        const startTime = Date.now();

        try {
          const syncService = new ShipStationSyncService();
          const result = await syncService.syncShipments(this.config.dateRange);

          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(
            `✅ ShipStation sync completed in ${duration}s: ${result.casesCreated} cases created`
          );

          // Send completion notification
          if (this.config.notifyOnCompletion) {
            await sendEmail({
              to: this.config.adminEmail,
              subject: "ShipStation Sync Completed",
              html: `
                <h2>ShipStation Sync Completed</h2>
                <p>The scheduled ShipStation sync has completed successfully.</p>
                <ul>
                  <li><strong>Duration:</strong> ${duration} seconds</li>
                  <li><strong>Cases Created:</strong> ${result.casesCreated}</li>
                  <li><strong>Shipments Processed:</strong> ${result.shipmentsProcessed}</li>
                  <li><strong>Adjustments Detected:</strong> ${result.adjustmentsDetected}</li>
                </ul>
                <p>Time: ${new Date().toLocaleString()}</p>
              `,
            });
          }
        } catch (error: any) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error(`❌ ShipStation sync failed after ${duration}s:`, error);

          // Send error notification
          if (this.config.notifyOnError) {
            await sendEmail({
              to: this.config.adminEmail,
              subject: "ShipStation Sync Failed",
              html: `
                <h2>ShipStation Sync Failed</h2>
                <p>The scheduled ShipStation sync encountered an error.</p>
                <ul>
                  <li><strong>Duration:</strong> ${duration} seconds</li>
                  <li><strong>Error:</strong> ${error.message}</li>
                </ul>
                <p>Time: ${new Date().toLocaleString()}</p>
                <p>Please check the logs for more details.</p>
              `,
            });
          }
        }
      },
      {
        scheduled: true,
        timezone: "America/New_York", // EST/EDT
      }
    );

    this.tasks.set(taskName, task);
    task.start();
  }

  /**
   * Update scheduler configuration
   */
  static updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart scheduler with new config
    if (this.config.enabled) {
      this.scheduleShipStationSync();
    } else {
      this.stopAll();
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  /**
   * Trigger manual sync (outside of schedule)
   */
  static async triggerManualSync(): Promise<any> {
    console.log("🔄 Manual ShipStation sync triggered...");
    const syncService = new ShipStationSyncService();
    return await syncService.syncShipments(this.config.dateRange);
  }

  /**
   * Stop all scheduled tasks
   */
  static stopAll(): void {
    this.tasks.forEach((task) => task.stop());
    this.tasks.clear();
    console.log("🛑 All scheduled tasks stopped");
  }

  /**
   * Get scheduler status
   */
  static getStatus(): {
    enabled: boolean;
    activeTasks: string[];
    nextRun: string | null;
  } {
    const activeTasks = Array.from(this.tasks.keys());
    let nextRun: string | null = null;

    if (this.config.enabled && activeTasks.length > 0) {
      // Calculate next run time based on cron expression
      // This is a simplified version - in production, use a cron parser library
      nextRun = "Next run calculated based on cron expression";
    }

    return {
      enabled: this.config.enabled,
      activeTasks,
      nextRun,
    };
  }
}

// Initialize scheduler on module load
DailySyncScheduler.initialize();
