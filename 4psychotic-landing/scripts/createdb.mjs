import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const url = process.env.DATABASE_URL ?? "mysql://root:password@localhost:3306/4psychotic";

// Strip the database name so we can connect without it
const withoutDb = url.replace(/\/[^/?]+(\?|$)/, "/$1").replace(/\/$/, "");
const dbName = url.match(/\/([^/?]+)(\?|$)/)?.[1] ?? "4psychotic";

const conn = await mysql.createConnection(withoutDb);
await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
console.log(`✅ Database "${dbName}" is ready.`);
await conn.end();
