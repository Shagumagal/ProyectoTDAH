const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * POST /metricas-hiperactividad
 * Recibe y guarda métricas de hiperactividad
 */
router.post('/metricas-hiperactividad', async (req, res) => {
  try {
    const {
      resultado_id,
      total_mouse_distance_px,
      mean_mouse_speed_px_s,
      max_mouse_speed_px_s,
      frenetic_movement_rate,
      direction_changes,
      total_clicks,
      unnecessary_clicks,
      unnecessary_click_rate,
      total_key_presses,
      burst_activity_rate,
      mean_burst_interval_s,
      idle_time_ratio,
      active_time_ratio,
      session_duration_s,
      activity_consistency
    } = req.body;

    // Validar que resultado_id existe
    if (!resultado_id) {
      return res.status(400).json({ 
        error: 'resultado_id es requerido' 
      });
    }

    // Verificar que el resultado existe en la tabla resultados
    const resultadoExists = await query(
      'SELECT id FROM app.resultados WHERE id = $1',
      [resultado_id]
    );

    if (resultadoExists.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Resultado no encontrado' 
      });
    }




    // Insertar métricas de hiperactividad
    const sql = `
      INSERT INTO app.metricas_hiperactividad (
        resultado_id,
        total_mouse_distance_px,
        mean_mouse_speed_px_s,
        max_mouse_speed_px_s,
        frenetic_movement_rate,
        direction_changes,
        total_clicks,
        unnecessary_clicks,
        unnecessary_click_rate,
        total_key_presses,
        burst_activity_rate,
        mean_burst_interval_s,
        idle_time_ratio,
        active_time_ratio,
        session_duration_s,
        activity_consistency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `;

    const values = [
      resultado_id,
      total_mouse_distance_px || 0,
      mean_mouse_speed_px_s || 0,
      max_mouse_speed_px_s || 0,
      frenetic_movement_rate || 0,
      direction_changes || 0,
      total_clicks || 0,
      unnecessary_clicks || 0,
      unnecessary_click_rate || 0,
      total_key_presses || 0,
      burst_activity_rate || 0,
      mean_burst_interval_s || 0,
      idle_time_ratio || 0,
      active_time_ratio || 0,
      session_duration_s || 0,
      activity_consistency || 0
    ];

    const result = await query(sql, values);

    res.status(201).json({
      message: 'Métricas de hiperactividad guardadas exitosamente',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error guardando métricas de hiperactividad:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

/**
 * GET /metricas-hiperactividad/:resultado_id
 * Obtiene las métricas de un resultado específico
 */
router.get('/metricas-hiperactividad/:resultado_id', async (req, res) => {
  try {
    const { resultado_id } = req.params;

    const result = await query(
      'SELECT * FROM app.metricas_hiperactividad WHERE resultado_id = $1',
      [resultado_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Métricas no encontradas para este resultado' 
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
