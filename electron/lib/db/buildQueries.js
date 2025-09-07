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

export function buildSearchQuery(table, searchKey, searchTerm) {
  const where = searchTerm
    ? `${searchKey} LIKE '%${searchTerm.replace(/'/g, "''")}%'`
    : "";
  return (
    `SELECT id, name FROM ${table}` +
    (where ? ` WHERE ${where}` : "") +
    " LIMIT 50"
  );
}
