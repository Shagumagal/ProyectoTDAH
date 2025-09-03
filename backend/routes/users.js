// backend/routes/users.js
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// helpers
const norm = (s = "") => s.trim().replace(/\s+/g, " ");
const normUser = (s = "") => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

router.post("/", async (req, res) => {
  const {
    nombres = "",
    apellidos = "",
    rol,            // 'estudiante' | 'profesor' | 'psicologo' | 'admin'
    email = "",
    username = "",
    password = ""   // opcional
  } = req.body || {};


  try {
    // Validaciones de UI/negocio
    if (!rol) return res.status(400).json({ error: "Rol es obligatorio" });

    const fullName = norm(`${nombres} ${apellidos}`) || null;
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

      // 1) rol_id
      const r = await client.query(
        "SELECT id FROM app.roles WHERE nombre = $1 LIMIT 1",
        [rol]
      );
      if (!r.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Rol inválido" });
      }
      const rolId = r.rows[0].id;

      // 2) inserción con password (si no viene, generamos una aleatoria fuerte pero no se muestra)
      const passwordForDb = hasPassword ? password : `${Date.now()}_${Math.random()}`;

      const ins = await client.query(
        `
        INSERT INTO app.usuarios
          (email, username, password_hash, nombre, rol_id, activo, must_change_password)
        VALUES
          (
            NULLIF($1,'')::citext,
            CASE WHEN NULLIF($2,'') IS NULL THEN NULL ELSE app.normalize_username($2) END,
            crypt($3, gen_salt('bf')),
            $4,
            $5,
            TRUE,
            TRUE
          )
        RETURNING id
        `,
        [email, uname, passwordForDb, fullName, rolId]
      );

      const userId = ins.rows[0].id;
      let loginCode = null;

      // 3) Si es Alumno sin contraseña explícita -> emitimos código de 6 dígitos
      if (rol === "estudiante" && !hasPassword) {
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
      // 23505 = unique_violation
      if (e.code === "23505") {
        return res.status(409).json({ error: "Email o username ya existe" });
      }
      console.error("create-user error:", e);
      return res.status(500).json({ error: "Error de servidor" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("create-user outer error:", err);
    return res.status(500).json({ error: "Error de servidor" });
  }
});
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
        u.nombre AS nombre_completo,   -- en tu BD guardamos el nombre completo
        u.email,
        u.username,
        u.activo,
        r.nombre AS rol_db
      FROM app.usuarios u
      JOIN app.roles r ON r.id = u.rol_id
      ORDER BY u.created_at DESC
    `);

    // Adaptamos a tu shape de UI: { id, nombre, apellido, correo?, rol, estado, username? }
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
module.exports = router;
