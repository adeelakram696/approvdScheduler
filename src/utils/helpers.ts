import _ from "lodash";
import { durations } from "../config/emailData";

export function normalizeColumnValues(columnsValues: any) {
  let columns = _.mapKeys(columnsValues, 'id');
  columns = _.mapValues(columns, 'text');
  return columns;
}

export const getColumnValue = (obj: any[], col: any) => {
  const objCol = obj?.find((c: { id: any; }) => c.id === col);
  const objVal = JSON.parse(objCol.value || '{}');
  return objVal;
};

export function convertToNumber(input: any, returnIfBlank = false) {
  let value = input;
  if (returnIfBlank && value === '') return value;
  if (typeof value === 'string') {
    value = value?.replace(/,/g, '');
  }
  // Check if input is null, undefined, or a blank string
  if (typeof value !== 'number' && (value === null || value === undefined || value?.trim() === '')) {
    return 0;
  }

  // Convert the input to a number
  const number = Number(value);

  // Check if the result is a valid number
  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
}

export const calculateDateDifference = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
};

export const mergeTeamData = (activities: any, leadsAssigned: any, dealsFunded: any, allLeadsAssigned:any, allLeadsDisqualified:any, members: any) => {
  const mergedData: Record<string, any> = {};

  // Merge `activities`
  Object.keys(activities).forEach((personId) => {
    mergedData[personId] = { ...activities[personId] };
  });
  // Merge `leadsAssigned`
  Object.keys(leadsAssigned).forEach((personId) => {
    if (!mergedData[personId]) {
      mergedData[personId] = { person: members.find((m: { id: any; }) => m.id === personId) };
    }
    mergedData[personId].leadsAssigned = leadsAssigned[personId] || 0;
  });
  // Merge `allLeadsAssigned`
  Object.keys(allLeadsAssigned).forEach((personId) => {
    if (!mergedData[personId]) {
      mergedData[personId] = { person: members.find((m: { id: any; }) => m.id === personId) };
    }
    mergedData[personId].allLeadsAssigned = allLeadsAssigned[personId] || 0;
  });
  // Merge `allLeadsDisqualified`
  Object.keys(allLeadsDisqualified).forEach((personId) => {
    if (!mergedData[personId]) {
      mergedData[personId] = { person: members.find((m: { id: any; }) => m.id === personId) };
    }
    mergedData[personId].allLeadsDisqualified = allLeadsDisqualified[personId] || 0;
  });

  // Merge `dealsFunded`
  Object.keys(dealsFunded).forEach((personId) => {
    if (!mergedData[personId]) {
      mergedData[personId] = { person: { id: personId } };
    }
    mergedData[personId] = {
      ...mergedData[personId],
      ...dealsFunded[personId], // Add deal data
    };
  });
  Object.keys(mergedData).forEach((personId) => {
    const broker = mergedData[personId];

    const offerReceived = broker["offer received back"] || 0;
    const fullyFunded = broker["fully funded"] || 0;

    // Avoid division by zero
    broker.conversionRatio = offerReceived > 0 ? ((fullyFunded / offerReceived) * 100).toFixed(2) + "%" : "0%";
  });
  return mergedData;
};

export const getTimePeriod = (durationType: string) => {
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(); // Default: Today (End of period)

  switch (durationType) {
    case durations.daily:
      startDate = new Date();
      startDate.setDate(now.getDate() - 1); // Yesterday
      endDate.setDate(now.getDate() - 1)
      break;

    case durations.weekly:
      startDate = new Date();
      startDate.setDate(now.getDate() - 7); // One week ago
      endDate.setDate(now.getDate() - 1)
      break;

    case durations.monthly:
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1); // One month ago
      endDate.setDate(now.getDate() - 1)
      break;

    default:
      throw new Error("Invalid duration type provided.");
  }

  // Format dates as MM-DD-YYYY
  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month (1-based)
    const day = date.getDate().toString().padStart(2, "0"); // Day
    const year = date.getFullYear(); // Year
    return `${month}-${day}-${year}`;
  };

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};
