import { durations } from "./config/emailData";

export type boardId = string | number | undefined;
export interface BOARDS {
  deals: boardId;
  leads: boardId;
  salesActivities: boardId;
  salesActivities2: boardId;
  salesActivities3: boardId;
};
export type EmailTitle = Record<DurationValue, string>;
export type DurationKey = keyof typeof durations; // "daily" | "weekly" | "monthly"
export type DurationValue = (typeof durations)[DurationKey];
