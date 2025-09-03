const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

pool.on("error", (err) => {
  console.error("PG pool error:", err);
  process.exit(1);
});

module.exports = { pool };
