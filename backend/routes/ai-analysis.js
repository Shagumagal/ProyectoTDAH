// backend/routes/ai-analysis.js
const express = require("express");
const { pool } = require("../db");
const { prepareModelInput, predictADHD } = require("../services/adhdPrediction.service");
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
            return res.status(404).json({ error: "Student not found" });
        }

        const student = studentRes.rows[0];

        // 2. Fetch Latest Game Result (TOL preferred, but any valid game works if metrics align)
        // We prioritize 'tol' as it seems to be the main focus, but the model is generic?
        // Actually the model expects specific metrics. Let's fetch the latest result with details.
        const resultRes = await pool.query(`
            SELECT detalles
            FROM app.resultados
            WHERE alumno_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `, [studentId]);

        if (resultRes.rowCount === 0) {
            return res.status(404).json({ error: "No game results found for this student" });
        }

        const detalles = resultRes.rows[0].detalles || {};

        // 3. Prepare Input
        const inputVector = prepareModelInput(detalles, student);

        // 4. Predict
        const prediction = predictADHD(inputVector);

        res.json({
            prediction,
            inputVector // Optional: return for debugging/transparency
        });

    } catch (e) {
        console.error("AI Analysis Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
