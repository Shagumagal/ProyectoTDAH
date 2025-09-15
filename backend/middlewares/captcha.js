// backend/middlewares/captcha.js
const crypto = require("crypto");
const SECRET = process.env.CAPTCHA_SECRET || "DEV-CHANGE-ME";
const TTL_MS = 2 * 60 * 1000; // 2 min


function fromB64url(input) {
return Buffer.from(input, "base64url").toString("utf8");
}
function sign(dataB64) {
return crypto.createHmac("sha256", SECRET).update(dataB64).digest("base64url");
}
function parseToken(token) {
const [data, signature] = String(token || "").split(".");
if (!data || !signature) throw new Error("BAD_TOKEN");
const expected = sign(data);
if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
throw new Error("BAD_SIG");
}
const payload = JSON.parse(fromB64url(data));
return payload;
}


function verifyCaptcha(req, res, next) {
const enabled = String(process.env.ENABLE_CAPTCHA).toLowerCase() === "true";
if (!enabled) return next();


const token = req.headers["x-captcha-token"] || req.body?.captchaToken;
const answerId = req.headers["x-captcha-answer"] || req.body?.captchaAnswer;
try {
const payload = parseToken(token);
if (Date.now() - Number(payload.ts) > TTL_MS) {
return res.status(400).json({ ok: false, error: "CAPTCHA_EXPIRED" });
}
if (answerId !== payload.targetId) {
return res.status(400).json({ ok: false, error: "CAPTCHA_WRONG" });
}
return next();
} catch (_) {
return res.status(400).json({ ok: false, error: "CAPTCHA_INVALID" });
}
}


module.exports = { verifyCaptcha };