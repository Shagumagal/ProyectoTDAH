// backend/server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const resultadosRouter = require("./routes/resultados");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const passwordRoutes = require("./routes/password");
const meRoutes = require("./routes/me");
const gameRoutes = require("./routes/game");

const app = express();

// --- CORS ---
// Orígenes base (desde .env o valores por defecto para dev local)
const baseOrigins = (process.env.CORS_ORIGINS?.split(',') ?? [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://proyecto-tdah.vercel.app"
]).map(o => o.trim());

// Patrones adicionales que siempre se permiten (Itch.io y su CDN)
const ALWAYS_ALLOWED_PATTERNS = [
  /^https?:\/\/([\w-]+\.)?itch\.io$/,
  /^https?:\/\/([\w-]+\.)?hwcdn\.net$/,
  /^https?:\/\/([\w-]+\.)?unity\.com$/,
];

function isOriginAllowed(origin) {
  // Sin origin (curl, Postman, apps móviles) → permitir
  if (!origin) return true;
  // Está en la lista explícita
  if (baseOrigins.includes(origin)) return true;
  // Coincide con algún patrón wildcard
  return ALWAYS_ALLOWED_PATTERNS.some(re => re.test(origin));
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn("CORS bloqueado para:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Preflight (OPTIONS)
app.options("*", cors(corsOptions));

// --- Middlewares base ---
app.use(express.json());
app.use(morgan("dev"));

// --- Health ---
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Rutas ---
app.use("/auth", passwordRoutes);
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/users", userRoutes);
app.use("/game", gameRoutes);
app.use("/resultados", resultadosRouter);
app.use("/api", require("./routes/metricas-hiperactividad"));
app.use("/api/ai-analysis", require("./routes/ai-analysis"));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
  console.log("CORS_ORIGINS:", allowedOrigins);
  console.log("JWT loaded?", !!process.env.JWT_SECRET);
});

// Manejo de errores globales para evitar crashes por promesas no manejadas
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // No salimos del proceso, solo logueamos
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Opcional: process.exit(1) si es muy grave, pero para dev mejor ver el error sin reiniciar todo el tiempo
});
