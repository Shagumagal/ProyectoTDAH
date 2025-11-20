// backend/mailer.js
const nodemailer = require("nodemailer");

// ============================
// 1) Config: Resend vs SMTP
// ============================
const USE_RESEND =
  !!process.env.RESEND_API_KEY && process.env.NODE_ENV === "production";

/* ============================
   SMTP / Ethereal (para LOCAL)
   ============================ */
let transportPromise; // cachea el transport

function makeSmtpTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP_HOST missing");

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465; // 465=SSL, 587=STARTTLS

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function buildTransport() {
  if (transportPromise) return transportPromise;

  // DEV: Ethereal si está habilitado
  if (process.env.NODE_ENV !== "production" && process.env.ETHEREAL === "true") {
    transportPromise = nodemailer.createTestAccount().then((test) =>
      nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: { user: test.user, pass: test.pass },
      })
    );
    return transportPromise;
  }

  // SMTP real (solo para LOCAL / donde no esté bloqueado)
  transportPromise = Promise.resolve(makeSmtpTransport());
  return transportPromise;
}

/* ============================
   Envío del mail 2FA
   ============================ */
async function sendLoginCodeEmail({ to, code, minutes = 10 }) {
  const toAddress = process.env.FORCE_MAIL_TO || to;

  // IMPORTANTE: para Resend el from debe ser aceptado
  const from =
    process.env.RESEND_FROM ||        // para producción con Resend
    process.env.SMTP_FROM ||          // para SMTP local
    '"Plataforma TDAH" <onboarding@resend.dev>'; // fallback seguro

  const subject = "Tu código de verificación";
  const text = `Tu código es ${code}. Expira en ${minutes} minutos.`;
  const html = `<p>Tu código es <b style="font-size:18px;letter-spacing:2px">${code}</b>.</p>
                <p>Expira en ${minutes} minutos.</p>`;

  // 1) PRODUCCIÓN en Render → usamos RESEND (HTTP, no SMTP)
  if (USE_RESEND) {
    // En Node 18+ fetch ya existe globalmente, NO necesitamos node-fetch
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: toAddress,
        subject,
        text,
        html,
      }),
    });

    const body = await resp.text();
    if (!resp.ok) {
      console.error("Resend error:", resp.status, body);
      // No lanzamos para no romper el login, solo log
      return;
    }
    console.log("Resend OK:", body);
    return;
  }

  // 2) LOCAL (dev) → seguimos con Nodemailer (SMTP / Ethereal)
  const transport = await buildTransport();
  const info = await transport.sendMail({ from, to: toAddress, subject, text, html });

  console.log(
    "MAIL accepted:",
    info.accepted,
    "rejected:",
    info.rejected,
    "response:",
    info.response
  );
  if (process.env.ETHEREAL === "true") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
  return info;
}

module.exports = { sendLoginCodeEmail };
