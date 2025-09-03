const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("../db");
const normalizeUsername = require("../utils/normalizeUsername");

const router = express.Router();

/**
 * POST /auth/login-password
 * body: { identifier: string (email o username), password: string }
 * resp: { user_id, role, must_change }
 */
router.post("/login-password", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const isEmail = identifier.includes("@");
    const username = normalizeUsername(identifier);

    const query = `
      SELECT u.id, u.password_hash, u.must_change_password, u.activo, r.nombre AS role
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      WHERE u.activo = TRUE
        AND (
          ($1::boolean AND u.email = $2::citext) OR
          (NOT $1::boolean AND u.username = $3::citext)
        )
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [isEmail, identifier, username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    return res.json({
      user_id: user.id,
      role: user.role,               // 'profesor' | 'psicologo' | 'admin' | 'estudiante'
      must_change: user.must_change_password
    });
  } catch (err) {
    console.error("login-password error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /auth/login-code (opcional, para alumnos)
 * body: { username: string, code: string }
 */
router.post("/login-code", async (req, res) => {
  try {
    const { username, code } = req.body || {};
    if (!username || !code) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const uname = normalizeUsername(username);
    const query = `
      SELECT u.id, u.login_code_hash, u.login_code_expires_at, r.nombre AS role
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      WHERE u.activo = TRUE AND r.nombre='estudiante' AND u.username = $1::citext
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [uname]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "No existe el usuario" });

    if (!user.login_code_expires_at || new Date(user.login_code_expires_at) <= new Date()) {
      return res.status(401).json({ error: "Código expirado" });
    }

    const ok = await bcrypt.compare(code, user.login_code_hash);
    if (!ok) return res.status(401).json({ error: "Código inválido" });

    // Puedes invalidar el código aquí si quieres
    // await pool.query(`UPDATE app.usuarios SET login_code_hash=NULL, login_code_expires_at=NULL WHERE id=$1`, [user.id]);

    return res.json({
      user_id: user.id,
      role: user.role,
      must_change: true
    });
  } catch (err) {
    console.error("login-code error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

module.exports = router;
