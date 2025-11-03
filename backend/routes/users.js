// backend/routes/users.js
const express = require("express");
const { pool } = require("../db");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();

/* -------------------- helpers fecha de nacimiento -------------------- */
function parseDateOnly(s = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}
function isAtLeast5YearsOld(s) {
  const dt = parseDateOnly(s);
  if (!dt) return false;
  const today = new Date();
  const cutoff = new Date(Date.UTC(today.getFullYear() - 5, today.getMonth(), today.getDate()));
  return dt <= cutoff && dt >= new Date(Date.UTC(1900, 0, 1));
}

const GENEROS = new Set(["masculino","femenino","no_binario","prefiero_no_decir"]);
function normGenero(s = "") {
  const v = String(s).trim().toLowerCase();
  return GENEROS.has(v) ? v : null;
}

/* ------------------------------ helpers ------------------------------ */
const norm = (s = "") => s.trim().replace(/\s+/g, " ");
const normUser = (s = "") => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

// Todas las rutas de /users requieren estar autenticado
router.use(requireAuth);

// ====== GET: listar usuarios ======
const ROL_UI = {
  estudiante: "Alumno",
  profesor: "Docente",
  psicologo: "Psicólogo",
  admin: "Admin",
};

router.get("/", async (req, res) => {
  try {
    const myRole = (req.auth?.role || "").toLowerCase();
    let roleQ = (req.query.role || "").toString().trim().toLowerCase();

    if (myRole === "admin") {
      // sin restricciones
    } else if (myRole === "profesor") {
      if (!roleQ) roleQ = "estudiante";
      if (roleQ !== "estudiante") return res.status(403).json({ error: "FORBIDDEN" });
    } else {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const q = (req.query.q || "").toString().trim();
    const where = [];
    const params = [];
    let i = 0;

    if (roleQ) { i++; where.push(`r.nombre = $${i}`); params.push(roleQ); }
    if (q) { i++; where.push(`(u.nombre ILIKE $${i} OR u.email::text ILIKE $${i} OR COALESCE(u.username,'') ILIKE $${i})`); params.push(`%${q}%`); }

    const sql = `
      SELECT
        u.id,
        u.nombre AS nombre_completo,
        u.email,
        u.username,
        u.activo,
        r.nombre AS rol_db,
        u.fecha_nacimiento,
        u.genero
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY u.created_at DESC
    `;
    const { rows } = await pool.query(sql, params);

    const data = rows.map((x) => {
      const parts = (x.nombre_completo || "").trim().split(/\s+/);
      const nombre = parts.shift() || "";
      const apellido = parts.join(" ");
      return {
        id: x.id,
        nombre,
        apellido,
        correo: x.email || undefined,
        username: x.username || undefined,
        rol: ROL_UI[x.rol_db] || "Alumno",
        estado: x.activo ? "Activo" : "Inactivo",
        fecha_nacimiento: x.fecha_nacimiento || null,
        genero: x.genero || null,
      };
    });

    res.json(data);
  } catch (e) {
    console.error("GET /users error:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// ====== POST: crear usuario ======
router.post("/", requireRole("admin", "profesor"), async (req, res) => {
  const {
    nombres = "",
    apellidos = "",
    rol,
    email = "",
    username = "",
    password = "",
    fecha_nacimiento = "",
    genero = "",
  } = req.body || {};

  try {
    if (!rol) return res.status(400).json({ error: "Rol es obligatorio" });

    const actor = (req.auth?.role || "").toLowerCase();
    if (actor === "profesor" && rol !== "estudiante") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const fullName = norm(`${nombres} ${apellidos}`);
    if (!fullName) return res.status(400).json({ error: "Nombre(s) o Apellido(s) requerido(s)" });

    const uname = normUser(username);
    const hasEmail = !!email.trim();
    const hasPassword = !!password.trim();

    if (rol !== "estudiante" && !hasEmail) {
      return res.status(400).json({ error: `Email es obligatorio para ${rol}` });
    }
    if (rol === "estudiante" && !hasEmail && !uname) {
      return res.status(400).json({ error: "Para alumno sin email, username es obligatorio" });
    }
    if (uname && !/^[a-z0-9_]{3,24}$/.test(uname)) {
      return res.status(400).json({ error: "Username inválido (3–24, a-z0-9_)" });
    }

    if (rol === "estudiante" && !fecha_nacimiento) {
      return res.status(400).json({ error: "DOB_REQUIRED_FOR_STUDENT" });
    }
    if (fecha_nacimiento && !isAtLeast5YearsOld(fecha_nacimiento)) {
      return res.status(400).json({ error: "DOB_INVALID_OR_UNDER_5" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const r = await client.query(
        "SELECT id FROM app.roles WHERE nombre = $1 LIMIT 1",
        [rol]
      );
      if (!r.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Rol inválido" });
      }
      const rolId = r.rows[0].id;

      const colsRes = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='app' AND table_name='usuarios'
      `);
      const cols = new Set(colsRes.rows.map(r => r.column_name));

      const passwordForDb = hasPassword ? password : `${Date.now()}_${Math.random()}`;

      let insertSql;
      let params;

      const hasMCP = cols.has("must_change_password");
      const hasDOB = cols.has("fecha_nacimiento");

      if (hasMCP && hasDOB) {
        insertSql = `
          INSERT INTO app.usuarios
            (email, username, password_hash, nombre, rol_id, activo, must_change_password, fecha_nacimiento)
          VALUES
            (NULLIF($1,'')::citext, NULLIF($2,''), crypt($3, gen_salt('bf')), $4, $5, TRUE, $6, NULLIF($7,'')::date)
          RETURNING id
        `;
        params = [email, uname, passwordForDb, fullName, rolId, !hasPassword, fecha_nacimiento || ""];
      } else if (hasMCP && !hasDOB) {
        insertSql = `
          INSERT INTO app.usuarios
            (email, username, password_hash, nombre, rol_id, activo, must_change_password)
          VALUES
            (NULLIF($1,'')::citext, NULLIF($2,''), crypt($3, gen_salt('bf')), $4, $5, TRUE, $6)
          RETURNING id
        `;
        params = [email, uname, passwordForDb, fullName, rolId, !hasPassword];
      } else if (!hasMCP && hasDOB) {
        insertSql = `
          INSERT INTO app.usuarios
            (email, username, password_hash, nombre, rol_id, activo, fecha_nacimiento)
          VALUES
            (NULLIF($1,'')::citext, NULLIF($2,''), crypt($3, gen_salt('bf')), $4, $5, TRUE, NULLIF($6,'')::date)
          RETURNING id
        `;
        params = [email, uname, passwordForDb, fullName, rolId, fecha_nacimiento || ""];
      } else {
        insertSql = `
          INSERT INTO app.usuarios
            (email, username, password_hash, nombre, rol_id, activo)
          VALUES
            (NULLIF($1,'')::citext, NULLIF($2,''), crypt($3, gen_salt('bf')), $4, $5, TRUE)
          RETURNING id
        `;
        params = [email, uname, passwordForDb, fullName, rolId];
      }

      const ins = await client.query(insertSql, params);
      const userId = ins.rows[0].id;
      let loginCode = null;

      // Alumno sin password → emitir código si existen columnas
      if (
        rol === "estudiante" &&
        !hasPassword &&
        cols.has("login_code_hash") &&
        cols.has("login_code_expires_at")
      ) {
        loginCode = String(Math.floor(100000 + Math.random() * 900000));
        await client.query(
          `
          UPDATE app.usuarios
             SET login_code_hash = crypt($1, gen_salt('bf')),
                 login_code_expires_at = now() + interval '15 minutes'
           WHERE id = $2
          `,
          [loginCode, userId]
        );
      }

      // 👇 CAMBIO MÍNIMO: actualizar genero si la columna existe y vino en el body
      if (Object.prototype.hasOwnProperty.call(req.body, "genero") && cols.has("genero")) {
        const g = normGenero(genero);
        await client.query(`UPDATE app.usuarios SET genero = $1 WHERE id = $2`, [g, userId]);
      }

      await client.query("COMMIT");
      return res.status(201).json({ id: userId, login_code: loginCode });
    } catch (e) {
      await client.query("ROLLBACK");
      if (e.code === "23505") return res.status(409).json({ error: "Email o username ya existe" });
      console.error("create-user error:", e);
      return res.status(500).json({ error: e.message || "Error de servidor" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("create-user outer error:", err);
    return res.status(500).json({ error: "Error de servidor" });
  }
});

// ====== PUT: editar usuario ======
router.put("/:id", requireRole("admin", "profesor"), async (req, res) => {
  const { id } = req.params;
  const {
    nombres, apellidos, email, username, rol, rol_id, fecha_nacimiento, genero,
  } = req.body ?? {};

  try {
    const actor = (req.auth?.role || "").toLowerCase();

    if (actor === "profesor") {
      const chk = await pool.query(
        `SELECT r.nombre AS rol
           FROM app.usuarios u
           JOIN app.roles r ON r.id = u.rol_id
          WHERE u.id = $1
          LIMIT 1`,
        [id]
      );
      const targetRole = chk.rows[0]?.rol;
      if (targetRole !== "estudiante") return res.status(403).json({ error: "FORBIDDEN" });
      if (Object.prototype.hasOwnProperty.call(req.body, "rol")) delete req.body.rol;
      if (Object.prototype.hasOwnProperty.call(req.body, "rol_id")) delete req.body.rol_id;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "fecha_nacimiento")) {
      if (fecha_nacimiento && !isAtLeast5YearsOld(fecha_nacimiento)) {
        return res.status(400).json({ error: "DOB_INVALID_OR_UNDER_5" });
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Resolver rol_id si corresponde
      let roleId = null;
      if (rol_id != null) {
        roleId = Number(rol_id);
      } else if (rol != null && String(rol).trim() !== "") {
        const v = String(rol).toLowerCase().trim();
        const r = await client.query(`SELECT id FROM app.roles WHERE lower(nombre) = $1 LIMIT 1`, [v]);
        roleId = r.rows[0]?.id ?? null;
        if (roleId === null) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Rol no válido" });
        }
      }

      const sets = [];
      const vals = [id];
      let i = 1;

      const tocoNombre =
        Object.prototype.hasOwnProperty.call(req.body, "nombres") ||
        Object.prototype.hasOwnProperty.call(req.body, "apellidos");

      if (tocoNombre) {
        const fullName = norm(`${nombres} ${apellidos}`);
        if (!fullName) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "El nombre no puede ser vacío" });
        }
        i++; sets.push(`nombre = $${i}`); vals.push(fullName);
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
        if (email === null) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Email no puede ser nulo" });
        }
        const em = String(email ?? "").trim();
        const ok = !em || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
        if (!ok) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Email inválido" });
        }
        i++; sets.push(`email = NULLIF($${i}, '')::citext`); vals.push(em);
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "username")) {
        if (username === null || String(username).trim() === "") {
          sets.push(`username = NULL`);
        } else {
          const u = normUser(username);
          if (!/^[a-z0-9_]{3,24}$/.test(u)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Username inválido (3–24, a-z0-9_)" });
          }
          i++; sets.push(`username = $${i}`); vals.push(u);
        }
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "fecha_nacimiento")) {
        const dob = (fecha_nacimiento || "").trim();
        i++; sets.push(`fecha_nacimiento = NULLIF($${i}, '')::date`); vals.push(dob);
      }

      // 👇 NUEVO: actualizar genero si vino en el body
      if (Object.prototype.hasOwnProperty.call(req.body, "genero")) {
        const g = normGenero(genero || "");
        i++; sets.push(`genero = $${i}`); vals.push(g);
      }

      if (roleId != null) {
        i++; sets.push(`rol_id = $${i}`); vals.push(roleId);
      }

      if (sets.length === 0) {
        await client.query("ROLLBACK");
        return res.json({ ok: true, unchanged: true });
      }

      const q = `
        UPDATE app.usuarios
           SET ${sets.join(", ")}, updated_at = now()
         WHERE id = $1
        RETURNING id, nombre, email, username, rol_id, activo, fecha_nacimiento, genero
      `;
      const { rows } = await client.query(q, vals);
      await client.query("COMMIT");

      if (!rows.length) return res.status(404).json({ error: "Usuario no existe" });
      res.json(rows[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      if (e.code === "23505") return res.status(409).json({ error: "Email o username ya existe" });
      console.error("PUT /users error:", e);
      return res.status(500).json({ error: e.message || "Error actualizando" });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("PUT /users outer error:", e);
    return res.status(500).json({ error: "Error de servidor" });
  }
});

// ====== PATCH estado ======
router.patch("/:id/status", requireRole("admin", "profesor"), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body || {};
  if (typeof is_active !== "boolean") return res.status(400).json({ error: "is_active debe ser boolean" });

  try {
    const actor = (req.auth?.role || "").toLowerCase();
    if (actor === "profesor") {
      const chk = await pool.query(
        `SELECT r.nombre AS rol
           FROM app.usuarios u
           JOIN app.roles r ON r.id = u.rol_id
          WHERE u.id = $1
          LIMIT 1`,
        [id]
      );
      if (chk.rows[0]?.rol !== "estudiante") return res.status(403).json({ error: "FORBIDDEN" });
    }

    const { rows } = await pool.query(
      `
      UPDATE app.usuarios
         SET activo = $2,
             updated_at = now()
       WHERE id = $1
      RETURNING id, nombre, email, username, rol_id, activo
      `,
      [id, is_active]
    );
    if (!rows.length) return res.status(404).json({ error: "Usuario no existe" });
    res.json(rows[0]);
  } catch (e) {
    console.error("PATCH /users/:id/status error:", e);
    res.status(500).json({ error: e.message || "Error cambiando estado" });
  }
});

module.exports = router;
