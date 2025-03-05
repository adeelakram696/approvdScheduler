import { sendEmail } from "../services/emailService";
import { logger } from "../utils/logger"

export const ActivityEmail = async () => {
  logger.info(`Activity Email Running at ${new Date().toISOString()}`);
  logger.info("📡 Fetching data from Monday.com...");
  // const data = await fetchMondayData();
  const data = [
    {
      name: "Item 1",
      details: "Details 1",
    },
    {
      name: "Item 2",
      details: "Details 2",
    }
  ]
  if (data) {
    logger.info("📤 Sending email...");
    await sendEmail(data);
  } else {
    logger.info("⚠ No data found.");
  }
}
