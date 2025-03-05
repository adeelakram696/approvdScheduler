import dotenv from "dotenv";

dotenv.config();

export const config = {
  mondayApiKey: process.env.MONDAY_API_KEY as string,
  mondayBoardId: process.env.MONDAY_BOARD_ID as string,
  smtp: {
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
  emailSchedule: process.env.EMAIL_SCHEDULE || "40 8,18 * * *",
  recipientEmail: process.env.RECIPIENT_EMAIL as string,
};
