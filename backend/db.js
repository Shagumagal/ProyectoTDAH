// backend/db.js
const { Pool } = require("pg");

const isLocal =
  !process.env.PGHOST ||
  process.env.PGHOST === "localhost" ||
  process.env.PGHOST === "127.0.0.1";

console.log("PG config:", {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
});

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  // Supabase pooler necesita SSL
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("PG pool error:", err);
  // No matamos el proceso, solo logueamos el error.
  // process.exit(1);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
