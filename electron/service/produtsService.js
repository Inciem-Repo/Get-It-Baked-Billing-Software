import db from "../db/dbSetup.js";
import { buildSelectQuery } from "../lib/buildQueries.js";

export function getProductsDetails() {
  try {
    const rows = db.prepare(buildSelectQuery("products")).all();
    if (rows.length === 0) {
      console.log(`No data found in MySQL for table: ${table}`);
      return;
    }
    return rows;
  } catch (error) {
    return error;
  }
}
