import Store from "electron-store";
import { getMySqlConnection } from "../db/mysqlClient.js";
import {
  buildInsertQuery,
  buildSearchQuery,
  buildSelectQuery,
} from "../lib/buildQueries.js";
import db from "../db/dbSetup.js";

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

export function addCustomer(customer) {
  try {
    const fields = [
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

    const query = buildInsertQuery("customers", fields);
    const stmt = db.prepare(query);

    const values = [
      customer.branch_id,
      customer.companyName,
      customer.gstin,
      customer.pan,
      null,
      null,
      customer.mobile,
      customer.email,
      customer.billingAddress.address,
      customer.billingAddress.city,
      customer.billingAddress.postalCode,
      customer.shippingAddress.address,
      customer.shippingAddress.city,
      customer.shippingAddress.postalCode,
      new Date().toISOString(),
      0,
    ];

    const result = stmt.run(values);
    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    console.error("Error inserting customer:", err);
    return { success: false, error: err.message };
  }
}
