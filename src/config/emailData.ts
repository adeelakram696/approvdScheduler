import { EmailTitle } from "../types";

export const durations = {
  daily: 'YESTERDAY',
  weekly: 'ONE_WEEK_AGO',
  monthly: 'ONE_MONTH_AGO',
};

export const activityActions = [
  'Follow up call',
  'Deal Submitted',
  'Offer Received Back',
  'Fully Funded',
];

export const emailTitle: EmailTitle = {
  YESTERDAY: 'Daily Broker Performance Report',
  ONE_WEEK_AGO: 'Weekly Broker Performance Report',
  ONE_MONTH_AGO: 'Monthly Broker Performance Report',
}
