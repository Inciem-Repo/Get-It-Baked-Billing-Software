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
// async function pushLocalToLive(
//   table,
//   localCondition = "synced = 0",
//   idField = "id"
// ) {
//   let localSelectQuery;
//   if (typeof localCondition === "string") {
//     localSelectQuery = `SELECT * FROM ${table} WHERE ${localCondition}`;
//   } else {
//     localSelectQuery = buildSelectQuery(table, localCondition);
//   }
//   const localRows = db.prepare(localSelectQuery).all();
//   if (!localRows.length) return;

//   const mysqlConn = await getMySqlConnection();

//   for (const row of localRows) {
//     const { synced, ...liveRow } = row;

//     // 🔥 Fix branch_id and any other REAL->VARCHAR conversions
//     if (liveRow.branch_id !== undefined) {
//       liveRow.branch_id = String(parseInt(liveRow.branch_id, 10));
//     }
//     if (liveRow.customer_id !== undefined) {
//       liveRow.customer_id = String(parseInt(liveRow.customer_id, 10));
//     }

//     const { query, values } = buildUpsertQuery(table, liveRow);

//     try {
//       await mysqlConn.execute(query, values);
//     } catch (err) {
//       console.error("Failed to push row:", row, "\nError:", err.message);
//       continue;
//     }

//     if (table === "billing") {
//       const billId = row[idField];
//       const itemSelectQuery = buildSelectQuery("billing_items", {
//         bill_id: billId,
//       });
//       const items = db.prepare(itemSelectQuery).all();

//       for (const item of items) {
//         const { synced: itemSynced, ...liveItem } = item;

//         // also normalize child references
//         if (liveItem.bill_id !== undefined) {
//           liveItem.bill_id = String(parseInt(liveItem.bill_id, 10));
//         }
//         if (liveItem.productId !== undefined) {
//           liveItem.productId = String(parseInt(liveItem.productId, 10));
//         }

//         const { query: itemQuery, values: itemValues } = buildUpsertQuery(
//           "table_details",
//           liveItem
//         );

//         try {
//           await mysqlConn.execute(itemQuery, itemValues);
//           db.prepare(`UPDATE ${table} SET synced = 1 WHERE ${idField} = ?`).run(
//             row[idField]
//           );
//         } catch (err) {
//           console.error(
//             `Failed to push billing_item id=${item.id}, bill_id=${billId}\nError:`,
//             err.message
//           );
//         }
//       }
//     }
//   }
// }

// pull the new bill form the db based on creatd time
// async function pullBillingForBranch(branchId, lastSyncAt = null) {
//   const mysqlConn = await getMySqlConnection();
//   let billingQuery = `SELECT * FROM billing WHERE branch_id = ?`;
//   const params = [branchId];
//   if (lastSyncAt) {
//     billingQuery += ` AND created_at >= ?`;
//     params.push(lastSyncAt);
//   }
//   const [billsRaw] = await mysqlConn.execute(billingQuery, params);
//   if (!billsRaw.length) {
//     updateLastSync("billing");
//     return;
//   }

//   const bills = billsRaw.map((b) => ({ ...sanitizeRow(b), synced: 1 }));
//   const insertBills = db.transaction((bills) => {
//     for (const bill of bills) {
//       const { query, values } = buildInsertOrIgnoreQuery("billing", bill);
//       db.prepare(query.replace("OR IGNORE", "OR REPLACE")).run(values);
//     }
//   });
//   insertBills(bills);
//   for (const bill of bills) {
//     const [itemsRaw] = await mysqlConn.execute(
//       buildSelectQuery("table_details", { bill_id: bill.id })
//     );

//     if (!itemsRaw.length) continue;

//     const items = itemsRaw.map(sanitizeRow);

//     const insertItems = db.transaction((items) => {
//       for (const item of items) {
//         const { query, values } = buildInsertOrIgnoreQuery(
//           "billing_items",
//           item
//         );
//         db.prepare(query.replace("OR IGNORE", "OR REPLACE")).run(values);
//       }
//     });
//     insertItems(items);
//   }

//   updateLastSync("billing");
//   console.log(`Billing sync completed for branch ${branchId}`);
// }
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

async function findMissingBills(branchId) {
  const mysqlConn = await getMySqlConnection();

  // Live IDs
  const [liveRows] = await mysqlConn.query(
    "SELECT id FROM billing WHERE branch_id = ?",
    [branchId]
  );
  const liveIds = new Set(liveRows.map((r) => String(r.id).trim()));

  // Local IDs (normalize branch_id to int when filtering)
  const localRows = db
    .prepare("SELECT id FROM billing WHERE CAST(branch_id AS INTEGER) = ?")
    .all(branchId);
  const localIds = new Set(localRows.map((r) => String(r.id).trim()));

  // Missing in live
  const missingInLive = [...localIds].filter((id) => !liveIds.has(id));

  // Missing in local
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

    // 🔥 Normalize fields
    if (liveRow.branch_id !== undefined) {
      liveRow.branch_id = String(parseInt(liveRow.branch_id, 10));
    }
    if (liveRow.customer_id !== undefined) {
      liveRow.customer_id = String(parseInt(liveRow.customer_id, 10));
    }

    const { query, values } = buildUpsertQuery(table, liveRow);

    try {
      // Push parent row
      await mysqlConn.execute(query, values);
    } catch (err) {
      console.error("Failed to push row:", row, "\nError:", err.message);
      continue; // ❌ skip marking synced
    }

    // --- Special case for billing with child items ---
    if (table === "billing") {
      const billId = row[idField];
      const itemSelectQuery = buildSelectQuery("billing_items", {
        bill_id: billId,
      });
      const items = db.prepare(itemSelectQuery).all();

      let allItemsSynced = true;

      for (const item of items) {
        const { synced: itemSynced, ...liveItem } = item;

        // Normalize child references
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

      // ✅ Only mark parent as synced if all items succeeded
      if (allItemsSynced) {
        db.prepare(`UPDATE ${table} SET synced = 1 WHERE ${idField} = ?`).run(
          row[idField]
        );
      }
    } else {
      // ✅ For other tables, mark synced immediately after success
      db.prepare(`UPDATE ${table} SET synced = 1 WHERE ${idField} = ?`).run(
        row[idField]
      );
    }
  }
}
// keep until works fine
// async function reconcileAndResyncBilling(branchId = null) {
//   const mysqlConn = await getMySqlConnection();

//   // 1. Get all local billing IDs
//   const localIds = db
//     .prepare(`SELECT id FROM billing`)
//     .all()
//     .map((r) => r.id);

//   if (!localIds.length) return;

//   // 2. Get live billing IDs
//   let liveQuery = `SELECT id FROM billing`;
//   let liveParams = [];

//   if (branchId !== null) {
//     liveQuery += ` WHERE branch_id = ?`;
//     liveParams.push(branchId.toString());
//   }

//   const [liveRows] = await mysqlConn.execute(liveQuery, liveParams);
//   const liveIds = new Set(liveRows.map((r) => r.id));

//   // 3. Find missing billing IDs
//   const missingIds = localIds.filter((id) => !liveIds.has(id));
//   if (!missingIds.length) return;

//   console.log(
//     `Resync: Found ${missingIds.length} missing bills (branch=${branchId})`
//   );
//   console.log("➡ Missing bill IDs:", missingIds);

//   for (const id of missingIds) {
//     // 4. Get full local bill
//     const row = db.prepare(`SELECT * FROM billing WHERE id = ?`).get(id);
//     if (!row) continue;

//     const { synced, ...liveRow } = row;

//     // 🔥 Normalize fields
//     if (liveRow.branch_id !== undefined) {
//       liveRow.branch_id = String(parseInt(liveRow.branch_id, 10));
//     }
//     if (liveRow.customer_id !== undefined) {
//       liveRow.customer_id = String(parseInt(liveRow.customer_id, 10));
//     }

//     const { query, values } = buildUpsertQuery("billing", liveRow);

//     try {
//       await mysqlConn.execute(query, values);
//     } catch (err) {
//       console.error(`Reconcile failed for billing.id=${id}`, err.message);
//       continue;
//     }

//     // --- Push children: billing_items → table_details ---
//     const items = db
//       .prepare(`SELECT * FROM billing_items WHERE bill_id = ?`)
//       .all(id);

//     let allItemsSynced = true;

//     for (const item of items) {
//       const { synced: itemSynced, ...liveItem } = item;

//       if (liveItem.bill_id !== undefined) {
//         liveItem.bill_id = String(parseInt(liveItem.bill_id, 10));
//       }
//       if (liveItem.item_id !== undefined) {
//         liveItem.item_id = String(parseInt(liveItem.item_id, 10));
//       }

//       const { query: itemQuery, values: itemValues } = buildUpsertQuery(
//         "table_details",
//         liveItem
//       );

//       try {
//         await mysqlConn.execute(itemQuery, itemValues);
//       } catch (err) {
//         allItemsSynced = false;
//         console.error(
//           `Reconcile failed billing_item id=${item.id}, bill_id=${id}:`,
//           err.message
//         );
//       }
//     }

//     // ✅ Mark bill as synced only if all items synced
//     if (allItemsSynced) {
//       db.prepare(`UPDATE billing SET synced = 1 WHERE id = ?`).run(id);
//     }
//   }
// }

async function reconcileAndResyncBilling(branchId = null) {
  const mysqlConn = await getMySqlConnection();

  // 1. Get all local billing rows (id + synced flag)
  const localBills = db.prepare(`SELECT id, synced FROM billing`).all();
  if (!localBills.length) return;

  // 2. Get live billing IDs
  let liveQuery = `SELECT id FROM billing`;
  let liveParams = [];

  if (branchId !== null) {
    liveQuery += ` WHERE branch_id = ?`;
    liveParams.push(branchId.toString());
  }

  const [liveRows] = await mysqlConn.execute(liveQuery, liveParams);
  const liveIds = new Set(liveRows.map((r) => r.id));

  // 3. Loop through local bills and handle missing ones
  for (const bill of localBills) {
    const { id, synced } = bill;

    if (!liveIds.has(id)) {
      const row = db.prepare(`SELECT * FROM billing WHERE id = ?`).get(id);
      if (!row) continue;

      if (!synced) {
        // ➡ Unsynced new bill → push to live
        console.log(`Pushing new bill ${id} to live`);

        const { synced: _, ...liveRow } = row;

        // normalize fields
        if (liveRow.branch_id !== undefined) {
          liveRow.branch_id = String(parseInt(liveRow.branch_id, 10));
        }
        if (liveRow.customer_id !== undefined) {
          liveRow.customer_id = String(parseInt(liveRow.customer_id, 10));
        }

        const { query, values } = buildUpsertQuery("billing", liveRow);

        try {
          await mysqlConn.execute(query, values);
        } catch (err) {
          console.error(`Reconcile failed for billing.id=${id}`, err.message);
          continue;
        }

        // --- push child items to live ---
        const items = db
          .prepare(`SELECT * FROM billing_items WHERE bill_id = ?`)
          .all(id);

        let allItemsSynced = true;

        for (const item of items) {
          const { synced: itemSynced, ...liveItem } = item;

          if (liveItem.bill_id !== undefined) {
            liveItem.bill_id = String(parseInt(liveItem.bill_id, 10));
          }
          if (liveItem.item_id !== undefined) {
            liveItem.item_id = String(parseInt(liveItem.item_id, 10));
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
              `Reconcile failed billing_item id=${item.id}, bill_id=${id}:`,
              err.message
            );
          }
        }

        if (allItemsSynced) {
          db.prepare(`UPDATE billing SET synced = 1 WHERE id = ?`).run(id);
        }
      } else {
        // ➡ Already synced before but missing in live → move to archive
        console.log(`Archiving bill ${id} locally (deleted in live)`);

        db.prepare(
          `
          INSERT INTO billing_archive 
          SELECT * FROM billing WHERE id = ?
        `
        ).run(id);

        db.prepare(
          `
          INSERT INTO billing_items_archive 
          SELECT * FROM billing_items WHERE bill_id = ?
        `
        ).run(id);

        db.prepare(`DELETE FROM billing_items WHERE bill_id = ?`).run(id);
        db.prepare(`DELETE FROM billing WHERE id = ?`).run(id);
      }
    }
  }

  await mysqlConn.end();
}
async function pullBillingForBranch(branchId) {
  const mysqlConn = await getMySqlConnection();
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [billsRaw] = await mysqlConn.execute(
      `SELECT * FROM billing WHERE branch_id = ? AND DATE(billdate) = ?`,
      [branchId, today]
    );
    if (!billsRaw.length) {
      console.log(`No new bills today for branch ${branchId}`);
      return;
    }

    console.log(`Got ${billsRaw.length} bills from live (today)`);

    const bills = billsRaw.map((b) => ({ ...sanitizeRow(b), synced: 1 }));

    const insertBills = db.transaction((chunk) => {
      for (const bill of chunk) {
        try {
          const { query, values } = buildInsertOrIgnoreQuery("billing", bill);
          db.prepare(query.replace("OR IGNORE", "OR REPLACE")).run(values);
        } catch (err) {
          console.error(`Bill insert failed (ID ${bill.id}):`, err);
        }
      }
    });

    insertBills(bills);
    console.log(`Inserted ${bills.length} bills into local`);

    // Fetch items for today's bills
    const billIds = bills.map((b) => b.id);
    if (billIds.length) {
      const [itemsRaw] = await mysqlConn.query(
        `SELECT * FROM table_details WHERE bill_id IN (?)`,
        [billIds]
      );

      const insertItems = db.transaction((items) => {
        for (const item of items) {
          try {
            const { query, values } = buildInsertOrIgnoreQuery(
              "billing_items",
              sanitizeRow(item)
            );
            db.prepare(query.replace("OR IGNORE", "OR REPLACE")).run(values);
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
  await syncTable("expense", branch.id, null, "branch_id");
  await reconcileAndResyncBilling(branch.id);
  await pullBillingForBranch(branch.id);
  findMissingBills(branch.id);
}
