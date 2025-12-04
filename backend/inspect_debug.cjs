const { pool } = require('./db');

async function inspect() {
  try {
    console.log("--- Pruebas ---");
    const pruebas = await pool.query("SELECT * FROM app.pruebas");
    console.table(pruebas.rows);

    console.log("\n--- Resultados for Student 359052ab-26b7-4cf5-b6c8-8ffbdc57cdfd ---");
    const res = await pool.query(`
      SELECT r.id, r.prueba_id, p.codigo, r.created_at 
      FROM app.resultados r
      LEFT JOIN app.pruebas p ON p.id = r.prueba_id
      WHERE r.alumno_id = '359052ab-26b7-4cf5-b6c8-8ffbdc57cdfd'
      ORDER BY r.created_at DESC
    `);
    console.table(res.rows);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

inspect();
