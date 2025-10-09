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
    const query = buildSearchQuery("customers", "name", "mobile", searchTerm);
    const rows = db.prepare(query).all();
    return rows;
  } catch (error) {
    console.error("Customer search error:", error);
    return [];
  }
}

function generateCustomerId(branchId) {
  const RANGE = 10000000;
  const base = branchId * RANGE;
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

    let idToUse;
    let syncedFlag = 0;

    if (await isOnline()) {
      try {
        const mysqlConn = await getMySqlConnection();

        // Prepare fields without "id" and "synced" (let MySQL handle auto-increment)
        const liveFields = fields.filter((f) => f !== "id" && f !== "synced");
        const liveValues = [
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
        ];

        const liveQuery = buildInsertQuery("customers", liveFields);
        const [result] = await mysqlConn.execute(liveQuery, liveValues);

        // Get auto-incremented ID from live
        idToUse = result.insertId;
        syncedFlag = 1;

        console.log(`Customer added online with liveId=${idToUse}`);
      } catch (err) {
        console.error(
          "Failed to insert into live DB, fallback to offline:",
          err.message
        );

        // Fallback to offline ID
        idToUse = generateCustomerId(branch.id);
      }
    } else {
      // Offline mode → generate branch-based ID
      idToUse = generateCustomerId(branch.id);
    }

    // Insert into local (always use the chosen idToUse)
    const localValues = [
      idToUse,
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
      syncedFlag,
    ];

    const localQuery = buildInsertQuery("customers", fields);
    db.prepare(localQuery).run(localValues);

    return { success: true, id: idToUse };
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
