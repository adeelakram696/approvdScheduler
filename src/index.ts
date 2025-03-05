import cron from "node-cron";
import { config } from "./config/config";
import { logger } from "./utils/logger";
import { ActivityEmail } from "./controller/activityEmail";


cron.schedule(config.emailSchedule, ActivityEmail, { timezone: "America/New_York" });
logger.info(`📆 Scheduler started. Running at: ${new Date().toISOString()}  (Eastern Time)`);
