require('dotenv').config();
const { pool } = require('./db');

async function inspectResultados() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'resultados' AND column_name = 'id';
    `);
        console.log("app.resultados id type:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectResultados();
