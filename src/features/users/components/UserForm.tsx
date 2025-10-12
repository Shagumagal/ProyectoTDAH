// src/features/users/components/UserForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Usuario } from "../../../lib/types";

// Lo que el formulario devuelve al padre (UsersPage)
export type UserFormOutput = {
  id?: string;
  nombre: string;
  apellido: string;
  correo?: string;
  rol: "Alumno" | "Docente" | "Psicólogo" | "Admin";
  username?: string;     // solo si quieres manejar alumno sin email
  password?: string;     // opcional (solo creación)
  fecha_nacimiento?: string; // YYYY-MM-DD
};

export type UserFormMode = "create" | "edit";

type Props = {
  mode: UserFormMode;
  initialUser?: Usuario | null;
  onCancel: () => void;
  onSubmit: (data: UserFormOutput) => void | Promise<void>;
  className?: string;
};

const normalizeUsername = (s = "") =>
  s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

const emailOk = (v: string) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const usernameOk = (v: string) =>
  !v || /^[a-z0-9_]{3,24}$/.test(v);

// Helpers fecha (edad mínima 5 años)
function fmtYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function ageOk5(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const cut = new Date();
  cut.setFullYear(cut.getFullYear() - 5);
  // rango razonable
  const min = new Date(1900, 0, 1);
  return dt <= cut && dt >= min;
}

export default function UserForm({
  mode,
  initialUser,
  onCancel,
  onSubmit,
  className = "",
}: Props) {
  // form state
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState<UserFormOutput["rol"]>("Alumno");
  const [correo, setCorreo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // solo creación
  const [showPass, setShowPass] = useState(false);
  const [fechaNac, setFechaNac] = useState(""); // YYYY-MM-DD

  // ui
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlumno = useMemo(() => rol === "Alumno", [rol]);

  // límites del date picker
  const maxDOB = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    return fmtYYYYMMDD(d);
  }, []);
  const minDOB = "1900-01-01";

  // precargar datos si estamos editando
  useEffect(() => {
    if (mode === "edit" && initialUser) {
      setNombre(initialUser.nombre ?? "");
      setApellido(initialUser.apellido ?? "");
      // Normalizamos roles que vengan en otros labels
      const r = (initialUser.rol as any) as UserFormOutput["rol"];
      setRol(r === "Docente" ? "Docente" : r); // por si en tus datos aparece "Profesor"
      setCorreo(initialUser.correo ?? "");
      setUsername((initialUser as any).username ?? "");
      setPassword("");
      setFechaNac(initialUser.fecha_nacimiento || "");
    } else {
      setNombre("");
      setApellido("");
      setRol("Alumno");
      setCorreo("");
      setUsername("");
      setPassword("");
      setFechaNac("");
    }
    setError(null);
  }, [mode, initialUser]);

  function validate(): string | null {
    const e = correo.trim();
    const u = normalizeUsername(username);

    if (!nombre.trim() && !apellido.trim()) return "Nombre(s) o Apellido(s) requerido(s).";
    if (!emailOk(e)) return "Correo inválido.";
    if (!usernameOk(u)) return "Usuario inválido. Use 3–24 [a-z0-9_].";

    if (rol !== "Alumno" && !e) return "Email es obligatorio para este rol.";
    if (isAlumno && !e && !u) return "Para Alumno sin email, ‘Usuario’ es obligatorio.";

    // Fecha de nacimiento
    if (isAlumno && !fechaNac) return "Fecha de nacimiento es obligatoria para Alumno.";
    if (fechaNac && !ageOk5(fechaNac)) return "La fecha debe indicar al menos 5 años de edad.";

    if (mode === "create" && password && password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    return null;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    const msg = validate();
    if (msg) return setError(msg);

    const out: UserFormOutput = {
      ...(mode === "edit" && initialUser ? { id: initialUser.id } : {}),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol,
      correo: correo.trim() || undefined,
      username: normalizeUsername(username) || undefined,
      ...(mode === "create" && password ? { password } : {}),
      fecha_nacimiento: fechaNac || undefined,
    };

    try {
      setSaving(true);
      await onSubmit(out);
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 ${className}`} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-slate-300">Nombre(s)</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan Carlos"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoComplete="given-name"
          />
        </div>

        {/* Apellido */}
        <div>
          <label htmlFor="apellido" className="block text-sm font-semibold text-slate-300">Apellido(s)</label>
          <input
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Pérez López"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoComplete="family-name"
          />
        </div>

        {/* Rol */}
        <div>
          <label htmlFor="rol" className="block text-sm font-semibold text-slate-300">Rol</label>
          <select
            id="rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as UserFormOutput["rol"])}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option>Alumno</option>
            <option>Docente</option>
            <option>Psicólogo</option>
            <option>Admin</option>
          </select>
        </div>

        {/* Correo */}
        <div>
          <label htmlFor="correo" className="block text-sm font-semibold text-slate-300">Correo</label>
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoComplete="email"
            inputMode="email"
          />
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label htmlFor="dob" className="block text-sm font-semibold text-slate-300">
            Fecha de nacimiento {rol === "Alumno" && <span className="text-rose-400">*</span>}
          </label>
          <input
            id="dob"
            type="date"
            value={fechaNac}
            onChange={(e) => setFechaNac(e.target.value)}
            min={minDOB}
            max={maxDOB}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="mt-1 text-xs text-slate-400">
            Debe tener al menos 5 años. {rol !== "Alumno" ? "(opcional)" : ""}
          </p>
        </div>

        {/* Username */}
        <div className="md:col-span-2">
          <label htmlFor="username" className="block text-sm font-semibold text-slate-300">
            Usuario <span className="text-slate-400">(si no tiene email)</span>
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(normalizeUsername(e.target.value))}
            placeholder="alumno_123 (a-z, 0-9, _)"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            pattern="^[a-z0-9_]{3,24}$"
            title="3–24 caracteres: a–z, 0–9 y guión bajo"
            autoComplete="username"
          />
          <p className="mt-1 text-xs text-slate-400">
            Debe cumplir: 3–24, a–z, 0–9 y guión bajo.
          </p>
        </div>

        {/* Password (solo creación) */}
        {mode === "create" && (
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                Contraseña <span className="text-slate-400">(opcional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
                aria-pressed={showPass}
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rose-500" role="alert">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold"
          aria-busy={saving}
        >
          {saving ? "Guardando…" : mode === "create" ? "Guardar" : "Actualizar"}
        </button>
      </div>
    </form>
  );
}
