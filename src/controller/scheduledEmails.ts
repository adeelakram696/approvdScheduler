import { config } from "../config";
import { durations } from "../config/emailData";

import { ProgressEmail } from "../services/progressEmail";
import { logger } from "../utils/logger";

export const DailyProgressEmail = async () => {
  logger.info("Daily Progress Email Started");
  logger.info(`Daily with ${JSON.stringify(config)}`);
  await ProgressEmail(durations.daily);
  logger.info("Daily Progress Email Ended");
}
export const WeeklyProgressEmail = async () => {
  logger.info("Weekly Progress Email Started");
  logger.info(`Weekly with ${JSON.stringify(config)}`);
  await ProgressEmail(durations.weekly);
  logger.info("Weekly Progress Email Ended");
}
export const MonthlyProgressEmail = async () => {
  logger.info("Monthly Progress Email Started");
  logger.info(`Monthly with ${JSON.stringify(config)}`);
  await ProgressEmail(durations.monthly);
  logger.info("Monthly Progress Email Ended");
}
