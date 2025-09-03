import { buildInsertQuery, buildSelectQuery } from "../lib/db/buildQueries.js";
import db from "../db/dbSetup.js";
import { getMySqlConnection } from "../db/mysqlClient.js";

// export async function syncTable(table) {
//   const mysqlConn = await getMySqlConnection();
//   const [rows] = await mysqlConn.execute(buildSelectQuery(table));

//   if (rows.length === 0) {
//     console.log(`No data found in MySQL for table: ${table}`);
//     return;
//   }
//   const fields = Object.keys(rows[0]);
//   const placeholders = fields.map(() => "?").join(", ");
//   const insertQuery = `INSERT INTO ${table} (${fields.join(
//     ","
//   )}) VALUES (${placeholders})`;
//   const insert = db.prepare(insertQuery);

//   const insertMany = db.transaction((data) => {
//     for (const row of data) {
//       // Convert Date objects to ISO strings- live db have to change
//       const values = Object.values(row).map((val) =>
//         val instanceof Date ? val.toISOString() : val
//       );
//       insert.run(Object.values(values));
//     }
//   });

//   insertMany(rows);
//   console.log(`Synced ${rows.length} rows into ${table}`);
// }

export async function syncTable(
  localTable,
  filterValue = null,
  liveTableName = null,
  filterKey = null
) {
  const tableName = liveTableName || localTable;
  let conditions = {};

  if (filterValue) {
    conditions[filterKey || "id"] = filterValue;
  }
  const selectQuery = Array.isArray(filterValue)
    ? `SELECT * FROM ${tableName} WHERE ${
        filterKey || "id"
      } IN (${filterValue.join(",")})`
    : buildSelectQuery(tableName, conditions);

  const mysqlConn = await getMySqlConnection();
  const [rows] = await mysqlConn.execute(selectQuery);
  if (!rows.length) {
    console.log(`No data found in MySQL for table: ${tableName}`);
    return [];
  }
  const fields = Object.keys(rows[0]);
  const insertQuery = buildInsertQuery(localTable, fields);
  const insert = db.prepare(insertQuery);
  const insertMany = db.transaction((data) => {
    for (const row of data) {
      const values = Object.values(row).map((val) =>
        val instanceof Date ? val.toISOString() : val
      );
      insert.run(values);
    }
  });

  insertMany(rows);
  console.log(`Synced ${rows.length} rows into ${localTable}`);
  return rows;
}
