import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import { createTables } from "./schema.js";

const dbPath = path.join(app.getPath("userData"), "get_it_baked.db");
const db = new Database(dbPath);

createTables.forEach((sql) => {
  db.prepare(sql).run();
});

export default db;
