require('dotenv').config();
const { pool } = require('./db');

async function inspect() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'usuarios' AND column_name = 'id';
    `);
        console.log("User ID type:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
