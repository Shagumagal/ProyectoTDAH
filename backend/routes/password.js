const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { requireAuth } = require("../middlewares/auth"); // (no lo usamos aquí, son rutas públicas)
const nodemailer = require("nodemailer");

const router = express.Router();

// Util: enviar email o loguear en dev
async function sendResetEmail(to, url) {
  // Si tienes SMTP en env, úsalo; si no, log por consola
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Soporte TDAH" <${SMTP_USER}>`,
      to,
      subject: "Recuperación de contraseña",
      html: `<p>Solicitaste restablecer tu contraseña.</p>
             <p><a href="${url}">Haz clic aquí para continuar</a></p>
             <p>Si no fuiste tú, ignora este correo.</p>`,
    });
    return;
  }

  // DEV: imprime en consola
  console.log(`[DEV] Enlace de reseteo para ${to}: ${url}`);
}

// POST /auth/forgot-password  { email }
router.post("/forgot-password", async (req, res) => {
  try {
    const rawEmail = (req.body?.email || "").trim().toLowerCase();
    if (!rawEmail) return res.status(400).json({ error: "Email requerido" });

    // Buscar usuario por email
    const u = await pool.query(
      `SELECT id, email FROM app.usuarios WHERE email = $1::citext LIMIT 1`,
      [rawEmail]
    );

    // Siempre respondemos 200 (para no filtrar si existe o no)
    const okResp = { ok: true, message: "Si el email existe, enviaremos un enlace." };

    if (!u.rows[0]) return res.json(okResp);

    // Generar token y guardar hash + expiración
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await pool.query(
      `UPDATE app.usuarios
         SET reset_token_hash = $2,
             reset_token_expires_at = $3,
             updated_at = now()
       WHERE id = $1`,
      [u.rows[0].id, tokenHash, expiresAt]
    );

    const appUrl = process.env.APP_PUBLIC_URL || "http://localhost:5173";
    const resetUrl = `${appUrl}/auth/reset?token=${token}`;
    await sendResetEmail(u.rows[0].email, resetUrl);

    return res.json(okResp);
  } catch (e) {
    console.error("forgot-password error:", e);
    return res.status(500).json({ error: "Error de servidor" });
  }
});

// POST /auth/reset-password  { token, password }
router.post("/reset-password", async (req, res) => {
  try {
    const token = (req.body?.token || "").trim();
    const password = (req.body?.password || "").trim();
    if (!token || !password) return res.status(400).json({ error: "Datos incompletos" });
    if (password.length < 6) return res.status(400).json({ error: "Mínimo 6 caracteres" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const found = await pool.query(
      `SELECT id FROM app.usuarios
        WHERE reset_token_hash = $1
          AND reset_token_expires_at IS NOT NULL
          AND reset_token_expires_at > now()
        LIMIT 1`,
      [tokenHash]
    );

    if (!found.rows[0]) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const userId = found.rows[0].id;

    await pool.query(
      `UPDATE app.usuarios
         SET password_hash = crypt($2, gen_salt('bf')),
             reset_token_hash = NULL,
             reset_token_expires_at = NULL,
             must_change_password = FALSE,
             updated_at = now()
       WHERE id = $1`,
      [userId, password]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return res.status(500).json({ error: "Error de servidor" });
  }
});

module.exports = router;


