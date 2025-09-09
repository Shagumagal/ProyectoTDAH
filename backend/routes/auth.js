// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const normalizeUsername = require("../utils/normalizeUsername");
const {
  startTwoFactor,
  verifyTwoFactor,
  resendTwoFactor,
} = require("../services/twofactor.service");

const router = express.Router();

/**
 * POST /auth/login-password
 * body: { identifier: string (email o username), password: string }
 * ✅ Verifica credenciales
 * ✅ Si el usuario tiene email → inicia 2FA por correo y responde 2FA_REQUIRED
 * ✅ Si NO tiene email → emite JWT directo (OK)
 * resp (2FA): { status:"2FA_REQUIRED", user_id, email, role, must_change, expires_in }
 * resp (OK):  { status:"OK", token, user:{ id, role, must_change } }
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
      SELECT u.id, u.email, u.username, u.password_hash, u.must_change_password,
             u.activo, r.nombre AS role
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

    // Si el usuario tiene email, iniciamos 2FA por correo
    if (user.email) {
      const { expires_in } = await startTwoFactor({ id: user.id, email: user.email });
      return res.json({
        status: "2FA_REQUIRED",
        user_id: user.id,
        email: user.email,
        role: user.role, // 'profesor' | 'psicologo' | 'admin' | 'estudiante'
        must_change: user.must_change_password,
        expires_in,
      });
    }

    // Si NO tiene email (p.ej. estudiante sin correo), emitimos token directo
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    return res.json({
      status: "OK",
      token,
      user: {
        id: user.id,
        role: user.role,
        must_change: user.must_change_password,
      },
    });
  } catch (err) {
    console.error("login-password error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /auth/verify-2fa
 * body: { user_id: number, code: string }
 * resp: { status:"OK", token }
 */
router.post("/verify-2fa", async (req, res) => {
  try {
    const { user_id, code } = req.body || {};
    if (!user_id || !code) return res.status(400).json({ error: "Faltan campos" });

    const result = await verifyTwoFactor({ userId: user_id, code });
    if (!result.ok) {
      return res.status(400).json({ error: result.reason || "INVALID_OR_EXPIRED" });
    }

    // Obtener rol para incluir en el token (opcional)
    const { rows } = await pool.query(
      `SELECT r.nombre AS role, u.must_change_password
         FROM app.usuarios u
         JOIN app.roles r ON r.id = u.rol_id
        WHERE u.id = $1
        LIMIT 1`,
      [user_id]
    );
    const info = rows[0] || { role: "usuario", must_change_password: false };

    const token = jwt.sign({ sub: user_id, role: info.role }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    return res.json({
      status: "OK",
      token,
      user: { id: user_id, role: info.role, must_change: info.must_change_password },
    });
  } catch (err) {
    console.error("verify-2fa error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /auth/resend-2fa
 * body: { user_id: number }
 * resp: { status:"RESENT", expires_in }
 */
router.post("/resend-2fa", async (req, res) => {
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "Faltan campos" });

    const { rows } = await pool.query(
      `SELECT id, email FROM app.usuarios WHERE id = $1 AND activo = TRUE LIMIT 1`,
      [user_id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "NOT_FOUND" });
    if (!user.email) return res.status(400).json({ error: "NO_EMAIL" });

    const { expires_in } = await resendTwoFactor({ id: user.id, email: user.email });
    return res.json({ status: "RESENT", expires_in });
  } catch (err) {
    console.error("resend-2fa error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /auth/login-code  (flujo alterno para estudiantes con código temporal)
 * body: { username: string, code: string }
 * resp: { status:"OK", token, user:{ id, role, must_change:true } }
 */
router.post("/login-code", async (req, res) => {
  try {
    const { username, code } = req.body || {};
    if (!username || !code) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const uname = normalizeUsername(username);
    const query = `
      SELECT u.id, u.login_code_hash, u.login_code_expires_at, u.must_change_password,
             r.nombre AS role
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      WHERE u.activo = TRUE
        AND r.nombre = 'estudiante'
        AND u.username = $1::citext
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [uname]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "No existe el usuario" });

    if (!user.login_code_expires_at || new Date(user.login_code_expires_at) <= new Date()) {
      return res.status(401).json({ error: "Código expirado" });
    }

    // El hash fue generado con pgcrypto (bcrypt 'bf') o bcrypt: compare es compatible
    const ok = await bcrypt.compare(code, user.login_code_hash);
    if (!ok) return res.status(401).json({ error: "Código inválido" });

    // Invalidar el código tras usarlo (recomendado)
    await pool.query(
      `UPDATE app.usuarios
          SET login_code_hash = NULL,
              login_code_expires_at = NULL
        WHERE id = $1`,
      [user.id]
    );

    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.json({
      status: "OK",
      token,
      user: { id: user.id, role: user.role, must_change: true },
    });
  } catch (err) {
    console.error("login-code error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

module.exports = router;

