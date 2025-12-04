const { pool } = require('./backend/db');

async function inspect() {
    try {
        const res = await pool.query(`
            SELECT r.id, r.detalles, r.created_at
            FROM app.resultados r
            JOIN app.pruebas p ON p.id = r.prueba_id
            WHERE p.codigo = 'tol'
            ORDER BY r.created_at DESC
            LIMIT 1
        `);
        console.log("Latest TOL Result:");
        if (res.rows.length > 0) {
            console.log("ID:", res.rows[0].id);
            console.log("Created At:", res.rows[0].created_at);
            console.log("Detalles:", JSON.stringify(res.rows[0].detalles, null, 2));
        } else {
            console.log("No TOL results found.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
