const { Pool } = require("pg");

const isLocal =
  !process.env.PGHOST ||
  process.env.PGHOST === "localhost" ||
  process.env.PGHOST === "127.0.0.1";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  // Supabase requiere SSL; lo desactivamos solo en local
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

pool.on("error", (err) => {
  console.error("PG pool error:", err);
  process.exit(1);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
