// backend/routes/ai-analysis.js
const express = require("express");
const { pool } = require("../db");
const { prepareInputVector, predictADHD } = require("../services/adhdPrediction.service");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// POST /api/ai-analysis/predict
router.post("/predict", requireAuth, async (req, res) => {
    const { studentId } = req.body;

    if (!studentId) {
        return res.status(400).json({ error: "studentId is required" });
    }

    try {
        // 1. Fetch Student Data
        const studentRes = await pool.query(
            "SELECT fecha_nacimiento, genero FROM app.usuarios WHERE id = $1",
            [studentId]
        );

        if (studentRes.rowCount === 0) {
            return res.status(404).json({ error: "Estudiante no encontrado" });
        }

        const student = studentRes.rows[0];

        // 2. Fetch Latest Stop Signal (SST) Game Result exclusively
        const resultRes = await pool.query(`
            SELECT
                r.total_estimulos,
                r.aciertos,
                r.errores_comision,
                r.errores_omision,
                r.rt_promedio_ms,
                r.rt_p50_ms,
                r.rt_p90_ms,
                r.rt_max_ms,
                r.rt_sd_ms,
                r.detalles
            FROM app.resultados r
            INNER JOIN app.pruebas p ON r.prueba_id = p.id
            WHERE r.alumno_id = $1
              AND LOWER(p.codigo) IN ('sst', 'stop-signal', 'stop_signal')
            ORDER BY r.created_at DESC
            LIMIT 1
        `, [studentId]);

        if (resultRes.rowCount === 0) {
            return res.status(404).json({
                error: "El estudiante aún no tiene resultados registrados en la prueba Stop Signal (Gallina / Semáforo) para realizar el análisis de IA."
            });
        }

        const row = resultRes.rows[0];
        const rawDetalles = row.detalles || {};
        const total = Number(rawDetalles.n_trials ?? row.total_estimulos ?? 0);
        const correct = Number(rawDetalles.n_correct ?? row.aciertos ?? 0);
        const comision = Number(row.errores_comision ?? 0);
        const omision = Number(row.errores_omision ?? 0);
        const incorrect = Number(rawDetalles.n_incorrect ?? (comision + omision));

        const detalles = {
            ...rawDetalles,
            n_trials: total,
            n_correct: correct,
            n_incorrect: incorrect,
            responded_rate: rawDetalles.responded_rate ?? (total > 0 ? Math.max(0, (total - omision) / total) : 0),
            accuracy: rawDetalles.accuracy ?? (total > 0 ? correct / total : 0),
            fail_rate: rawDetalles.fail_rate ?? (total > 0 ? incorrect / total : 0),
            mean_rt: rawDetalles.mean_rt ?? rawDetalles.rt_promedio_ms ?? ((Number(row.rt_promedio_ms) || 0) / 1000),
            median_rt: rawDetalles.median_rt ?? rawDetalles.rt_median_ms ?? rawDetalles.rt_p50_ms ?? ((Number(row.rt_p50_ms) || 0) / 1000),
            p95_rt: rawDetalles.p95_rt ?? rawDetalles.rt_p90_ms ?? ((Number(row.rt_p90_ms ?? row.rt_max_ms) || 0) / 1000),
            std_rt: rawDetalles.std_rt ?? rawDetalles.rt_sd_ms ?? ((Number(row.rt_sd_ms) || 0) / 1000),
        };

        // 3. Prepare Input
        const inputVector = prepareInputVector(detalles, student);

        // 4. Predict
        const prediction = predictADHD(inputVector);

        res.json({
            prediction,
            inputVector
        });

    } catch (e) {
        console.error("AI Analysis Error:", e);
        res.status(500).json({ error: "Error interno del servidor al procesar el análisis de IA" });
    }
});

module.exports = router;
