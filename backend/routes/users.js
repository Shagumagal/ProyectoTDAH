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

module.exports = router;
