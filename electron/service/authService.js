import db from "../db/dbSetup.js";
import { getMySqlConnection } from "../db/mysqlClient.js";
import {
  buildInsertOrIgnoreQuery,
  buildSelectQuery,
} from "../lib/buildQueries.js";
import { md5 } from "../lib/helper.js";
import { syncTable } from "./syncService.js";
import { saveUser } from "./userService.js";

// 1. Check local db first
// export async function loginUser(username, password) {
//   const hashedPassword = md5(password);
//   const query = buildSelectQuery("branches", {
//     username,
//     password: hashedPassword,
//   });
//   const localUser = db.prepare(query).get();
//   if (localUser) {
//     saveUser(localUser);
//     return { success: true, source: "local", user: localUser };
//   }

//   // 2. If not in local, try MySQL (remote live DB)
//   try {
//     const query = buildSelectQuery("branches", {
//       username,
//       password: hashedPassword,
//     });
//     const mysqlConn = await getMySqlConnection();
//     const [rows] = await mysqlConn.execute(query);
//     if (rows.length > 0) {
//       const remoteUser = rows[0];
//       if (remoteUser.date instanceof Date) {
//         remoteUser.date = remoteUser.date.toISOString();
//       } else if (typeof remoteUser.date !== "string") {
//         remoteUser.date = new Date().toISOString();
//       }
//       const { query, values } = buildInsertOrIgnoreQuery(
//         "branches",
//         remoteUser
//       );
//       const billingRecords = await syncTable(
//         "billing",
//         remoteUser.id,
//         null,
//         "branch_id"
//       );
//       await syncTable("expense", remoteUser.id, null, "branch_id");
//       const billIds = billingRecords.map((bill) => bill.id);

//       // 3. Sync billing_items table (live: table_details) by bill_ids
//       if (billIds.length > 0) {
//         await syncTable("billing_items", billIds, "table_details", "bill_id");
//       }

//       db.prepare(query).run(...values);
//       saveUser(remoteUser);
//       return { success: true, source: "remote", user: remoteUser };
//     } else {
//       return { success: false, message: "Invalid credentials" };
//     }
//   } catch (err) {
//     return {
//       success: false,
//       message: "No internet connection or cannot reach data.",
//       error: err.message,
//     };
//   }
// }

export async function loginUser(username, password) {
  const hashedPassword = md5(password);

  // 1. Try local SQLite first
  const localQuery = buildSelectQuery("branches", {
    username,
    password: hashedPassword,
  });
  let localUser = db.prepare(localQuery).get();

  if (localUser) {
    // Ensure only one user exists in local DB
    db.prepare(`DELETE FROM branches WHERE id != ?`).run(localUser.id);

    saveUser(localUser);
    return { success: true, source: "local", user: localUser };
  }

  // 2. If not in local, try remote MySQL
  try {
    const query = buildSelectQuery("branches", {
      username,
      password: hashedPassword,
    });
    const mysqlConn = await getMySqlConnection();
    const [rows] = await mysqlConn.execute(query);

    if (rows.length > 0) {
      const remoteUser = rows[0];

      if (remoteUser.date instanceof Date) {
        remoteUser.date = remoteUser.date.toISOString();
      } else if (typeof remoteUser.date !== "string") {
        remoteUser.date = new Date().toISOString();
      }

      // Prepare INSERT OR REPLACE query for SQLite
      const { query: insertQuery, values } = buildInsertOrIgnoreQuery(
        "branches",
        remoteUser
      );

      // Delete all old users to keep only one
      db.prepare(`DELETE FROM branches`).run();

      // Insert the new user
      db.prepare(insertQuery).run(...values);

      // Sync related tables
      const billingRecords = await syncTable(
        "billing",
        remoteUser.id,
        null,
        "branch_id"
      );
      await syncTable("expense", remoteUser.id, null, "branch_id");

      const billIds = billingRecords.map((bill) => bill.id);
      if (billIds.length > 0) {
        await syncTable("billing_items", billIds, "table_details", "bill_id");
      }

      saveUser(remoteUser);
      return { success: true, source: "remote", user: remoteUser };
    } else {
      return { success: false, message: "Invalid credentials" };
    }
  } catch (err) {
    return {
      success: false,
      message: "No internet connection or cannot reach data.",
      error: err.message,
    };
  }
}
