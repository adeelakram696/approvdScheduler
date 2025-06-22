import dotenv from "dotenv";
import { BOARDS } from "../types";

dotenv.config();
export const config = {
  mondayBoardId: process.env.MONDAY_BOARD_ID as string,
  smtp: {
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
  dailySchedule: process.env.DAILY_SCHEDULE || "30 8 * * 2-6",
  weeklySchedule: process.env.WEEKLY_SCHEDULE || "30 8 * * 1",
  monthlySchedule: process.env.MONTHLY_SCHEDULE || "30 8 1 * *",
  recipientEmails: process.env.RECIPIENT_EMAILS
  ? process.env.RECIPIENT_EMAILS.split(",").map(email => email.trim())
  : ['avim@yourapprovd.com','naveeda@yourapprovd.com', 'markd@yourapprovd.com', 'esterd@yourapprovd.com', 'biancac@yourapprovd.com'] as string[],
};

export const boards: BOARDS = {
  deals: process.env.DEALS_BOARD_ID,
  leads: process.env.LEADS_BOARD_ID,
  salesActivities: process.env.SALES_ACTIVITIES_BOARD,
  salesActivities2: process.env.SALES_ACTIVITIES2_BOARD,
  salesActivities3: process.env.SALES_ACTIVITIES3_BOARD,
};
