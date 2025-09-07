// backend/routes/users.js
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// Helpers
const norm = (s = "") => s.trim().replace(/\s+/g, " ");
const normUser = (s = "") => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");


// ====== GET: listar usuarios (para la tabla) ======
const ROL_UI = {
  estudiante: "Alumno",
  profesor: "Docente",
  psicologo: "Psicólogo",
  admin: "Admin",
};

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.nombre AS nombre_completo,
        u.email,
        u.username,
        u.activo,
        r.nombre AS rol_db
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      ORDER BY u.created_at DESC
    `);

    const data = rows.map((x) => {
      const full = (x.nombre_completo || "").trim();
      const parts = full.split(/\s+/);
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
      };
    });

    res.json(data);
  } catch (e) {
    console.error("GET /users error:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// ====== POST: crear usuario (defensivo vs. migraciones faltantes) ======
router.post("/", async (req, res) => {
  const {
    nombres = "",
    apellidos = "",
    rol,            // 'estudiante' | 'profesor' | 'psicologo' | 'admin'
    email = "",
    username = "",
    password = "",  // opcional
  } = req.body || {};

  console.log("POST /users payload:", req.body);

  try {
    if (!rol) return res.status(400).json({ error: "Rol es obligatorio" });

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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // rol_id
      const r = await client.query(
        "SELECT id FROM app.roles WHERE nombre = $1 LIMIT 1",
        [rol]
      );
      if (!r.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Rol inválido" });
      }
      const rolId = r.rows[0].id;

      // Descubrir columnas existentes (para soportar instalaciones parciales)
      const colsRes = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='app' AND table_name='usuarios'
      `);
      const cols = new Set(colsRes.rows.map(r => r.column_name));

      const passwordForDb = hasPassword ? password : `${Date.now()}_${Math.random()}`;

      // Armamos el INSERT según columnas disponibles
      let insertSql;
      let params;

      if (cols.has("must_change_password")) {
        insertSql = `
          INSERT INTO app.usuarios
            (email, username, password_hash, nombre, rol_id, activo, must_change_password)
          VALUES
            (NULLIF($1,'')::citext, NULLIF($2,''), crypt($3, gen_salt('bf')), $4, $5, TRUE, $6)
          RETURNING id
        `;
        params = [email, uname, passwordForDb, fullName, rolId, !hasPassword];
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

      // Alumno sin password → emitir código si existen las columnas correspondientes
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

      await client.query("COMMIT");
      return res.status(201).json({ id: userId, login_code: loginCode });
    } catch (e) {
      await client.query("ROLLBACK");
      if (e.code === "23505") {
        return res.status(409).json({ error: "Email o username ya existe" });
      }
      console.error("create-user error:", e);
       console.error("create-user error:", e);
  // 👇 TEMPORAL: muestra el detalle al front para depurar
  return res.status(500).json({ error: e.message || "Error de servidor" });
      return res.status(500).json({ error: "Error de servidor" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("create-user outer error:", err);
    return res.status(500).json({ error: "Error de servidor" });
  }
});

// PUT /users/:id — Editar (nombre completo, email, username, rol_id)
// PUT /users/:id — Editar (nombre, email, username, rol_id)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nombres,      // string | undefined
    apellidos,    // string | undefined
    email,        // string | undefined  (NO se acepta null)
    username,     // string | null | undefined  (SÍ puede ser null)
    rol,          // 'estudiante' | 'profesor' | 'psicologo' | 'admin' | undefined
    rol_id,       // number | undefined
  } = req.body ?? {};

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // --- Resolver rol_id si lo mandan ---
      let roleId = null;
      if (rol_id != null) {
        roleId = Number(rol_id);
      } else if (rol != null && String(rol).trim() !== "") {
        const v = String(rol).toLowerCase().trim();
        const r = await client.query(
          `SELECT id FROM app.roles WHERE lower(nombre) = $1 LIMIT 1`,
          [v]
        );
        roleId = r.rows[0]?.id ?? null;
        if (roleId === null) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Rol no válido" });
        }
      }

      // --- Construir SET dinámico ---
      const sets = [];
      const vals = [id];
      let i = 1; // $1 = id

      // Nombre: si llegan nombres/apellidos (uno o ambos), debemos actualizar y NO permitir vacío
      const tocóNombre =
        Object.prototype.hasOwnProperty.call(req.body, "nombres") ||
        Object.prototype.hasOwnProperty.call(req.body, "apellidos");

      if (tocóNombre) {
        const fullName = norm(`${nombres} ${apellidos}`);
        if (!fullName) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "El nombre no puede ser vacío" });
        }
        i++; sets.push(`nombre = $${i}`); vals.push(fullName);
      }

      // Email: si lo mandan, debe ser string no-vacío y válido (NO se acepta null)
      if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
        if (email === null) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Email no puede ser nulo" });
        }
        const em = String(email ?? "").trim();
        const ok = !!em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
        if (!ok) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Email inválido" });
        }
        i++; sets.push(`email = $${i}::citext`); vals.push(em);
      }

      // Username: único campo que se puede dejar a NULL
      if (Object.prototype.hasOwnProperty.call(req.body, "username")) {
        if (username === null) {
          sets.push(`username = NULL`); // limpiar
        } else {
          const u = normUser(username);
          // Si queda vacío, lo consideramos "no cambio"
          if (u) {
            i++; sets.push(`username = $${i}`); vals.push(u);
          }
        }
      }

      // rol_id si se resolvió
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
        RETURNING id, nombre, email, username, rol_id, activo
      `;
      const { rows } = await client.query(q, vals);
      await client.query("COMMIT");

      if (!rows.length) return res.status(404).json({ error: "Usuario no existe" });
      res.json(rows[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      if (e.code === "23505") {
        return res.status(409).json({ error: "Email o username ya existe" });
      }
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

router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body || {};
  if (typeof is_active !== "boolean") {
    return res.status(400).json({ error: "is_active debe ser boolean" });
  }
  try {
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

//"2FA"

module.exports = router;
