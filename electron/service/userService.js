import Store from "electron-store";
import { getMySqlConnection } from "../db/mysqlClient.js";
import { buildSelectQuery } from "../lib/db/buildQueries.js";
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
