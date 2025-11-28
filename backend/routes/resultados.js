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

/** GET /resultados/alumno/:id (reporte completo) */
router.get("/alumno/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Datos del alumno
    const studentRes = await query("SELECT id, nombre, fecha_nacimiento FROM app.usuarios WHERE id = $1", [id]);
    if (studentRes.rowCount === 0) return res.status(404).json({ error: "Alumno no encontrado" });
    const student = studentRes.rows[0];

    // Calcular edad
    let edad = 0;
    if (student.fecha_nacimiento) {
      const diff = Date.now() - new Date(student.fecha_nacimiento).getTime();
      edad = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    // 2. Últimos resultados por prueba
    const tests = ["gng", "sst", "stroop", "tol"];
    const results = {};

    for (const code of tests) {
      const sql = `
        SELECT r.*
        FROM app.resultados r
        JOIN app.pruebas p ON p.id = r.prueba_id
        WHERE r.alumno_id = $1 AND p.codigo = $2
        ORDER BY r.created_at DESC
        LIMIT 1
      `;
      const r = await query(sql, [id, code]);
      if (r.rowCount > 0) {
        results[code] = r.rows[0];
      }
    }

    // 3. Mapeo a estructura frontend
    const mapBase = (row) => {
      if (!row) return {
        accuracy: 0, commissionRate: 0, omissionRate: 0,
        medianRT: 0, p95RT: 0, cvRT: 0
      };
      const total = row.total_estimulos || 1;
      const mean = row.rt_promedio_ms || 1;
      return {
        accuracy: (row.aciertos || 0) / total,
        commissionRate: (row.errores_comision || 0) / total,
        omissionRate: (row.errores_omision || 0) / total,
        medianRT: (row.rt_p50_ms || 0) / 1000,
        p95RT: (row.rt_p90_ms || 0) / 1000,
        cvRT: (row.rt_sd_ms || 0) / mean,
      };
    };

    // Extraer detalles si existen
    const gngDet = results.gng?.detalles || {};
    const sstDet = results.sst?.detalles || {};
    const strDet = results.stroop?.detalles || {};
    const tolDet = results.tol?.detalles || {};

    const response = {
      alumno: {
        id: student.id,
        nombre: student.nombre,
        edad: edad || undefined,
        curso: "N/A"
      },
      fecha: new Date().toISOString(),
      goNoGo: {
        ...mapBase(results.gng),
        fastGuessRate: gngDet.fastGuessRate || 0,
        lapsesRate: gngDet.lapsesRate || 0,
        vigilanceDecrement: gngDet.vigilanceDecrement || 0,
      },
      stopSignal: {
        ...mapBase(results.sst),
        stopFailureRate: sstDet.stopFailureRate || 0,
        ssrt: sstDet.ssrt || 0,
      },
      stroop: results.stroop ? {
        deltaInterference: strDet.deltaInterference || 0,
        accuracy: (results.stroop.aciertos || 0) / (results.stroop.total_estimulos || 1)
      } : undefined,
      tol: results.tol ? {
        planLatency: tolDet.planLatency || 0,
        excessMoves: tolDet.excessMoves || 0,
        ruleViolations: tolDet.ruleViolations || 0
      } : undefined
    };

    res.json(response);
  } catch (e) {
    console.error("GET /resultados/alumno/:id error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
