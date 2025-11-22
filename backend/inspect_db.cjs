require('dotenv').config();
const { pool } = require('./db');

async function inspect() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'game_sessions';
    `);
        console.log("Table app.game_sessions columns:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
