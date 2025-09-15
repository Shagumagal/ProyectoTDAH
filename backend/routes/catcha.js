const express = require("express");


const ENABLED = String(process.env.ENABLE_CAPTCHA).toLowerCase() === "true";
const SECRET = process.env.CAPTCHA_SECRET || "DEV-CHANGE-ME";
const TTL_MS = 2 * 60 * 1000; // 2 minutos


// Opciones de figuras/colores (emoji + label accesible)
const ITEMS = [
{ id: "blue_circle", label: "círculo azul", emoji: "🔵" },
{ id: "red_circle", label: "círculo rojo", emoji: "🔴" },
{ id: "green_circle", label: "círculo verde", emoji: "🟢" },
{ id: "yellow_circle", label: "círculo amarillo", emoji: "🟡" },
{ id: "blue_square", label: "cuadrado azul", emoji: "🟦" },
{ id: "red_square", label: "cuadrado rojo", emoji: "🟥" },
{ id: "green_square", label: "cuadrado verde", emoji: "🟩" },
{ id: "yellow_square", label: "cuadrado amarillo", emoji: "🟨" },
];


function b64url(input) {
return Buffer.from(input).toString("base64url");
}
function fromB64url(input) {
return Buffer.from(input, "base64url").toString("utf8");
}
function sign(dataB64) {
return crypto.createHmac("sha256", SECRET).update(dataB64).digest("base64url");
}
function makeToken(payloadObj) {
const data = b64url(JSON.stringify(payloadObj));
const signature = sign(data);
return `${data}.${signature}`;
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


function sample(arr, n) {
const pool = arr.slice();
const out = [];
while (out.length < n && pool.length) {
const i = Math.floor(Math.random() * pool.length);
out.push(pool.splice(i, 1)[0]);
}
return out;
}


// GET /captcha → crea desafío
router.get("/", (_req, res) => {
if (!ENABLED) return res.json({ enabled: false });
const options = sample(ITEMS, 4);
const target = options[Math.floor(Math.random() * options.length)];
const payload = { type: "pick", targetId: target.id, optionIds: options.map(o => o.id), ts: Date.now() };
const token = makeToken(payload);
res.json({
enabled: true,
token,
prompt: `Toca el ${target.label}`,
options: options.map(o => ({ id: o.id, label: o.label, emoji: o.emoji }))
});
});


// POST /captcha/verify { token, answerId }
router.post("/verify", express.json(), (req, res) => {
if (!ENABLED) return res.json({ ok: true, reason: "DISABLED" });
try {
const { token, answerId } = req.body || {};
const payload = parseToken(token);
if (Date.now() - Number(payload.ts) > TTL_MS) {
return res.status(400).json({ ok: false, error: "EXPIRED" });
}
if (answerId !== payload.targetId) {
return res.status(400).json({ ok: false, error: "WRONG" });
}
// Opcional: emitir un pase efímero firmado (no es estrictamente necesario)
return res.json({ ok: true });
} catch (e) {
return res.status(400).json({ ok: false, error: "INVALID" });
}
});


module.exports = router;