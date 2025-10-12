// backend/server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const passwordRoutes = require("./routes/password");

const app = express();

// --- CORS (debe ir ANTES de registrar rutas) ---
const ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  // permite también herramientas sin Origin (curl, Postman)
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, ORIGINS.length ? ORIGINS.includes(origin) : true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // responde preflight

// --- Middlewares base ---
app.use(express.json());
app.use(morgan("dev"));

// --- Health ---
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Rutas (pueden compartir prefijo /auth) ---
app.use("/auth", passwordRoutes); // /auth/forgot-password, /auth/reset-password
app.use("/auth", authRoutes);     // login, 2FA, etc.
app.use("/users", userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
  console.log("CORS_ORIGIN:", ORIGINS);
  console.log("JWT loaded?", !!process.env.JWT_SECRET);
});
