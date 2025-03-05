const axios = require("axios");
require("dotenv").config();

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

const mondayAPI = axios.create({
  baseURL: "https://api.monday.com/v2",
  headers: {
    "Content-Type": "application/json",
    Authorization: MONDAY_API_KEY,
  },
});

async function fetchMondayData() {
  try {
    const query = `
      {
        boards(ids: ${MONDAY_BOARD_ID}) {
          name
          items {
            id
            name
            column_values {
              id
              title
              text
            }
          }
        }
      }
    `;

    const response = await mondayAPI.post("/", { query });
    return response.data.data.boards[0];
  } catch (error) {
    console.error("Error fetching Monday.com data:", error);
    return null;
  }
}

module.exports = { fetchMondayData };
