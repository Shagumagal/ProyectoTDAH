// backend/services/twofactor.service.js
const { pool } = require("../db");
const { sendLoginCodeEmail } = require("../mailer");
const crypto = require("crypto");

function generateCode() {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

async function startTwoFactor(user, ttlMinutes = 10) {
  if (!user || !user.id) throw new Error("USER_REQUIRED");
  const code = generateCode();

  await pool.query(
    `UPDATE app.usuarios
       SET login_code_hash = crypt($1, gen_salt('bf')),
           login_code_expires_at = now() + ($2)::interval
     WHERE id = $3`,
    [code, `${ttlMinutes} minutes`, user.id]
  );

  // En DEV, logea el código para probar incluso si el mailer falla
  const dev = process.env.NODE_ENV !== "production";
  if (dev) console.log(`[2FA DEV] user ${user.id} code: ${code}`);

  if (user.email) {
    try {
      await sendLoginCodeEmail({ to: user.email, code, minutes: ttlMinutes });
    } catch (e) {
      console.error("sendLoginCodeEmail error:", e?.message || e);
      // ⬅️ NO lanzamos: permitimos seguir con 2FA_REQUIRED
    }
  }

  return { expires_in: ttlMinutes * 60, dev_code: dev ? code : undefined };
}

async function verifyTwoFactor({ userId, code }) {
  if (!userId || !code) return { ok: false, reason: "MISSING" };
  const { rows } = await pool.query(
    `SELECT login_code_hash, login_code_expires_at FROM app.usuarios WHERE id=$1`,
    [userId]
  );
  const u = rows[0];
  if (!u || !u.login_code_hash) return { ok: false, reason: "NO_CODE" };
  const { rows: v } = await pool.query(
    `SELECT crypt($1,$2) = $2 AS ok`,
    [code, u.login_code_hash]
  );
  const ok = v[0]?.ok === true;
  const notExpired = u.login_code_expires_at && new Date(u.login_code_expires_at) > new Date();
  if (!ok || !notExpired) return { ok: false, reason: "INVALID_OR_EXPIRED" };

  await pool.query(
    `UPDATE app.usuarios
        SET login_code_hash=NULL, login_code_expires_at=NULL
      WHERE id=$1`,
    [userId]
  );
  return { ok: true };
}

async function resendTwoFactor(user) {
  return startTwoFactor(user);
}
function requiresTwoFA(user) {
  // acepta user.rol / user.role / user.rol_nombre (string)
  const role =
    (user?.rol || user?.role || user?.rol_nombre || "").toString().toLowerCase();

  const list = (process.env.TWOFA_ROLES || "admin,profesor,psicologo")
    .split(",")
    .map(s => s.trim().toLowerCase());

  return list.includes(role);
}
module.exports = { startTwoFactor, verifyTwoFactor, resendTwoFactor };
