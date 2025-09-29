import db from "../db/dbSetup.js";
import {
  buildExpenseCountQuery,
  buildExpenseSelectQuery,
  buildExpenseTotalQuery,
} from "../lib/buildQueries.js";

export async function getExpenseDetails(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;
  const query = buildExpenseSelectQuery(filters, {
    orderBy: "e.date",
    orderDir: "DESC",
    limit,
    offset,
  });
  const rows = db.prepare(query).all();

  const countQuery = buildExpenseCountQuery("expense", filters, "e");
  const totalRow = db.prepare(countQuery).get();

  const grandTotalQuery = buildExpenseTotalQuery(filters);
  const totalAmountRow = db.prepare(grandTotalQuery).get();
  const grandTotal = totalAmountRow?.total_amount || 0;

  const today = new Date().toISOString().split("T")[0];
  const todayQuery = `SELECT SUM(amount) AS total_today FROM expense WHERE date = '${today}'`;
  const todayRow = db.prepare(todayQuery).get();
  const totalToday = todayRow?.total_today || 0;

  return {
    rows,
    total: totalRow.count,
    grandTotal,
    totalToday,
    page,
    limit,
    filters,
  };
}

export function getExpenseCategories() {
  const stmt = db.prepare(`
    SELECT id, name 
    FROM expensecategory 
    WHERE status = 1
    ORDER BY name ASC
  `);
  return stmt.all();
}
export function addExpense(expenseData) {
  const {
    branch_id,
    amount,
    expense_payment,
    category_id,
    remarks = null,
    date = new Date().toISOString().slice(0, 10), 
  } = expenseData;

  const stmt = db.prepare(`
    INSERT INTO expense (branch_id, amount, expense_payment, category_id, remarks, date,synced)
    VALUES (?, ?, ?, ?, ?, ?,?)
  `);

  const result = stmt.run(
    branch_id,
    amount,
    expense_payment,
    category_id,
    remarks,
    date,
    0
  );

  return {
    id: result.lastInsertRowid,
    ...expenseData,
    synced: 0,
    date,
  };
}
