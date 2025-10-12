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

/* =========================
   2FA helpers por rol
   ========================= */
const TWOFA_ROLES = (process.env.TWOFA_ROLES || "admin,profesor,psicologo")
  .split(",")
  .map((s) => s.trim().toLowerCase());

const REQUIRE_EMAIL_FOR_2FA = String(process.env.TWOFA_REQUIRE_EMAIL || "1") === "1";

function requiresTwoFA(roleName) {
  const role = (roleName || "").toString().toLowerCase();
  return TWOFA_ROLES.includes(role);
}

/**
 * POST /auth/login-password
 * body: { identifier: string (email o username), password: string }
 * ✅ Verifica credenciales
 * ✅ Si el rol requiere 2FA y el usuario tiene email → inicia 2FA (2FA_REQUIRED)
 * ✅ Si el rol NO requiere 2FA (p. ej., 'estudiante') → emite JWT directo (OK)
 * ✅ Si el rol requiere 2FA pero NO tiene email → error 400 (configurable)
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

    // No filtramos por activo en SQL: traemos u.activo y validamos luego
    const query = `
      SELECT u.id, u.email, u.username, u.password_hash, u.must_change_password,
             u.activo, r.nombre AS role
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      WHERE (
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

    // Bloqueo explícito si está inactivo
    if (!user.activo) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    const must2FA = requiresTwoFA(user.role);

    // 1) Rol con 2FA obligatorio
    if (must2FA) {
      if (!user.email) {
        // Si el rol requiere 2FA pero no hay email, negar acceso (por defecto)
        if (REQUIRE_EMAIL_FOR_2FA) {
          return res
            .status(400)
            .json({ error: "Este rol requiere email para 2FA. Contacta al administrador." });
        }
        // Alternativa (si desactivas REQUIRE_EMAIL_FOR_2FA): permitir login directo (no recomendado)
      } else {
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
    }

    // 2) Rol SIN 2FA (p.ej., 'estudiante') → login directo
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
 * resp: { status:"OK", token, user }
 */
router.post("/verify-2fa", async (req, res) => {
  try {
    const { user_id, code } = req.body || {};
    if (!user_id || !code) return res.status(400).json({ error: "Faltan campos" });

    const result = await verifyTwoFactor({ userId: user_id, code });
    if (!result.ok) {
      return res.status(400).json({ error: result.reason || "INVALID_OR_EXPIRED" });
    }
//
    // Traemos role, must_change y activo para validar inactivo
    const { rows } = await pool.query(
      `SELECT r.nombre AS role, u.must_change_password, u.activo
         FROM app.usuarios u
         JOIN app.roles r ON r.id = u.rol_id
        WHERE u.id = $1
        LIMIT 1`,
      [user_id]
    );
    const info = rows[0] || { role: "usuario", must_change_password: false, activo: false };
    if (!info.activo) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

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

    // No filtramos por activo aquí para poder devolver 403 explícito
    const { rows } = await pool.query(
      `SELECT id, email, activo FROM app.usuarios WHERE id = $1 LIMIT 1`,
      [user_id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "NOT_FOUND" });
    if (!user.activo) return res.status(403).json({ error: "Usuario inactivo" });
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
    // No filtramos por activo aquí para poder devolver 403 explícito
    const query = `
      SELECT u.id, u.login_code_hash, u.login_code_expires_at, u.must_change_password,
             r.nombre AS role, u.activo
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      WHERE r.nombre = 'estudiante'
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

    // Bloquea si está inactivo (antes de invalidar el código)
    if (!user.activo) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    // Invalidar el código tras usarlo
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
