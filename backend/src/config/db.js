import mysql from "mysql2/promise";
import { config } from "./env.js";

let pool;

export const getDb = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
};
