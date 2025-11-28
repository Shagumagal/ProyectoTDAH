// backend/routes/me.js
const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();
router.use(requireAuth);

// ---- Helpers / normalizadores ----
const norm = (s = "") => s.trim().replace(/\s+/g, " ");
const normUser = (s = "") => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

// Validaciones básicas
const ALLOWED_GENDERS = new Set(["masculino", "femenino", "no_binario", "prefiero_no_decir"]);

function isYYYYMMDD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isValidDobAtLeast5Years(dateStr) {
  if (!isYYYYMMDD(dateStr)) return false;
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const min = new Date(today);
  min.setFullYear(min.getFullYear() - 5);
  // no futuro y al menos 5 años
  return d <= min;
}

// ---- GET /me — mis datos ----
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,
              u.nombre                AS nombre_completo,
              u.email,
              u.username,
              u.activo,
              u.fecha_nacimiento,     -- DATE (puede ser NULL)
              u.genero,               -- TEXT (puede ser NULL)
              r.nombre                AS rol
         FROM app.usuarios u
         JOIN app.roles r ON r.id = u.rol_id
        WHERE u.id = $1
        LIMIT 1`,
      [req.auth.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: "NOT_FOUND" });

    const full = (rows[0].nombre_completo || "").trim();
    const parts = full.split(/\s+/);
    const nombres = parts.shift() || "";
    const apellidos = parts.join(" ");

    res.json({
      id: rows[0].id,
      nombres,
      apellidos,
      email: rows[0].email,
      username: rows[0].username,
      rol: rows[0].rol,
      activo: rows[0].activo,
      // devolver como 'YYYY-MM-DD' o null
      fecha_nacimiento: rows[0].fecha_nacimiento
        ? String(rows[0].fecha_nacimiento) // PG devuelve Date -> a ISO corto
        : null,
      genero: rows[0].genero || null,
    });
  } catch (e) {
    console.error("GET /me error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ---- PUT /me — actualizar mis datos ----
// Acepta: nombres, apellidos, email, username, fecha_nacimiento (YYYY-MM-DD|null), genero (permitidos|null)
router.put("/", async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      email,
      username,
      fecha_nacimiento, // string YYYY-MM-DD o null
      genero,           // string permitido o null
    } = req.body ?? {};

    const sets = [];
    const vals = [req.auth.userId];
    let i = 1;

    // nombre completo (obligatorio si se envía cualquiera de los dos)
    if (Object.prototype.hasOwnProperty.call(req.body, "nombres") ||
        Object.prototype.hasOwnProperty.call(req.body, "apellidos")) {
      const full = norm(`${nombres ?? ""} ${apellidos ?? ""}`);
      if (!full) return res.status(400).json({ error: "EMPTY_NAME" });
      i++; sets.push(`nombre = $${i}`); vals.push(full);
    }

    // email (opcional; si viene, validar formato; si "", dejar NULL)
    if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
      const em = String(email ?? "").trim();

      // Para no estudiantes, el email es obligatorio si se intenta modificar
      const myRole = (req.auth?.role || "").toLowerCase();
      if (!em && myRole !== "estudiante") {
        return res.status(400).json({ error: "EMAIL_REQUIRED" });
      }

      const ok = !em || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      if (!ok) return res.status(400).json({ error: "EMAIL_INVALID" });
      i++; sets.push(`email = NULLIF($${i}, '')::citext`); vals.push(em);
    }

    // username (opcional; puede vaciarse a NULL)
    if (Object.prototype.hasOwnProperty.call(req.body, "username")) {
      if (username === null || String(username).trim() === "") {
        sets.push(`username = NULL`);
      } else {
        const u = normUser(username);
        if (!/^[a-z0-9_]{3,24}$/.test(u)) {
          return res.status(400).json({ error: "USERNAME_INVALID" });
        }
        i++; sets.push(`username = $${i}`); vals.push(u);
      }
    }

    // fecha_nacimiento (opcional; string 'YYYY-MM-DD' o null/"" => NULL)
    if (Object.prototype.hasOwnProperty.call(req.body, "fecha_nacimiento")) {
      if (fecha_nacimiento === null || fecha_nacimiento === "") {
        sets.push(`fecha_nacimiento = NULL`);
      } else {
        const ds = String(fecha_nacimiento);
        if (!isValidDobAtLeast5Years(ds)) {
          return res.status(400).json({ error: "DOB_INVALID_OR_TOO_YOUNG" });
        }
        i++; sets.push(`fecha_nacimiento = $${i}::date`); vals.push(ds);
      }
    }

    // genero (opcional; string permitido o null/"" => NULL)
    if (Object.prototype.hasOwnProperty.call(req.body, "genero")) {
      if (genero === null || String(genero).trim() === "") {
        sets.push(`genero = NULL`);
      } else {
        const g = String(genero).toLowerCase().trim();
        if (!ALLOWED_GENDERS.has(g)) {
          return res.status(400).json({ error: "GENDER_INVALID" });
        }
        i++; sets.push(`genero = $${i}`); vals.push(g);
      }
    }

    if (sets.length === 0) return res.json({ ok: true, unchanged: true });

    const q = `
      UPDATE app.usuarios
         SET ${sets.join(", ")}, updated_at = now()
       WHERE id = $1
      RETURNING id, nombre, email, username, fecha_nacimiento, genero
    `;
    const { rows } = await pool.query(q, vals);

    res.json({
      id: rows[0].id,
      nombre_completo: rows[0].nombre,
      email: rows[0].email,
      username: rows[0].username,
      fecha_nacimiento: rows[0].fecha_nacimiento ? String(rows[0].fecha_nacimiento) : null,
      genero: rows[0].genero || null,
    });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "UNIQUE_CONFLICT" });
    console.error("PUT /me error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ---- POST /me/password — cambiar contraseña ----
router.post("/password", async (req, res) => {
  try {
    const { current_password, new_password } = req.body ?? {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: "WEAK_PASSWORD" });
    }

    const check = await pool.query(
      `SELECT id FROM app.usuarios
        WHERE id = $1
          AND password_hash = crypt($2, password_hash)
        LIMIT 1`,
      [req.auth.userId, current_password]
    );
    if (!check.rows[0]) return res.status(400).json({ error: "BAD_CURRENT_PASSWORD" });

    await pool.query(
      `UPDATE app.usuarios
          SET password_hash        = crypt($2, gen_salt('bf')),
              must_change_password = FALSE,
              password_updated_at  = now(),
              updated_at           = now()
        WHERE id = $1`,
      [req.auth.userId, new_password]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /me/password error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

module.exports = router;
