import React, { useEffect, useMemo, useState } from "react";
import type { Usuario } from "../../../lib/types";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// Tipos del form
export type UserFormOutput = {
  id?: string;
  nombre: string;
  apellido: string;
  correo?: string;
  rol: "Alumno" | "Docente" | "Psicólogo" | "Admin";
  username?: string;
  password?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  genero?: "masculino" | "femenino" | "no_binario" | "prefiero_no_decir" | null;
};

export type UserFormMode = "create" | "edit";

type Props = {
  mode: UserFormMode;
  initialUser?: Usuario | null;
  onCancel: () => void;
  onSubmit: (data: UserFormOutput) => void | Promise<void>;
  className?: string;
};

// Helpers
const normalizeUsername = (s = "") => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
const emailOk = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const usernameOk = (v: string) => !v || /^[a-z0-9_]{3,24}$/.test(v);

function isAtLeast5Years(d: Dayjs | null) {
  if (!d || !d.isValid()) return false;
  const cut = dayjs().subtract(5, "year").endOf("day");
  const min = dayjs("1900-01-01");
  return d.isBefore(cut) && d.isAfter(min.subtract(1, "day"));
}

const fmt = (d: Dayjs | null) => (d && d.isValid() ? d.format("YYYY-MM-DD") : "");

export default function UserForm({
  mode,
  initialUser,
  onCancel,
  onSubmit,
  className = "",
}: Props) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState<UserFormOutput["rol"]>("Alumno");
  const [correo, setCorreo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [fechaNac, setFechaNac] = useState<Dayjs | null>(null);
  const [genero, setGenero] = useState<UserFormOutput["genero"]>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlumno = useMemo(() => rol === "Alumno", [rol]);

  // límites del picker
  const maxDOB = dayjs().subtract(5, "year");
  const minDOB = dayjs("1900-01-01");

  // precarga cuando editas
  useEffect(() => {
    if (mode === "edit" && initialUser) {
      setNombre(initialUser.nombre ?? "");
      setApellido(initialUser.apellido ?? "");
      setRol((initialUser.rol as any) || "Alumno");
      setCorreo(initialUser.correo ?? "");
      setUsername((initialUser as any).username ?? "");
      setPassword("");

      const d = initialUser.fecha_nacimiento ? dayjs(initialUser.fecha_nacimiento) : null;
      setFechaNac(d && d.isValid() ? d : null);

      setGenero((initialUser as any).genero ?? null);
    } else {
      setNombre("");
      setApellido("");
      setRol("Alumno");
      setCorreo("");
      setUsername("");
      setPassword("");
      setFechaNac(null);
      setGenero(null);
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
    if (isAlumno && !e && !u) return "Para Alumno sin email, “Usuario” es obligatorio.";

    if (isAlumno && !fechaNac) return "Fecha de nacimiento es obligatoria para Alumno.";
    if (fechaNac && !isAtLeast5Years(fechaNac)) return "Debe tener al menos 5 años.";

    if (mode === "create" && password && password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    return null;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const payload: UserFormOutput = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim() || undefined,
      rol,
      username: normalizeUsername(username) || undefined,
      password: password || undefined,
      fecha_nacimiento: fmt(fechaNac) || undefined,
      genero: genero ?? undefined,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (e: any) {
      setError(e?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Nombre(s)</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan Carlos"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Apellido(s)</label>
          <input
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Pérez López"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Rol</label>
          <select
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
          <label className="block text-sm font-semibold text-slate-300">Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* DatePicker MUI */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            Fecha de nacimiento {rol === "Alumno" && <span className="text-rose-400">*</span>}
          </label>
          <div className="mt-1">
           <DatePicker
format="DD/MM/YYYY"
value={fechaNac}
onChange={(d: Dayjs | null) => setFechaNac(d)}
minDate={dayjs("1900-01-01")}
maxDate={dayjs().subtract(5, "year")}
slotProps={{
textField: {
variant: "outlined",
fullWidth: true,
placeholder: "dd/mm/aaaa",
sx: {
// Root e input en blanco (fuerza prioridad)
"& .MuiInputBase-root, & .MuiOutlinedInput-root": {
color: "#fff !important",
backgroundColor: "rgba(15,23,42,.35)",
borderRadius: "12px",
},
"& .MuiInputBase-input, & .MuiOutlinedInput-input": {
color: "#fff !important",
WebkitTextFillColor: "#fff",
},
"& .MuiInputBase-input::placeholder, & input::placeholder": {
color: "rgba(255,255,255,.7) !important",
opacity: 1,
},
// Bordes e icono
"& fieldset": { borderColor: "rgba(255,255,255,.6)" },
"&:hover fieldset": { borderColor: "#fff" },
"& .Mui-focused fieldset, & .MuiOutlinedInput-root.Mui-focused fieldset": {
borderColor: "#fff",
},
"& .MuiSvgIcon-root": { color: "#fff" },
// Autofill
"& input:-webkit-autofill": {
WebkitTextFillColor: "#fff",
WebkitBoxShadow: "0 0 0 1000px rgba(15,23,42,.35) inset",
},
},
// Inline style directo al input nativo por si algo más pisa
inputProps: { style: { color: "#fff", WebkitTextFillColor: "#fff" } },
InputLabelProps: {
sx: { color: "rgba(255,255,255,.85)", "&.Mui-focused": { color: "#fff" } },
},
},
popper: {
sx: {
"& .MuiPaper-root": { backgroundColor: "#0f172a", color: "#fff" },
"& .MuiPickersDay-root": { color: "#fff" },
"& .MuiPickersDay-root.Mui-selected": { backgroundColor: "#6366f1", color: "#fff" },
"& .MuiPickersCalendarHeader-label": { color: "#fff" },
"& .MuiIconButton-root": { color: "#fff" },
},
},
}}
/>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Debe tener al menos 5 años. {rol !== "Alumno" ? "(opcional)" : ""}
          </p>
        </div>

        {/* Género (opcional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Género</label>
          <select
            value={genero ?? ""}
            onChange={(e) => setGenero((e.target.value || null) as UserFormOutput["genero"])}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">— Selecciona (opcional) —</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="no_binario">No binario</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </div>

        {/* Username */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-300">
            Usuario <span className="text-slate-400">(si no tiene email)</span>
          </label>
          <input
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
              <label className="block text-sm font-semibold text-slate-300">
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
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoComplete="new-password"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-600/40 px-5 py-2.5 text-slate-200 hover:bg-slate-600/60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}