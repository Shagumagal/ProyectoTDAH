const express = require("express");
const { query } = require("../db");
const router = express.Router();

/**
 * POST /resultados
 * Guarda una sesión y su resumen de resultados.
 * Payload JSON esperado:
 * {
 *   "alumno_id": "uuid",
 *   "prueba": "gng" | "sst" | "tol",
 *   "started_at": "2025-11-11T15:00:00Z",
 *   "ended_at":   "2025-11-11T15:02:00Z",
 *   "rt_promedio_ms": 410, "rt_p50_ms": 395, "rt_p90_ms": 620,
 *   "rt_sd_ms": 57.3, "rt_min_ms": 240, "rt_max_ms": 980,
 *   "errores_omision": 4, "errores_comision": 9,
 *   "aciertos": 147, "total_estimulos": 160,
 *   "dprime": 1.08, "beta": 0.92,
 *   "posible_tdah": true,
 *   "tipo_tdah": "inatento" | "hiperactivo" | "combinado" | "ninguno",
 *   "riesgo": 0.71,
 *   "detalles": { ... }   // JSON libre
 * }
 */
router.post("/", async (req, res) => {
  const b = req.body;

  // Validaciones mínimas
  if (!b.alumno_id) return res.status(400).json({ error: "alumno_id requerido" });
  if (!b.prueba)    return res.status(400).json({ error: "prueba requerida (gng/sst/tol)" });
  if (!b.started_at || !b.ended_at)
    return res.status(400).json({ error: "started_at y ended_at requeridos (ISO)" });

  try {
    // 1) prueba_id desde app.pruebas
    const pr = await query("SELECT id FROM app.pruebas WHERE codigo = $1", [b.prueba]);
    if (pr.rowCount === 0) return res.status(400).json({ error: "prueba no reconocida" });
    const prueba_id = pr.rows[0].id;

    // 2) crear sesión
    const ses = await query(
      `INSERT INTO app.sesiones (
         alumno_id, prueba_id, started_at, ended_at, duracion_ms, metadata
       ) VALUES (
         $1,$2,$3,$4,
         (EXTRACT(EPOCH FROM ($4::timestamptz - $3::timestamptz))*1000)::int,
         $5::jsonb
       ) RETURNING id`,
      [
        b.alumno_id,
        prueba_id,
        b.started_at,
        b.ended_at,
        JSON.stringify({ origen: "unity", ...(b.detalles?.sesion || {}) }),
      ]
    );
    const sesion_id = ses.rows[0].id;

    // 3) guardar resumen en app.resultados
    const sql =
      `INSERT INTO app.resultados (
         sesion_id, alumno_id, prueba_id, started_at, ended_at,
         rt_promedio_ms, rt_p50_ms, rt_p90_ms, rt_sd_ms, rt_min_ms, rt_max_ms,
         errores_omision, errores_comision, aciertos, total_estimulos,
         dprime, beta, posible_tdah, tipo_tdah, riesgo,
         detalles, created_at
       ) VALUES (
         $1,$2,$3,$4,$5,
         $6,$7,$8,$9,$10,$11,
         $12,$13,$14,$15,
         $16,$17,$18,$19::app.tipo_tdah_enum,$20,
         $21::jsonb, NOW()
       ) RETURNING id`;

    const params = [
      sesion_id, b.alumno_id, prueba_id, b.started_at, b.ended_at,
      b.rt_promedio_ms ?? null, b.rt_p50_ms ?? null, b.rt_p90_ms ?? null, b.rt_sd_ms ?? null,
      b.rt_min_ms ?? null, b.rt_max_ms ?? null,
      b.errores_omision ?? null, b.errores_comision ?? null, b.aciertos ?? null, b.total_estimulos ?? null,
      b.dprime ?? null, b.beta ?? null, b.posible_tdah ?? null, (b.tipo_tdah ?? "ninguno"), b.riesgo ?? null,
      JSON.stringify({ fuente: "unity", ...(b.detalles || {}) }),
    ];

    const r = await query(sql, params);
    return res.status(201).json({ status: "ok", resultado_id: r.rows[0].id, sesion_id });
  } catch (e) {
    console.error("POST /resultados error:", e);
    return res.status(500).json({ error: e.message });
  }
});

/** GET /resultados?alumno_id=...&prueba=gng  (lista últimos 200) */
router.get("/", async (req, res) => {
  const { alumno_id, prueba } = req.query;
  try {
    const filtros = [];
    const vals = [];
    if (alumno_id) { vals.push(alumno_id); filtros.push(`r.alumno_id = $${vals.length}`); }
    if (prueba)    { vals.push(prueba); filtros.push(`p.codigo = $${vals.length}`); }

    const sql = `
      SELECT r.*, p.codigo AS prueba_codigo, p.nombre AS prueba_nombre
      FROM app.resultados r
      JOIN app.pruebas p ON p.id = r.prueba_id
      ${filtros.length ? "WHERE " + filtros.join(" AND ") : ""}
      ORDER BY r.created_at DESC
      LIMIT 200
    `;
    const out = await query(sql, vals);
    res.json(out.rows);
  } catch (e) {
    console.error("GET /resultados error:", e);
    res.status(500).json({ error: e.message });
  }
});

/** GET /resultados/:id  (detalle) */
router.get("/:id", async (req, res) => {
  try {
    const r = await query(
      `SELECT r.*, p.codigo AS prueba_codigo, p.nombre AS prueba_nombre
       FROM app.resultados r
       JOIN app.pruebas p ON p.id = r.prueba_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: "no encontrado" });
    res.json(r.rows[0]);
  } catch (e) {
    console.error("GET /resultados/:id error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
