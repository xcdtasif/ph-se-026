import cron from "node-cron";
import { deleteOldRejectedMoveInRequests } from "../modules/request/request.service";

export function startCleanupCron() {
  // Run daily at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting cleanup of old rejected move-in requests...");
    try {
      const deletedCount = await deleteOldRejectedMoveInRequests();
      console.log(
        `[CRON] Deleted ${deletedCount} old MOVE_IN_REJECTED requests`,
      );
    } catch (error) {
      console.error("[CRON] Error cleaning up rejected requests:", error);
    }
  });

  console.log("[CRON] Cleanup job scheduled (daily at 2:00 AM)");
}
