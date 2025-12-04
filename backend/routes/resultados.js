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

    // Mapping Unity fields
    const rt_p50 = b.rt_p50_ms ?? b.rt_median_ms ?? null;
    
    let detallesObj = b.detalles || {};
    if (b.detalles_raw_text) {
        try {
            const parsed = JSON.parse(b.detalles_raw_text);
            detallesObj = { ...detallesObj, ...parsed };
        } catch (e) {
            detallesObj.raw_text = b.detalles_raw_text;
        }
    }

    const params = [
      sesion_id, b.alumno_id, prueba_id, b.started_at, b.ended_at,
      b.rt_promedio_ms ?? null, rt_p50, b.rt_p90_ms ?? null, b.rt_sd_ms ?? null,
      b.rt_min_ms ?? null, b.rt_max_ms ?? null,
      b.errores_omision ?? null, b.errores_comision ?? null, b.aciertos ?? null, b.total_estimulos ?? null,
      b.dprime ?? null, b.beta ?? null, b.posible_tdah ?? null, (b.tipo_tdah ?? "ninguno"), b.riesgo ?? null,
      JSON.stringify({ fuente: "unity", ...detallesObj }),
    ];

    const r = await query(sql, params);
    return res.status(201).json({ message: "Guardado", id: r.rows[0].id, sesion_id });
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

// GET /resultados/alumno/:id
// Obtiene el perfil consolidado del alumno basado en sus últimas partidas
router.get('/alumno/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar la ÚLTIMA partida de cada tipo de juego para este alumno
    // Usamos DISTINCT ON para obtener la mas reciente por tipo de prueba
    const sql = `
      SELECT DISTINCT ON (p.codigo) r.*, p.codigo as prueba_codigo
      FROM app.resultados r
      JOIN app.pruebas p ON r.prueba_id = p.id
      WHERE r.alumno_id = $1
      ORDER BY p.codigo, r.started_at DESC;
    `;
    
    const { rows } = await query(sql, [id]);

    // Obtener datos del alumno para la respuesta
    const studentRes = await query("SELECT nombre FROM app.usuarios WHERE id = $1", [id]);
    const studentName = studentRes.rows[0]?.nombre || "Alumno";

    // 2. Inicializar estructura vacía (por si no ha jugado algo aún)
    const response = {
      alumno: { id: id, nombre: studentName },
      fecha: new Date().toISOString(),
      goNoGo: { accuracy: 0, commissionRate: 0, omissionRate: 0, medianRT: 0, cvRT: 0, p95RT: 0 },
      stopSignal: { accuracy: 0, commissionRate: 0, omissionRate: 0, medianRT: 0, cvRT: 0, stopFailureRate: 0 },
      stroop: null,
      tol: null
    };

    // 3. Mapear cada fila de la DB al formato del Frontend
    rows.forEach(row => {
      const detalles = row.detalles || {}; // El JSON guardado por Unity
      const prueba = row.prueba_codigo; // 'gng', 'sst', 'tol'

      if (prueba === 'gng' || prueba === 'go-no-go' || prueba === 'gonogo') {
        response.goNoGo = {
          accuracy: row.total_estimulos > 0 ? (row.aciertos / row.total_estimulos) : 0,
          commissionRate: row.total_estimulos > 0 ? (row.errores_comision / row.total_estimulos) : 0,
          omissionRate: row.total_estimulos > 0 ? (row.errores_omision / row.total_estimulos) : 0,
          medianRT: (row.rt_p50_ms || row.rt_median_ms || 0) / 1000, // ms a segundos
          cvRT: row.rt_promedio_ms > 0 ? (row.rt_sd_ms / row.rt_promedio_ms) : 0,
          p95RT: (row.rt_p90_ms || row.rt_max_ms || 0) / 1000,
          // Extraer métricas específicas del JSON si existen
          fastGuessRate: detalles.fast_guess_rate || 0,
          lapsesRate: detalles.lapses_rate || 0,
          vigilanceDecrement: detalles.vigilance_decrement || 0
        };
      } 
      else if (prueba === 'sst' || prueba === 'stop-signal') {
        response.stopSignal = {
          accuracy: row.total_estimulos > 0 ? (row.aciertos / row.total_estimulos) : 0,
          commissionRate: row.total_estimulos > 0 ? (row.errores_comision / row.total_estimulos) : 0, // Falsas alarmas
          omissionRate: row.total_estimulos > 0 ? (row.errores_omision / row.total_estimulos) : 0,
          medianRT: (row.rt_p50_ms || row.rt_median_ms || 0) / 1000,
          cvRT: row.rt_promedio_ms > 0 ? (row.rt_sd_ms / row.rt_promedio_ms) : 0,
          stopFailureRate: row.total_estimulos > 0 ? (row.errores_comision / row.total_estimulos) : 0, // En SST, comision = stop failure
          ssrt: detalles.ssrt || (detalles.ssrt_ms ? detalles.ssrt_ms / 1000 : 0),
          ssdAverage: detalles.ssd_average || 0
        };
      }
      else if (prueba === 'tol' || prueba === 'torre-londres') {
        // AQUÍ ESTÁ LA CLAVE: Mapear nombres de Unity a nombres del Frontend
        
        // Buscar métricas de hiperactividad asociadas a ESTE resultado
        // Nota: row.hyperactivity ya viene del LEFT JOIN en la query principal, 
        // pero viene como objeto jsonb. Si queremos asegurarnos de tener los campos mapeados:
        const h = row.hyperactivity || {};

        response.tol = {
          // Unity envía: first_action_latency_s  -> Frontend espera: planLatency
          planLatency: detalles.first_action_latency_s || 0,
          
          // Unity envía: sequence_errors       -> Frontend espera: excessMoves (aprox)
          excessMoves: detalles.sequence_errors || 0,
          
          // Unity envía: category_switches     -> Frontend espera: ruleViolations (aprox)
          ruleViolations: detalles.category_switches || 0,

          // NUEVOS CAMPOS
          decisionTime: detalles.mean_decision_time_s || 0,
          planningScore: detalles.sequence_compliance || 0, // 0 a 1

          // AQUI AGREGAMOS LO NUEVO SOLO PARA TOL
          hyperactivity: {
            mouseDistance: h.total_mouse_distance_px || 0,
            freneticMovement: h.frenetic_movement_rate || 0,
            unnecessaryClicks: h.unnecessary_clicks || 0,
            clickRate: h.mean_mouse_speed_px_s || 0 // Usamos velocidad media como proxy o h.unnecessary_click_rate si prefieres
          }
        };
      }
    });

    res.json(response);

  } catch (error) {
    console.error("Error obteniendo resultados:", error);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;
