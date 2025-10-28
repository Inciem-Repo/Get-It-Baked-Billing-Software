import {
  buildInsertOrIgnoreQuery,
  buildInsertQuery,
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
export async function syncExpense(branchId) {
  const tableName = "expense";

  const selectQuery = `
    SELECT * 
    FROM ${tableName}
    WHERE branch_id = ${branchId}
  `;

  const mysqlConn = await getMySqlConnection();
  const [rows] = await mysqlConn.execute(selectQuery);
  if (!rows.length) {
    console.log(`No expenses found for branch ${branchId}`);
    return [];
  }

  const rowsToInsert = rows.map((row) => ({
    ...row,
    date:
      typeof row.date === "string"
        ? row.date.split("T")[0]
        : row.date instanceof Date
        ? new Date(row.date.getTime() - row.date.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0]
        : String(row.date).slice(0, 10),
    synced: 1,
  }));

  const fields = Object.keys(rowsToInsert[0]);
  const placeholders = fields.map(() => "?").join(",");

  const insertQuery = `
    INSERT OR REPLACE INTO ${tableName} (${fields.join(",")})
    VALUES (${placeholders})
  `;
  const insert = db.prepare(insertQuery);

  // Insert into SQLite
  const insertMany = db.transaction((data) => {
    for (const row of data) {
      insert.run(Object.values(row));
    }
  });

  insertMany(rowsToInsert);

  console.log(
    `Synced ${rowsToInsert.length} expenses for branch ${branchId}`
  );
  updateLastSync(tableName);

  return rowsToInsert;
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
async function findMissingBills(branchId) {
  const mysqlConn = await getMySqlConnection();

  const [liveRows] = await mysqlConn.query(
    "SELECT id FROM billing WHERE branch_id = ?",
    [branchId]
  );
  const liveIds = new Set(liveRows.map((r) => String(r.id).trim()));
  const localRows = db
    .prepare("SELECT id FROM billing WHERE CAST(branch_id AS INTEGER) = ?")
    .all(branchId);
  const localIds = new Set(localRows.map((r) => String(r.id).trim()));
  const missingInLive = [...localIds].filter((id) => !liveIds.has(id));
  const missingInLocal = [...liveIds].filter((id) => !localIds.has(id));

  console.log(`Branch ${branchId}:`);
  console.log(`⚠ Missing in Live: ${missingInLive.length}`, missingInLive);
  console.log(`⚠ Missing in Local: ${missingInLocal.length}`, missingInLocal);
}
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
    if (liveRow.branch_id !== undefined) {
      liveRow.branch_id = String(parseInt(liveRow.branch_id, 10));
    }
    if (liveRow.customer_id !== undefined) {
      liveRow.customer_id = String(parseInt(liveRow.customer_id, 10));
    }

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

      let allItemsSynced = true;

      for (const item of items) {
        const { synced: itemSynced, ...liveItem } = item;
        if (liveItem.bill_id !== undefined) {
          liveItem.bill_id = String(parseInt(liveItem.bill_id, 10));
        }
        if (liveItem.productId !== undefined) {
          liveItem.productId = String(parseInt(liveItem.productId, 10));
        }

        const { query: itemQuery, values: itemValues } = buildUpsertQuery(
          "table_details",
          liveItem
        );

        try {
          await mysqlConn.execute(itemQuery, itemValues);
        } catch (err) {
          allItemsSynced = false;
          console.error(
            `Failed to push billing_item id=${item.id}, bill_id=${billId}\nError:`,
            err.message
          );
        }
      }
      if (allItemsSynced) {
        db.prepare(`UPDATE ${table} SET synced = 1 WHERE ${idField} = ?`).run(
          row[idField]
        );
      }
    } else {
      db.prepare(`UPDATE ${table} SET synced = 1 WHERE ${idField} = ?`).run(
        row[idField]
      );
    }
  }
}
async function reconcileAndResyncBilling(branchId = null) {
  const mysqlConn = await getMySqlConnection();

  const localBills = db.prepare(`SELECT id, invid, synced FROM billing`).all();
  if (!localBills.length) return;
  let liveQuery = `SELECT id, invid FROM billing`;
  let liveParams = [];
  if (branchId !== null) {
    liveQuery += ` WHERE branch_id = ?`;
    liveParams.push(branchId.toString());
  }
  const [liveRows] = await mysqlConn.execute(liveQuery, liveParams);

  const liveInvMap = new Map(liveRows.map((r) => [r.invid, r.id]));

  for (const bill of localBills) {
    const { id: localBillId, invid, synced } = bill;

    // Check if this invoice already exists in live
    if (!liveInvMap.has(invid)) {
      const row = db
        .prepare(`SELECT * FROM billing WHERE invid = ?`)
        .get(invid);
      if (!row) continue;

      if (!synced) {
        console.log(`Pushing new bill ${invid} to live`);

        const { id: _, synced: __, ...liveRow } = row;
        const { query, values } = buildUpsertQuery("billing", liveRow);
        let liveBillId;
        try {
          const [result] = await mysqlConn.execute(query, values);
          liveBillId = result.insertId;
        } catch (err) {
          console.error(
            `Reconcile failed for billing.invid=${invid}`,
            err.message
          );
          continue;
        }

        const items = db
          .prepare(`SELECT * FROM billing_items WHERE bill_id = ?`)
          .all(localBillId);
        let allItemsSynced = true;

        for (const item of items) {
          const { id: __, synced: ___, bill_id, ...liveItem } = item;
          liveItem.bill_id = liveBillId;

          const { query: itemQuery, values: itemValues } = buildUpsertQuery(
            "table_details",
            liveItem
          );

          try {
            await mysqlConn.execute(itemQuery, itemValues);
          } catch (err) {
            allItemsSynced = false;
            console.error(
              `Reconcile failed billing_item id=${item.id}, bill_invid=${invid}:`,
              err.message
            );
          }
        }

        if (allItemsSynced) {
          db.prepare(`UPDATE billing SET synced = 1 WHERE invid = ?`).run(
            invid
          );
        }
      } else {
        console.log(`Archiving bill ${invid} locally (deleted in live)`);

        db.prepare(
          `INSERT INTO billing_archive SELECT * FROM billing WHERE invid = ?`
        ).run(invid);

        db.prepare(
          `INSERT INTO billing_items_archive SELECT * FROM billing_items WHERE bill_id = ?`
        ).run(localBillId);

        db.prepare(`DELETE FROM billing_items WHERE bill_id = ?`).run(
          localBillId
        );
        db.prepare(`DELETE FROM billing WHERE id = ?`).run(localBillId);
      }
    }
  }

  await mysqlConn.end();
}
async function pullBillingForBranch(branchId) {
  const mysqlConn = await getMySqlConnection();
  try {
    const [billsRaw] = await mysqlConn.execute(
      `SELECT * FROM billing WHERE branch_id = ?`,
      [branchId]
    );

    if (!billsRaw.length) {
      console.log(`No new bills today for branch ${branchId}`);
      return;
    }

    console.log(`Got ${billsRaw.length} bills from live (today)`);

    const bills = billsRaw.map((b) => ({ ...sanitizeRow(b), synced: 1 }));

    const insertBills = db.transaction((chunk) => {
      for (const bill of chunk) {
        const exists = db
          .prepare(`SELECT 1 FROM billing WHERE invid = ? LIMIT 1`)
          .get(bill.invid);

        if (exists) {
          console.log(`Skipping existing bill (invid=${bill.invid})`);
          continue;
        }
        try {
          const row = sanitizeRow(bill);
          const { query, values } = buildInsertOrIgnoreQuery(
            "billing",
            sanitizeRow(bill)
          );
          db.prepare(query).run(values);
          console.log(`Inserted bill (invid=${bill.invid})`);
        } catch (err) {
          console.error(`Bill insert failed (invid ${bill.invid}):`, err);
        }
      }
    });

    insertBills(bills);
    const newBillIds = bills
      .map((b) => {
        const local = db
          .prepare(`SELECT id FROM billing WHERE invid = ?`)
          .get(b.invid);
        return local ? local.id : null;
      })
      .filter(Boolean);

    if (newBillIds.length) {
      const [itemsRaw] = await mysqlConn.query(
        `SELECT * FROM table_details WHERE bill_id IN (?)`,
        [newBillIds]
      );

      const insertItems = db.transaction((items) => {
        for (const item of items) {
          try {
            delete item.created_at;
            const { query, values } = buildInsertOrIgnoreQuery(
              "billing_items",
              sanitizeRow(item)
            );
            console.log(query, values);
            db.prepare(query).run(values);
          } catch (err) {
            console.error(
              `Item insert failed (bill ${item.bill_id}, item ${item.id}):`,
              err
            );
          }
        }
      });

      insertItems(itemsRaw);
      console.log(`Inserted ${itemsRaw.length} items`);
    }
  } finally {
    await mysqlConn.end();
  }
}
// Master sync
export async function runSync() {
  const branch = getUser();
  await pushLocalToLive("customers");
  await pushLocalToLive("expense");
  await syncTable("products");
  await syncTable("customers");
  await syncExpense(branch.id);
  await reconcileAndResyncBilling(branch.id);
  await pullBillingForBranch(branch.id);
  findMissingBills(branch.id);
}
