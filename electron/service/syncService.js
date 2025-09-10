import {
  buildInsertOrIgnoreQuery,
  buildSelectQuery,
  buildUpdateQuery,
  buildUpsertQuery,
} from "../lib/buildQueries.js";
import db from "../db/dbSetup.js";
import { getMySqlConnection } from "../db/mysqlClient.js";
import { getCurrentMySQLDateTime, sanitizeRow } from "../lib/helper.js";
import { getUser } from "./userService.js";

// sync data  live to local DB
export async function syncTable(
  localTable,
  filterValue = null,
  liveTableName = null,
  filterKey = null,
  markAsSynced = true
) {
  const tableName = liveTableName || localTable;
  let selectQuery;

  if (Array.isArray(filterValue)) {
    const key = filterKey || "id";
    const inClause = filterValue.map((val) =>
      typeof val === "string" ? `'${val}'` : val
    );
    selectQuery = `SELECT * FROM ${tableName} WHERE ${key} IN (${inClause.join(
      ","
    )})`;
  } else {
    const conditions = {};
    if (filterValue !== null) {
      conditions[filterKey || "id"] = filterValue;
    }
    selectQuery = buildSelectQuery(tableName, conditions);
  }
  const mysqlConn = await getMySqlConnection();
  const [rows] = await mysqlConn.execute(selectQuery);

  if (!rows.length) {
    console.log(`No data found in MySQL for table: ${tableName}`);
    return [];
  }

  const rowsToInsert = rows.map((row) => ({
    ...row,
    ...(localTable === "billing" && markAsSynced ? { synced: 1 } : {}),
  }));

  const fields = Object.keys(rowsToInsert[0]);
  const placeholders = fields.map(() => "?").join(",");

  const insertQuery = `
    INSERT OR REPLACE INTO ${localTable} (${fields.join(",")})
    VALUES (${placeholders})
  `;
  const insert = db.prepare(insertQuery);

  const insertMany = db.transaction((data) => {
    for (const row of data) {
      const values = Object.values(row).map((val) =>
        val instanceof Date ? val.toISOString() : val
      );
      insert.run(values);
    }
  });

  insertMany(rowsToInsert);

  console.log(`Synced ${rowsToInsert.length} rows into ${localTable}`);
  updateLastSync(localTable);
  return rowsToInsert;
}

// Push local rows to live
async function pushLocalToLive(
  table,
  localCondition = "synced = 0",
  idField = "id"
) {
  let localSelectQuery;
  if (typeof localCondition === "string") {
    localSelectQuery = `SELECT * FROM ${table} WHERE ${localCondition}`;
  } else {
    localSelectQuery = buildSelectQuery(table, localCondition);
  }
  const localRows = db.prepare(localSelectQuery).all();
  if (!localRows.length) return;

  const mysqlConn = await getMySqlConnection();

  for (const row of localRows) {
    const { synced, ...liveRow } = row;
    const { query, values } = buildUpsertQuery(table, liveRow);

    try {
      await mysqlConn.execute(query, values);
    } catch (err) {
      console.error("Failed to push row:", row, "\nError:", err.message);
      continue;
    }
    if (table === "billing") {
      const billId = row[idField];
      const itemSelectQuery = buildSelectQuery("billing_items", {
        bill_id: billId,
      });
      const items = db.prepare(itemSelectQuery).all();

      for (const item of items) {
        const { synced: itemSynced, ...liveItem } = item;

        const { query: itemQuery, values: itemValues } = buildUpsertQuery(
          "table_details",
          liveItem
        );

        try {
          await mysqlConn.execute(itemQuery, itemValues);
        } catch (err) {
          console.error(
            `Failed to push billing_item id=${item.id}, bill_id=${billId}\nError:`,
            err.message
          );
        }
      }
    }
    db.prepare(`UPDATE ${table} SET synced = 1 WHERE ${idField} = ?`).run(
      row[idField]
    );
  }
}

// pull the new bill form the db based on creatd time
async function pullBillingForBranch(branchId, lastSyncAt = null) {
  const mysqlConn = await getMySqlConnection();
  let billingQuery = `SELECT * FROM billing WHERE branch_id = ?`;
  const params = [branchId];
  if (lastSyncAt) {
    billingQuery += ` AND created_at >= ?`;
    params.push(lastSyncAt);
  }
  const [billsRaw] = await mysqlConn.execute(billingQuery, params);
  console.log(`${billsRaw.length} new billing records found`);
  if (!billsRaw.length) {
    updateLastSync("billing");
    return;
  }

  const bills = billsRaw.map((b) => ({ ...sanitizeRow(b), synced: 1 }));
  const insertBills = db.transaction((bills) => {
    for (const bill of bills) {
      const { query, values } = buildInsertOrIgnoreQuery("billing", bill);
      db.prepare(query.replace("OR IGNORE", "OR REPLACE")).run(values);
    }
  });
  insertBills(bills);
  for (const bill of bills) {
    const [itemsRaw] = await mysqlConn.execute(
      buildSelectQuery("table_details", { bill_id: bill.id })
    );

    if (!itemsRaw.length) continue;

    const items = itemsRaw.map(sanitizeRow);

    const insertItems = db.transaction((items) => {
      for (const item of items) {
        const { query, values } = buildInsertOrIgnoreQuery(
          "billing_items",
          item
        );
        db.prepare(query.replace("OR IGNORE", "OR REPLACE")).run(values);
      }
    });
    insertItems(items);
  }

  updateLastSync("billing");
  console.log(`Billing sync completed for branch ${branchId}`);
}

// get the sync time
function getLastSync(table) {
  const query = buildSelectQuery("sync_meta", { table_name: table });
  const row = db.prepare(query).get();
  return row ? row.last_sync_at : null;
}

// update the sync time on the db
function updateLastSync(table) {
  const current = getCurrentMySQLDateTime();
  const insert = buildInsertOrIgnoreQuery("sync_meta", {
    table_name: table,
    last_sync_at: current,
  });
  db.prepare(insert.query).run(insert.values);
  const update = buildUpdateQuery("sync_meta", ["last_sync_at"], "table_name");
  db.prepare(update).run([current, table]);
  console.log(`Updated last_sync_at for ${table} → ${current}`);
}

// Master sync
export async function runSync() {
  const branch = getUser();
  await pushLocalToLive("billing");
  await pushLocalToLive("customers");
  await syncTable("products");
  await syncTable("customers");
  const lastBillingSync = getLastSync("billing");
  await pullBillingForBranch(branch.id, lastBillingSync);
}
