import fs from "fs";
import { boards } from "../config";
import { activityActions, emailTitle } from "../config/emailData";
import { fetchAllMembers, fetchBoardColorColumnStrings, getAllAssignedLeadsDeals, getAssignedLeadsDeals, getDealFunds, getDisqualifiedLeadsDeals, getTeamTotalActivities } from "../monday/query";
import { sendEmail } from "../services/emailService";
import { getTimePeriod, mergeTeamData } from "../utils/helpers";
import { log, logger } from "../utils/logger"
import handlebars from "handlebars";
import { DurationValue } from "../types";

export const ProgressEmail = async (duration: DurationValue) => {
  try{
  logger.info(`Activity Email Running at ${new Date().toISOString()}`);
  logger.info("📡 Fetching members");
  const members = await fetchAllMembers();
  logger.info("📡 Fetching activity statuses");
  const statuses = await fetchBoardColorColumnStrings(boards.salesActivities3, 'status');
  logger.info("📡 extracting action ids");
  const actionIds = Object.keys(statuses).filter((key) => ( activityActions.includes(statuses[key]) ));
  logger.info("📡 Fetching team total activities");
  const activities = await getTeamTotalActivities(duration, actionIds, members);
  logger.info("📡 Fetching deal funds");
  const dealsFunded = await getDealFunds(members, duration);
  logger.info("📡 Fetching AssignedLeads");
  const leadsAssigned = await getAssignedLeadsDeals(members, duration);
  logger.info("📡 Fetching AllAssignedLeads");
  const allLeadsAssigned = await getAllAssignedLeadsDeals(members);
  logger.info("📡 Fetching getDisqualifiedLeadsDeals");
  const allLeadsDisqualified = await getDisqualifiedLeadsDeals(members, duration);
  logger.info("📡 merging data");
  const data = mergeTeamData(activities, leadsAssigned, dealsFunded, allLeadsAssigned, allLeadsDisqualified, members);
  logger.info("📡 merged data");
  const timePeriod = getTimePeriod(duration);
  logger.info(`${timePeriod.start} - ${timePeriod.end}`);
  if (data) {
    const templateSource = fs.readFileSync("src/templates/emailTemplate.hbs", "utf8");
    const template = handlebars.compile(templateSource);
    const emailContent = template({ brokers: data, timePeriod });
    logger.info("📤 Sending email...");
    await sendEmail(emailContent, emailTitle[duration]);
  } else {
    logger.info("⚠ No data found.");
  }
} catch(err: any) {
  const errorObj = { errorMsg: 'Processing failed', message: err.message,  stack: err.stack, err };
  log(errorObj.errorMsg, errorObj);
  return;
}
}
