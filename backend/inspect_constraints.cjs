require('dotenv').config();
const { pool } = require('./db');

async function inspect() {
    try {
        const res = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'app.usuarios'::regclass;
    `);
        console.log("Constraints on app.usuarios:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
