import db from "../db/dbSetup.js";
import {
  buildBillHistorySelectQuery,
  buildCountQuery,
} from "../lib/db/buildQueries.js";

export async function getBillingDetails(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;

  const query = buildBillHistorySelectQuery(filters, {
    orderBy: "b.created_at",
    orderDir: "DESC",
    limit,
    offset,
  });

  const rows = db.prepare(query).all();
  const countQuery = buildCountQuery("billing", filters);
  const totalRow = db.prepare(countQuery).get();

  return { rows, total: totalRow.count, page, limit, filters };
}
