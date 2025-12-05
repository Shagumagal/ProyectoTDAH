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
const allowedOrigins = (process.env.CORS_ORIGINS?.split(',') ?? [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://proyecto-tdah.vercel.app"
]).map(o => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight (OPTIONS)
app.options(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

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
