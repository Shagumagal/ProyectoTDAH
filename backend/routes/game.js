// backend/routes/game.js
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { requireAuth, getToken } = require("../middlewares/auth");

const router = express.Router();

// Helper: IP del cliente real (detrás de proxy de Render)
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/** POST /game/start (Auth normal)
 * Crea un código efímero y lo devuelve. Guarda la IP del cliente para claim-pending.
 */
router.post("/start", requireAuth, async (req, res) => {
  try {
    const code = crypto.randomBytes(24).toString("base64url");
    const clientIp = getClientIp(req);
    await pool.query(
      `INSERT INTO app.game_sessions(user_id, code, allowed_origin, expires_at)
       VALUES ($1,$2,$3, now() + interval '15 minutes')`,
      [req.auth.userId, code, clientIp]
    );
    console.log(`[game/start] Session created for user ${req.auth.userId} (IP: ${clientIp})`);
    res.json({ code });
  } catch (e) {
    console.error("POST /game/start error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** GET /game/claim-pending (Sin Auth)
 * Usado por Unity cuando NO puede leer el ?code= desde el iframe de Itch.io.
 * Busca la sesión pendiente más reciente por IP del cliente.
 */
router.get("/claim-pending", async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    console.log(`[game/claim-pending] IP solicitante: ${clientIp}`);

    // 1) Buscar por IP (más seguro)
    let result = await pool.query(
      `UPDATE app.game_sessions
         SET consumed_at = now()
       WHERE id = (
         SELECT id FROM app.game_sessions
          WHERE consumed_at IS NULL
            AND expires_at > now()
            AND allowed_origin = $1
          ORDER BY created_at DESC
          LIMIT 1
       )
       RETURNING user_id`,
      [clientIp]
    );

    // 2) Fallback: sesión más reciente (últimos 5 min) sin importar IP
    if (!result.rows.length) {
      result = await pool.query(
        `UPDATE app.game_sessions
           SET consumed_at = now()
         WHERE id = (
           SELECT id FROM app.game_sessions
            WHERE consumed_at IS NULL
              AND expires_at > now()
              AND created_at > now() - interval '5 minutes'
            ORDER BY created_at DESC
            LIMIT 1
         )
         RETURNING user_id`
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({ error: "NO_PENDING_SESSION" });
    }

    const userId = result.rows[0].user_id;
    const info = await pool.query(
      `SELECT u.id, r.nombre AS role, u.nombre
         FROM app.usuarios u
         JOIN app.roles r ON r.id = u.rol_id
        WHERE u.id = $1`,
      [userId]
    );
    if (!info.rows.length) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const user = info.rows[0];
    const gameJwt = jwt.sign(
      { sub: user.id, role: user.role, scope: "game", aud: "unity" },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );

    console.log(`[game/claim-pending] ✅ Session claimed for user ${user.id} (${user.nombre})`);
    res.json({ game_jwt: gameJwt, user: { id: user.id, role: user.role, nombre: user.nombre } });
  } catch (e) {
    console.error("GET /game/claim-pending error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** GET /game/exchange?code=... (Sin Auth)
 * Canjea el code -> emite un game_jwt de 20 min con scope=game
 */
router.get("/exchange", async (req, res) => {
  try {
    const { code } = req.query || {};
    if (!code) return res.status(400).json({ error: "CODE_REQUIRED" });

    // Marca consumo 1 sola vez (anti-replay)
    const { rows } = await pool.query(
      `UPDATE app.game_sessions
         SET consumed_at = now()
       WHERE code = $1
         AND consumed_at IS NULL
         AND expires_at > now()
       RETURNING user_id`,
      [code]
    );
    if (!rows.length) return res.status(401).json({ error: "INVALID_OR_EXPIRED" });

    const userId = rows[0].user_id;
    const info = await pool.query(
      `SELECT u.id, r.nombre AS role, u.nombre
         FROM app.usuarios u
         JOIN app.roles r ON r.id = u.rol_id
        WHERE u.id = $1`,
      [userId]
    );
    if (!info.rows.length) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const user = info.rows[0];
    const gameJwt = jwt.sign(
      { sub: user.id, role: user.role, scope: "game", aud: "unity" },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );
    res.json({ game_jwt: gameJwt, user: { id: user.id, role: user.role, nombre: user.nombre } });
  } catch (e) {
    console.error("GET /game/exchange error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** Middleware Auth solo para tokens de juego (scope=game) */
function requireGameAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) return res.status(401).json({ error: "UNAUTHENTICATED" });
    const token = h.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.scope !== "game") return res.status(403).json({ error: "FORBIDDEN" });
    req.auth = { userId: payload.sub, role: payload.role, scope: "game" };
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}

/** POST /game/submit (Auth de juego)
 * Guarda resultados. Si es estudiante => usa su propio id.
 * Si es staff, exige alumno_id en el body (para el niño evaluado).
 */
router.post("/submit", requireGameAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const rol = req.auth.role;

    const alumnoId = (rol === "estudiante") ? req.auth.userId : b.alumno_id;
    if (!alumnoId) return res.status(400).json({ error: "alumno_id requerido" });

    // Inserta en tu misma tabla de resultados (resumido)
    await pool.query(
      `INSERT INTO app.resultados(
        sesion_id, alumno_id, prueba_id, started_at, ended_at,
        rt_promedio_ms, rt_p50_ms, rt_p90_ms, rt_sd_ms, rt_min_ms, rt_max_ms,
        errores_omision, errores_comision, aciertos, total_estimulos,
        dprime, beta, posible_tdah, tipo_tdah, riesgo, detalles, created_at
      ) VALUES (
        gen_random_uuid(), $1, (SELECT id FROM app.pruebas WHERE codigo = $2 LIMIT 1),
        $3, $4, $5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,
        $15,$16,$17,$18::app.tipo_tdah_enum,$19,
        $20::jsonb, NOW()
      )`,
      [
        alumnoId, b.prueba || "gng",
        b.started_at, b.ended_at,
        b.rt_promedio_ms, b.rt_p50_ms, b.rt_p90_ms, b.rt_sd_ms, b.rt_min_ms, b.rt_max_ms,
        b.errores_omision, b.errores_comision, b.aciertos, b.total_estimulos,
        b.dprime, b.beta, b.posible_tdah ?? null, b.tipo_tdah ?? "ninguno", b.riesgo ?? null,
        b.detalles ?? {}
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /game/submit error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

module.exports = router;
