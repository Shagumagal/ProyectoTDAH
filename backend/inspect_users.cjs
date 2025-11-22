require('dotenv').config();
const { pool } = require('./db');

async function inspect() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'usuarios';
    `);
        console.log("Table app.usuarios columns:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
