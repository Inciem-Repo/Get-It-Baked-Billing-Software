import Store from "electron-store";
import { getMySqlConnection } from "../db/mysqlClient.js";
import {
  buildInsertQuery,
  buildSearchQuery,
  buildSelectQuery,
} from "../lib/buildQueries.js";
import db from "../db/dbSetup.js";
import isOnline from "is-online";

const store = new Store({ name: "user-session" });

export function saveUser(user) {
  try {
    store.set("user", user);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: "Failed to save user",
      error: err.message,
    };
  }
}

export function getUser() {
  try {
    return store.get("user") || null;
  } catch (err) {
    return null;
  }
}

export function clearUser() {
  try {
    store.delete("user");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: "Failed to clear user",
      error: err.message,
    };
  }
}

export function getCustomers() {
  try {
    const rows = db.prepare(buildSelectQuery("customers")).all();
    if (rows.length === 0) {
      console.log(`No data found`);
      return;
    }
    return rows;
  } catch (error) {
    return error;
  }
}

export function searchCustomers(searchTerm = "") {
  try {
    const query = buildSearchQuery("customers", "name", searchTerm);
    const rows = db.prepare(query).all();
    return rows;
  } catch (error) {
    console.error("Customer search error:", error);
    return [];
  }
}

// export function addCustomer(customer) {
//   try {
//     const fields = [
//       "branch_id",
//       "name",
//       "gstin",
//       "pan",
//       "tax_type",
//       "tds_percentage",
//       "mobile",
//       "email",
//       "billing_address",
//       "billing_city",
//       "billing_postal_code",
//       "shipping_address",
//       "shipping_city",
//       "shipping_postal_code",
//       "date",
//       "synced",
//     ];

//     const query = buildInsertQuery("customers", fields);
//     const stmt = db.prepare(query);

//     const values = [
//       customer.branch_id,
//       customer.companyName,
//       customer.gstin,
//       customer.pan,
//       null,
//       null,
//       customer.mobile,
//       customer.email,
//       customer.billingAddress.address,
//       customer.billingAddress.city,
//       customer.billingAddress.postalCode,
//       customer.shippingAddress.address,
//       customer.shippingAddress.city,
//       customer.shippingAddress.postalCode,
//       new Date().toISOString(),
//       0,
//     ];

//     const result = stmt.run(values);
//     return { success: true, id: result.lastInsertRowid };
//   } catch (err) {
//     console.error("Error inserting customer:", err);
//     return { success: false, error: err.message };
//   }
// }
function generateCustomerId(branchId) {
  const RANGE = 10000000; // 10 million slots per branch
  const base = branchId * RANGE;

  // Get the largest customer id inside this branch's range
  const row = db
    .prepare(
      `SELECT MAX(id) AS maxId 
     FROM customers 
     WHERE id BETWEEN ? AND ?`
    )
    .get(base, base + RANGE - 1);

  let sequence = 0;

  if (row && row.maxId) {
    // strip out branch prefix → only sequence part
    sequence = row.maxId - base;
  }

  return base + (sequence + 1);
}

export async function addCustomer(customer) {
  try {
    const branch = getUser();
    const customId = generateCustomerId(branch.id);
    console.log(customId);
    const fields = [
      "id",
      "branch_id",
      "name",
      "gstin",
      "pan",
      "tax_type",
      "tds_percentage",
      "mobile",
      "email",
      "billing_address",
      "billing_city",
      "billing_postal_code",
      "shipping_address",
      "shipping_city",
      "shipping_postal_code",
      "date",
      "synced",
    ];

    const values = [
      customId,
      String(branch.id),
      String(customer.companyName || ""),
      String(customer.gstin || ""),
      String(customer.pan || ""),
      null,
      null,
      String(customer.mobile || ""),
      String(customer.email || ""),
      String(customer.billingAddress?.address || ""),
      String(customer.billingAddress?.city || ""),
      String(customer.billingAddress?.postalCode || ""),
      String(customer.shippingAddress?.address || ""),
      String(customer.shippingAddress?.city || ""),
      String(customer.shippingAddress?.postalCode || ""),
      new Date().toISOString(),
      0,
    ];

    // --- Insert into local (SQLite) ---
    const localQuery = buildInsertQuery("customers", fields);
    db.prepare(localQuery).run(values);
    if (await isOnline()) {
      try {
        const mysqlConn = await getMySqlConnection();

        const liveFields = fields.filter((f) => f !== "synced");
        const liveValues = values.filter((_, i) => fields[i] !== "synced");

        const liveQuery = buildInsertQuery("customers", liveFields);
        await mysqlConn.execute(liveQuery, liveValues);

        db.prepare("UPDATE customers SET synced = 1 WHERE id = ?").run(
          customId
        );
      } catch (err) {
        console.error("Failed to sync customer to live DB:", err.message);
      }
    }

    return { success: true, id: customId };
  } catch (err) {
    console.error("Error inserting customer:", err);
    return { success: false, error: err.message };
  }
}

export function getCustomerById(id) {
  try {
    const stmt = db.prepare(
      "SELECT id, name, mobile, email FROM customers WHERE id = ?"
    );
    return stmt.get(id);
  } catch (err) {
    console.error("getCustomerById error:", err);
    return null;
  }
}
