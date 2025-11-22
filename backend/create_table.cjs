require('dotenv').config();
const { pool } = require('./db');

async function createTable() {
    try {
        // Removed REFERENCES app.usuarios(id) because app.usuarios(id) has no unique constraint
        await pool.query(`
      CREATE TABLE IF NOT EXISTS app.game_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL, 
        code text NOT NULL UNIQUE,
        allowed_origin text,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz DEFAULT now()
      );
    `);
        console.log("Table app.game_sessions created successfully (No FK).");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

createTable();
