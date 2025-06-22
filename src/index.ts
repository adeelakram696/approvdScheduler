import dotenv from "dotenv";
import cron from "node-cron";
import express from "express";
import { logger } from "./utils/logger";
import { DailyProgressEmail, MonthlyProgressEmail, WeeklyProgressEmail } from "./controller/scheduledEmails";
import { config } from "./config";
import axios from "axios";

dotenv.config();
const app = express();
app.use(express.json());
app.get('/health', function(req, res) {
  res.json({
    ok: true,
    message: 'Healthy'
  });
  res.end();
});
app.get('/keep-alive', (req, res) => {
  res.send(`Server is alive at ${new Date().toISOString()}`);
});
app.listen(process.env.PORT || 3002, () => console.log(`Server is running on port ${process.env.PORT || 3002} at ${new Date().toISOString()}`));
cron.schedule(config.dailySchedule, DailyProgressEmail, { timezone: "America/New_York" });
cron.schedule(config.weeklySchedule, WeeklyProgressEmail, { timezone: "America/New_York" });
cron.schedule(config.monthlySchedule, MonthlyProgressEmail, { timezone: "America/New_York" });

// Keep-Alive Scheduler (Runs every 12 hours)
cron.schedule("0 */12 * * *", async () => {
  const response = await axios.get(`${process.env.BASE_URL}/keep-alive`);
    logger.info(`Keep-Alive API Response: ${response.data} at ${new Date().toISOString()}`);
}, { timezone: "America/New_York" });

logger.info(`ENV are configures as ${JSON.stringify(config)}`);
