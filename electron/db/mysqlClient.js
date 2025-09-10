import mysql from "mysql2/promise";

const ENV = "production";

export async function getMySqlConnection() {
  let config;

  if (ENV === "production") {
    config = {
      host: "auth-db1989.hstgr.io",
      user: "u129193829_test_db",
      password: "Baked@884892",
      database: "u129193829_baked_app",
    };
  } else {
    config = {
      host: "localhost",
      user: "root",
      password: "",
      database: "u541263251_billing",
    };
  }

  const connection = await mysql.createConnection(config);
  return connection;
}
