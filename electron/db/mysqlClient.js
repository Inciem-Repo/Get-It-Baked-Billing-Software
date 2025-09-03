import mysql from "mysql2/promise";

export async function getMySqlConnection() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "u541263251_billing",
  });
  return connection;
}
