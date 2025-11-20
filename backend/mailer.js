// backend/mailer.js
const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// ============================
// Config: Resend vs SMTP
// ============================
const isProd = process.env.NODE_ENV === "production";
const hasResendKey = !!process.env.RESEND_API_KEY;
const USE_RESEND = isProd && hasResendKey;

let resendClient = null;
if (hasResendKey) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

// ============ SMTP (solo para LOCAL / dev) ============
let transportPromise; // cacheado

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

  if (process.env.NODE_ENV !== "production" && process.env.ETHEREAL === "true") {
    // Ethereal solo para desarrollo local
    transportPromise = nodemailer.createTestAccount().then((test) =>
      nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: { user: test.user, pass: test.pass },
      })
    );
    return transportPromise;
  }

  transportPromise = Promise.resolve(makeSmtpTransport());
  return transportPromise;
}

// ============ Envío del mail 2FA ============
async function sendLoginCodeEmail({ to, code, minutes = 10 }) {
  const toAddress = process.env.FORCE_MAIL_TO || to;

  const subject = "Tu código de verificación";
  const text = `Tu código es ${code}. Expira en ${minutes} minutos.`;
  const html = `<p>Tu código es <b style="font-size:18px;letter-spacing:2px">${code}</b>.</p>
                <p>Expira en ${minutes} minutos.</p>`;

  // FROM:
  //  - en Resend debe ser un remitente válido (onboarding@resend.dev sirve para pruebas)
  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    '"Plataforma TDAH" <onboarding@resend.dev>';

  // 1) PRODUCCIÓN: usar Resend
  if (USE_RESEND && resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from,
        to: [toAddress],
        subject,
        html,
        text,
      });

      if (error) {
        console.error("Resend error:", error);
      } else {
        console.log("Resend OK, id:", data?.id);
      }
      return;
    } catch (err) {
      console.error("Resend exception:", err);
      // No lanzamos error: el flujo de 2FA sigue, solo que no llega el mail
      return;
    }
  }

  // 2) DESARROLLO LOCAL: Nodemailer (SMTP / Ethereal)
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
