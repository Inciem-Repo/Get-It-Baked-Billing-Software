/* note: the build query page need an optimization
   buz most of the functions can make flexible without hard code the tables or fields to make reuseble fn 
*/

export function buildInsertQuery(table, fields) {
  const columns = fields.join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  return `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
}

export function buildSelectQuery(table, conditions = {}) {
  const where = Object.entries(conditions)
    .map(([key, value]) =>
      typeof value === "string" ? `${key} = '${value}'` : `${key} = ${value}`
    )
    .join(" AND ");
  return `SELECT * FROM ${table}` + (where ? ` WHERE ${where}` : "");
}

export function buildInsertOrIgnoreQuery(table, data = {}) {
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = Object.values(data);

  return {
    query: `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${placeholders})`,
    values,
  };
}

export function buildUpdateQuery(table, fields, idField = "id") {
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  return `UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`;
}

export function buildCountQuery(table, conditions = {}) {
  let whereClauses = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (value === "" || value == null) continue;

    if (key === "fromDate") {
      whereClauses.push(`billdate >= '${value}'`);
    } else if (key === "toDate") {
      whereClauses.push(`billdate <= '${value}'`);
    } else {
      whereClauses.push(
        typeof value === "string" ? `${key} = '${value}'` : `${key} = ${value}`
      );
    }
  }

  const where = whereClauses.length
    ? ` WHERE ${whereClauses.join(" AND ")}`
    : "";
  return `SELECT COUNT(*) as count FROM ${table}${where}`;
}

export function buildBillHistorySelectQuery(conditions = {}, options = {}) {
  let whereClauses = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (!value) continue;

    if (key === "fromDate") {
      whereClauses.push(`b.billdate >= '${value}'`);
    } else if (key === "toDate") {
      whereClauses.push(`b.billdate <= '${value}'`);
    } else {
      whereClauses.push(
        typeof value === "string"
          ? `b.${key} = '${value}'`
          : `b.${key} = ${value}`
      );
    }
  }

  let query = `
    SELECT ${
      options.select ||
      "b.*, c.name AS customer_name, c.mobile AS customer_mobile"
    }
    FROM billing b
    LEFT JOIN customers c ON b.customer_id = c.id
  `;

  if (whereClauses.length) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy} ${options.orderDir || "ASC"}`;
  }
  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
  }
  if (options.offset) {
    query += ` OFFSET ${options.offset}`;
  }

  return query.trim();
}

export function buildGrandTotalQuery(filters = {}) {
  let query = "SELECT SUM(grandTotalf) as totalAmount FROM billing b WHERE 1=1";

  if (filters.paymenttype) {
    query += ` AND b.paymenttype='${filters.paymenttype}'`;
  }
  if (filters.fromDate) {
    query += ` AND DATE(b.billdate) >= '${filters.fromDate}'`;
  }
  if (filters.toDate) {
    query += ` AND DATE(b.billdate) <= '${filters.toDate}'`;
  }

  return query;
}

export function buildSearchQuery(table, searchKey1, searchKey2, searchTerm) {
  const escapedTerm = searchTerm.replace(/'/g, "''");
  const where = searchTerm
    ? `(${searchKey1} LIKE '%${escapedTerm}%' OR ${searchKey2} LIKE '%${escapedTerm}%')`
    : "";
  return (
    `SELECT id, name, mobile FROM ${table}` +
    (where ? ` WHERE ${where}` : "") +
    " LIMIT 50"
  );
}

export function buildUpsertQuery(table, data) {
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = Object.values(data);

  const updateClause = Object.keys(data)
    .map((col) => `${col} = VALUES(${col})`)
    .join(", ");

  return {
    query: `INSERT INTO ${table} (${columns}) VALUES (${placeholders})
            ON DUPLICATE KEY UPDATE ${updateClause}`,
    values,
  };
}

export async function getExpenseDetails({
  page = 1,
  limit = 10,
  ...filters
} = {}) {
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

  return {
    rows,
    total: totalRow.count,
    grandTotal,
    page,
    limit,
    filters,
  };
}

export function buildExpenseSelectQuery(conditions = {}, options = {}) {
  let whereClauses = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (!value) continue;

    if (key === "fromDate") {
      whereClauses.push(`e.date >= '${value}'`);
    } else if (key === "toDate") {
      whereClauses.push(`e.date <= '${value}'`);
    } else if (key === "expense_payment") {
      // skip if "all"
      if (value !== "All") {
        whereClauses.push(`e.expense_payment = '${value}'`);
      }
    } else if (["page", "limit"].includes(key)) {
      continue;
    } else {
      whereClauses.push(
        typeof value === "string"
          ? `e.${key} = '${value}'`
          : `e.${key} = ${value}`
      );
    }
  }

  let query = `
    SELECT ${options.select || "e.*, c.name AS category_name"}
    FROM expense e
    LEFT JOIN expensecategory c ON e.category_id = c.id
  `;

  if (whereClauses.length) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy} ${options.orderDir || "ASC"}`;
  }

  // Only apply limit + offset if limit is explicitly provided
  if (options.limit && Number(options.limit) > 0) {
    query += ` LIMIT ${options.limit}`;
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
  }

  return query.trim();
}

export function buildExpenseTotalQuery(conditions = {}) {
  let whereClauses = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (!value) continue;

    if (key === "fromDate") {
      whereClauses.push(`e.date >= '${value}'`);
    } else if (key === "toDate") {
      whereClauses.push(`e.date <= '${value}'`);
    } else if (key === "expense_payment") {
      if (value !== "All") {
        whereClauses.push(`e.expense_payment = '${value}'`);
      }
    } else {
      whereClauses.push(
        typeof value === "string"
          ? `e.${key} = '${value}'`
          : `e.${key} = ${value}`
      );
    }
  }

  let query = `SELECT SUM(e.amount) AS total_amount FROM expense e`;
  if (whereClauses.length) query += ` WHERE ${whereClauses.join(" AND ")}`;
  return query.trim();
}

export function buildExpenseCountQuery(table, conditions = {}, alias = "") {
  let whereClauses = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (!value) continue;

    if (key === "fromDate") {
      whereClauses.push(
        `${alias}.${table === "expense" ? "date" : "created_at"} >= '${value}'`
      );
    } else if (key === "toDate") {
      whereClauses.push(
        `${alias}.${table === "expense" ? "date" : "created_at"} <= '${value}'`
      );
    } else if (key === "expense_payment") {
      if (value !== "All") {
        whereClauses.push(`${alias}.expense_payment = '${value}'`);
      }
    } else {
      whereClauses.push(
        typeof value === "string"
          ? `${alias}.${key} = '${value}'`
          : `${alias}.${key} = ${value}`
      );
    }
  }

  let query = `SELECT COUNT(*) AS count FROM ${table} ${alias ? alias : ""}`;
  if (whereClauses.length) query += ` WHERE ${whereClauses.join(" AND ")}`;
  return query.trim();
}

export function getTodayExpense() {
  const today = new Date().toISOString().split("T")[0];
  const query = `SELECT SUM(amount) AS total_today FROM expense WHERE date = '${today}'`;
  const row = db.prepare(query).get();
  return row?.total_today || 0;
}

// Advance Billing Query Builders

export function buildAdvanceBillHistorySelectQuery(filters = {}, options = {}) {
  const { fromDate, toDate, branch_id } = filters;
  const {
    orderBy = "b.created_at",
    orderDir = "DESC",
    limit,
    offset,
  } = options;

  if (!branch_id)
    throw new Error("branch_id is required to build advance billing query.");

  let whereClauses = [
    `b.branch_id = '${branch_id}'`,
    `b.bill_type = 'advance'`,
  ];

  if (fromDate && toDate) {
    whereClauses.push(`b.billdate BETWEEN '${fromDate}' AND '${toDate}'`);
  } else if (fromDate) {
    whereClauses.push(`b.billdate >= '${fromDate}'`);
  } else if (toDate) {
    whereClauses.push(`b.billdate <= '${toDate}'`);
  }

  let query = `
    SELECT 
      b.id,
      b.totalTaxableValuef,
      b.totalCgstf,
      b.totalIgstf,
      b.discountPercentf,
      b.grandTotalf,
      b.paymenttype,
      b.billdate,
      b.created_at,
      b.advanceamount,
      b.balanceAmount,
      b.customernote,           
      c.id AS customer_id,       
      c.name AS customer_name,    
      c.mobile AS customer_mobile
    FROM advance_billing AS b
    LEFT JOIN customers AS c ON b.customer_id = c.id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY ${orderBy} ${orderDir}
  `;

  if (limit && offset >= 0) {
    query += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  return query.trim();
}
export function buildAdvanceCountQuery(filters = {}) {
  const { fromDate, toDate, branch_id } = filters;
  let whereClauses = [`branch_id = '${branch_id}'`, `bill_type = 'advance'`];

  if (fromDate && toDate) {
    whereClauses.push(`billdate BETWEEN '${fromDate}' AND '${toDate}'`);
  } else if (fromDate) {
    whereClauses.push(`billdate >= '${fromDate}'`);
  } else if (toDate) {
    whereClauses.push(`billdate <= '${toDate}'`);
  }

  return `
    SELECT COUNT(*) AS count
    FROM advance_billing
    WHERE ${whereClauses.join(" AND ")}
  `;
}
export function buildAdvanceGrandTotalQuery(filters = {}) {
  const { fromDate, toDate, branch_id } = filters;
  let whereClauses = [`branch_id = '${branch_id}'`, `bill_type = 'advance'`];

  if (fromDate && toDate) {
    whereClauses.push(`billdate BETWEEN '${fromDate}' AND '${toDate}'`);
  } else if (fromDate) {
    whereClauses.push(`billdate >= '${fromDate}'`);
  } else if (toDate) {
    whereClauses.push(`billdate <= '${toDate}'`);
  }

  return `
    SELECT SUM(grandTotalf) AS totalAmount
    FROM advance_billing
    WHERE ${whereClauses.join(" AND ")}
  `;
}
