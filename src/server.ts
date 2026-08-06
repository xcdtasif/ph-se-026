import app from "./app";
import config from "./config";
import { startCleanupCron } from "./jobs/cleanup.cron";

const port = Number(config.port);

if (config.nodeEnv !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  
  // Start cron jobs for local development only
  startCleanupCron();
}

export default app;