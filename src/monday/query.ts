import _ from "lodash";
import { boards } from "../config";
import { calculateDateDifference, convertToNumber, getColumnValue } from "../utils/helpers";
import monday from "../utils/mondaySdk";
import { columnIds } from "../config/columns";

export const fetchAllMembers = async () => {
  const usersQuery = `query {
    teams(ids: [1070128]) {
      users(kind: non_guests) {
        id
        name
        is_admin
      }
    }
  }`;
  const usersResp = await monday.api(usersQuery);
  const usersList = usersResp.data.teams[0].users?.filter((user: { is_admin: boolean; }) => !user.is_admin);
  return usersList;
};
export const fetchBoardColorColumnStrings = async (boardId: any, columnId: any) => {
  const query = `query {
    boards(ids: [${boardId}]) {
      columns(ids: ["${columnId}"]) {
        settings_str
      }
    }
  }`;
  const res = await monday.api(query);
  const column = JSON.parse(res.data.boards[0].columns[0].settings_str);
  return column.labels;
};
export const fetchTeamSaleActivities = async (cursor: string, duration: any, actionIds: any, empIds: any, boardId: any) => {
  const query = `query {
    saleActivities: boards(ids: [${boardId}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
          { column_id: "date__1", compare_value: ${duration}, operator: any_of}
          { column_id: "status", compare_value: [${actionIds}], operator: any_of}
          { column_id: "person", compare_value: [${empIds}], operator: any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          name
          column_values(ids: ["person", "status", "date4", "date__1"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  return res;
};
export const getTeamTotalActivities = async (duration: any, actionIds: any, employees: any[]) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  let res = null;
  let itemsList: any[] = [];
  res = null;
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchTeamSaleActivities(
      res ? res.data.saleActivities[0]?.items_page?.cursor : null,
      duration,
      actionIds,
      empIds,
      boards.salesActivities3,
    );
    itemsList = [...itemsList, ...((res.data?.saleActivities || [])[0]?.items_page?.items || [])];
  } while ((res.data?.saleActivities || [])[0]?.items_page?.cursor);
  const activities = itemsList.reduce((prev, curr) => {
    const type = curr?.column_values?.find((col: { id: string; }) => col.id === 'status');
    const owner = getColumnValue(curr.column_values || [], 'person');
    const obj = prev;
    if (_.isEmpty(owner)) return obj;
    const person = employees.find(
      (emp: { id: any; }) => owner.personsAndTeams[0].id === Number(emp.id),
    );
    if (!person) return obj;
    const actionType = type.text.toLowerCase();
    if (!obj[person.id]) {
      obj[person.id] = { [actionType]: 1, person };
    } else if (!obj[person.id][actionType]) {
      obj[person.id] = { ...obj[person.id], [actionType]: 1 };
    } else {
      obj[person.id][actionType] += 1;
    }
    return obj;
  }, {});

  return activities;
};

export const fetchDealFunds = async (cursor: any, employees: any[], duration: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  const query = `query {
    totalFunds: boards(ids: [${boards.deals}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
          { column_id: "${columnIds.deals.funded__date}", compare_value: ${duration}, operator: any_of}
          { column_id: "${columnIds.deals.assginee}", compare_value: [${empIds}], operator: any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.deals.assginee}", "${columnIds.deals.last_rep_assigned_date}", "${columnIds.deals.funded__date}"]) {
            id
            text
            value
          }
          subitems {
            id
            name
            column_values (ids: ["${columnIds.subItem.status}", "${columnIds.subItem.funding_amount}"]) {
              id
              text
              value
            }
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  return res;
};

export const getDealFunds = async (employees: any[], duration: any) => {
  let res = null;
  let itemsList: any[] = [];

  // Fetch all deals from API
  do {
    res = await fetchDealFunds(
      res ? (res.data?.totalFunds || [])[0].items_page.cursor : null,
      employees,
      duration
    );
    itemsList = [...itemsList, ...(res.data?.totalFunds || [])[0].items_page.items];
  } while ((res.data?.totalFunds || [])[0].items_page.cursor);
  // Reduce function to process deals
  const funds = itemsList.reduce((prev, curr) => {
    const obj = prev;

    // Check if the deal is selected
    const selected = curr.subitems.find(
      (item: { column_values: any[] }) =>
        item.column_values.find(
          (col: { id: any; text: string }) =>
            col.id === columnIds.subItem.status && col.text === "Selected"
        )
    );
    if (!selected) return obj;

    // Get deal owner
    const owner = getColumnValue(curr.column_values || [], columnIds.deals.assginee);
    if (_.isEmpty(owner)) return obj;
    const person = employees.find(
      (emp: { id: any }) => owner.personsAndTeams[0].id === Number(emp.id)
    );
    if (!person) return obj;

    // Extract deal values
    const actionType = "totalfunds";
    const actionTypeDeals = "fully funded";
    const lastRepAssignedDate = getColumnValue(curr.column_values || [], columnIds.deals.last_rep_assigned_date);
    const fundedDate = getColumnValue(curr.column_values || [], columnIds.deals.funded__date);
    const fundAmount = convertToNumber(selected.column_values[1].text);

    // Calculate date difference (days)
    const daysDifference = calculateDateDifference(lastRepAssignedDate?.date, fundedDate?.date);

    // Initialize person object if not present
    if (!obj[person.id]) {
      obj[person.id] = {
        [actionType]: fundAmount,
        [actionTypeDeals]: 1,
        totalDaysDifference: daysDifference,
        totalDeals: 1,
        person,
      };
    } else {
      // Update person's stats
      obj[person.id][actionType] += fundAmount;
      obj[person.id][actionTypeDeals] += 1;
      obj[person.id].totalDaysDifference += daysDifference;
      obj[person.id].totalDeals += 1;
    }

    return obj;
  }, {} as Record<string, any>);

  // ✅ Compute averages per person
  Object.keys(funds).forEach((personId) => {
    const personData = funds[personId];
    const averageFunds = personData.totalfunds;
    const averageDaysDifference = personData.totalDaysDifference / personData.totalDeals;

    funds[personId] = {
      ...personData,
      averageFunds: averageFunds.toFixed(2), // Format to 2 decimals
      averageDaysDifference: Math.round(averageDaysDifference), // Round to nearest whole number
    };
  });

  return funds;
};

/* ---- Manager Board Funnel --------- */

export const fetchLeads = async (cursor: any, employees: any, duration: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  const query = `query {
    boards(ids: [${boards.leads}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
          { column_id: "${columnIds.leads.last_rep_assigned_date}", compare_value: ${duration}, operator: any_of }
          { column_id: "${columnIds.leads.assginee}", compare_value: [${empIds}], operator: any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.leads.assginee}"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  return res;
};
export const fetchDeals = async (cursor: any, employees: any, duration: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  const query = `query {
    boards(ids: [${boards.deals}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
          { column_id: "${columnIds.deals.last_rep_assigned_date}", compare_value: ${duration}, operator: any_of }
          { column_id: "${columnIds.deals.assginee}", compare_value: [${empIds}], operator: any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.deals.assginee}"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  if (res?.data?.boards?.[0]?.items_page?.items) {
    res.data.boards[0].items_page.items = res.data.boards[0].items_page.items.map((item: any) => ({
      ...item,
      isDeal: true,
    }));
  }
  return res;
};

export const getAssignedLeadsDeals = async (employees: any, duration: any) => {
  let res = null;
  let itemsList: any[] = [];
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchLeads(
      res ? res.data.boards[0].items_page.cursor : null,
      employees,
      duration,
    );
    itemsList = [...itemsList, ...res.data.boards[0].items_page.items];
  } while (res.data.boards[0].items_page.cursor);
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchDeals(
      res ? res.data.boards[0].items_page.cursor : null,
      employees,
      duration,
    );
    itemsList = [...itemsList, ...res.data.boards[0].items_page.items];
  } while (res.data.boards[0].items_page.cursor);
  const data = itemsList.reduce((prev, curr) => {
    const owner = getColumnValue(curr.column_values || [], curr.isDeal ? columnIds.deals.assginee : columnIds.leads.assginee);
    const obj = prev;
    if (_.isEmpty(owner)) return obj;
    const person = employees.find(
      (emp: { id: any; }) => owner.personsAndTeams[0].id === Number(emp.id),
    );
    if (!person) return obj;
    if (!obj[person.id]) {
      obj[person.id] = 1;
    } else {
      obj[person.id] += 1;
    }
    return obj;
  }, {});
  return data;
};


export const fetchAllLeadsAssigned = async (cursor: any, employees: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  // excluded Disqualified, Nurtured
  const query = `query {
    boards(ids: [${boards.leads}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
          { column_id: "${columnIds.leads.assginee}", compare_value: [${empIds}], operator: any_of}
          { column_id: "${columnIds.leads.stage}", compare_value: [11,14], operator: not_any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.leads.assginee}"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  return res;
};
export const fetchAllDealsAssigned = async (cursor: any, employees: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  // excluding funded, Dead/DNC,Lost Deal,Declined,DQ,Client Rejected,Nurtured,Lost Deals
  const query = `query {
    boards(ids: [${boards.deals}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
          { column_id: "${columnIds.deals.assginee}", compare_value: [${empIds}], operator: any_of}
          { column_id: "${columnIds.deals.stage}", compare_value: [1,5,6,8,9,10,11,14], operator: not_any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.deals.assginee}"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  if (res?.data?.boards?.[0]?.items_page?.items) {
    res.data.boards[0].items_page.items = res.data.boards[0].items_page.items.map((item: any) => ({
      ...item,
      isDeal: true,
    }));
  }
  return res;
};

export const getAllAssignedLeadsDeals = async (employees: any) => {
  let res = null;
  let itemsList: any[] = [];
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchAllLeadsAssigned(
      res ? res.data.boards[0].items_page.cursor : null,
      employees,
    );
    itemsList = [...itemsList, ...res.data.boards[0].items_page.items];
  } while (res.data.boards[0].items_page.cursor);
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchAllDealsAssigned(
      res ? res.data.boards[0].items_page.cursor : null,
      employees,
    );
    itemsList = [...itemsList, ...res.data.boards[0].items_page.items];
  } while (res.data.boards[0].items_page.cursor);
  const data = itemsList.reduce((prev, curr) => {
    const owner = getColumnValue(curr.column_values || [], curr.isDeal ? columnIds.deals.assginee : columnIds.leads.assginee);
    const obj = prev;
    if (_.isEmpty(owner)) return obj;
    const person = employees.find(
      (emp: { id: any; }) => owner.personsAndTeams[0].id === Number(emp.id),
    );
    if (!person) return obj;
    if (!obj[person.id]) {
      obj[person.id] = 1;
    } else {
      obj[person.id] += 1;
    }
    return obj;
  }, {});
  return data;
};

export const fetchLeadsDisqualified = async (cursor: any, employees: any, duration: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  const query = `query {
    boards(ids: [${boards.leads}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
        { column_id: "${columnIds.deals.last_rep_assigned_date}", compare_value: ${duration}, operator: any_of }
          { column_id: "${columnIds.leads.assginee}", compare_value: [${empIds}], operator: any_of}
          { column_id: "${columnIds.leads.stage}", compare_value: [11], operator: any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.leads.assginee}"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  return res;
};
export const fetchDealsDisqualified = async (cursor: any, employees: any, duration: any) => {
  const empIds = employees.map((emp: { id: any; }) => (`"person-${emp.id}"`));
  const query = `query {
    boards(ids: [${boards.deals}]) {
      items_page(
      ${!cursor ? `query_params: {
        rules: [
        { column_id: "${columnIds.deals.last_rep_assigned_date}", compare_value: ${duration}, operator: any_of }
          { column_id: "${columnIds.deals.assginee}", compare_value: [${empIds}], operator: any_of}
          { column_id: "${columnIds.deals.stage}", compare_value: [9], operator: any_of}
       ]
       }` : ''}
        limit: 500
        ${cursor ? `cursor: "${cursor}"` : ''}
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["${columnIds.deals.assginee}"]) {
            id
            text
            value
          }
        }
      }
    }
  }`;
  const res = await monday.api(query);
  if (res?.data?.boards?.[0]?.items_page?.items) {
    res.data.boards[0].items_page.items = res.data.boards[0].items_page.items.map((item: any) => ({
      ...item,
      isDeal: true,
    }));
  }
  return res;
};

export const getDisqualifiedLeadsDeals = async (employees: any, duration: any) => {
  let res = null;
  let itemsList: any[] = [];
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchLeadsDisqualified(
      res ? res.data.boards[0].items_page.cursor : null,
      employees,
      duration
    );
    itemsList = [...itemsList, ...res.data.boards[0].items_page.items];
  } while (res.data.boards[0].items_page.cursor);
  do {
    // eslint-disable-next-line no-await-in-loop
    res = await fetchDealsDisqualified(
      res ? res.data.boards[0].items_page.cursor : null,
      employees,
      duration
    );
    itemsList = [...itemsList, ...res.data.boards[0].items_page.items];
  } while (res.data.boards[0].items_page.cursor);
  const data = itemsList.reduce((prev, curr) => {
    const owner = getColumnValue(curr.column_values || [], curr.isDeal ? columnIds.deals.assginee : columnIds.leads.assginee);
    const obj = prev;
    if (_.isEmpty(owner)) return obj;
    const person = employees.find(
      (emp: { id: any; }) => owner.personsAndTeams[0].id === Number(emp.id),
    );
    if (!person) return obj;
    if (!obj[person.id]) {
      obj[person.id] = 1;
    } else {
      obj[person.id] += 1;
    }
    return obj;
  }, {});
  return data;
};
