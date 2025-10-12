// backend/routes/me.js
const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();
router.use(requireAuth);

// Normalizadores
const norm = (s = "") => s.trim().replace(/\s+/g, " ");
const normUser = (s = "") => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

// GET /me — mis datos
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre AS nombre_completo, u.email, u.username, u.activo,
              r.nombre AS rol
         FROM app.usuarios u
         JOIN app.roles r ON r.id = u.rol_id
        WHERE u.id = $1
        LIMIT 1`,
      [req.auth.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: "NOT_FOUND" });

    const full = (rows[0].nombre_completo || "").trim();
    const parts = full.split(/\s+/);
    const nombres = parts.shift() || "";
    const apellidos = parts.join(" ");

    res.json({
      id: rows[0].id,
      nombres,
      apellidos,
      email: rows[0].email,
      username: rows[0].username,
      rol: rows[0].rol,
      activo: rows[0].activo,
    });
  } catch (e) {
    console.error("GET /me error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// PUT /me — actualizar mis datos (nombres, apellidos, email, username)
router.put("/", async (req, res) => {
  try {
    const { nombres, apellidos, email, username } = req.body ?? {};
    const sets = [];
    const vals = [req.auth.userId];
    let i = 1;

    // nombre completo
    if (nombres != null || apellidos != null) {
      const full = norm(`${nombres ?? ""} ${apellidos ?? ""}`);
      if (!full) return res.status(400).json({ error: "EMPTY_NAME" });
      i++; sets.push(`nombre = $${i}`); vals.push(full);
    }

    // email (opcional, pero si viene debe ser válido)
    if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
      if (email === null) return res.status(400).json({ error: "EMAIL_NULL" });
      const em = String(email ?? "").trim();
      const ok = !em || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      if (!ok) return res.status(400).json({ error: "EMAIL_INVALID" });
      i++; sets.push(`email = NULLIF($${i}, '')::citext`); vals.push(em);
    }

    // username (opcional; puede vaciarse a NULL)
    if (Object.prototype.hasOwnProperty.call(req.body, "username")) {
      if (username === null || String(username).trim() === "") {
        sets.push(`username = NULL`);
      } else {
        const u = normUser(username);
        if (!/^[a-z0-9_]{3,24}$/.test(u)) {
          return res.status(400).json({ error: "USERNAME_INVALID" });
        }
        i++; sets.push(`username = $${i}`); vals.push(u);
      }
    }

    if (sets.length === 0) return res.json({ ok: true, unchanged: true });

    const q = `
      UPDATE app.usuarios
         SET ${sets.join(", ")}, updated_at = now()
       WHERE id = $1
      RETURNING id, nombre, email, username`;
    const { rows } = await pool.query(q, vals);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "UNIQUE_CONFLICT" });
    console.error("PUT /me error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// POST /me/password — cambiar contraseña (requiere contraseña actual)
router.post("/password", async (req, res) => {
  try {
    const { current_password, new_password } = req.body ?? {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: "WEAK_PASSWORD" });
    }

    // validar current_password con pgcrypto
    const check = await pool.query(
      `SELECT id FROM app.usuarios
        WHERE id = $1
          AND password_hash = crypt($2, password_hash)
        LIMIT 1`,
      [req.auth.userId, current_password]
    );
    if (!check.rows[0]) return res.status(400).json({ error: "BAD_CURRENT_PASSWORD" });

    await pool.query(
      `UPDATE app.usuarios
          SET password_hash = crypt($2, gen_salt('bf')),
              must_change_password = FALSE,
              updated_at = now()
        WHERE id = $1`,
      [req.auth.userId, new_password]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /me/password error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

module.exports = router;
