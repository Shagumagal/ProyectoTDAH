// backend/mailer.js
const nodemailer = require("nodemailer");

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

  // DEV: Ethereal (si está habilitado)
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

  // SMTP real
  transportPromise = Promise.resolve(makeSmtpTransport());
  return transportPromise;
}

async function sendLoginCodeEmail({ to, code, minutes = 10 }) {
  const transport = await buildTransport();

  // En dev puedes forzar un buzón (p.ej. YOPMAIL) sin tocar la DB
  const toAddress = process.env.FORCE_MAIL_TO || to;

  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    '"Plataforma TDAH" <no-reply@tdah.local>';

  const info = await transport.sendMail({
    from,
    to: toAddress,
    subject: "Tu código de verificación",
    text: `Tu código es ${code}. Expira en ${minutes} minutos.`,
    html: `<p>Tu código es <b style="font-size:18px;letter-spacing:2px">${code}</b>.</p>
           <p>Expira en ${minutes} minutos.</p>`,
  });

  console.log("MAIL accepted:", info.accepted, "rejected:", info.rejected, "response:", info.response);
  if (process.env.ETHEREAL === "true") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
  return info;
}

module.exports = { sendLoginCodeEmail };
