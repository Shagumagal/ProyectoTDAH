// src/features/students/components/StudentForm.tsx
import React, { useEffect, useMemo, useState } from "react";

type Genero = "masculino" | "femenino" | "no_binario" | "prefiero_no_decir";

type Props = {
  initial?: {
    // Aceptamos ambas variantes para compatibilidad: nombre/nombres, apellido/apellidos
    id?: string;
    nombre?: string;
    nombres?: string;
    apellido?: string;
    apellidos?: string;
    correo?: string;     // también puede venir como email
    email?: string;
    username?: string;
    fecha_nacimiento?: string | null; // "YYYY-MM-DD" o ISO
    genero?: Genero | null;
  } | null;
  mode: "create" | "edit";
  onSubmit: (data: {
    id?: string;
    nombres: string;
    apellidos: string;
    email?: string | null;
    username?: string | null;
    password?: string;
    fecha_nacimiento: string;  // YYYY-MM-DD
    genero?: Genero | null;
  }) => Promise<void> | void;
  onCancel: () => void;
};

// -------- Helpers ----------
function fmtYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normaliza cualquier string de fecha a YYYY-MM-DD para <input type="date"> */
function toDateInputValue(s?: string | null): string {
  if (!s) return "";
  // Si viene ISO "2020-11-07T00:00:00.000Z" → recorta a 10
  if (s.length > 10 && s.includes("T")) return s.slice(0, 10);
  // Si ya es "YYYY-MM-DD" lo devolvemos igual
  return s;
}

function ageOk5(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const dob = new Date(Date.UTC(y, m - 1, d));
  const min = new Date();
  min.setUTCFullYear(min.getUTCFullYear() - 5);
  // debe ser < hoy-5años y razonable
  return dob.getTime() <= min.getTime() && dob.getUTCFullYear() >= 1900;
}

// -------- Componente ----------
export default function StudentForm({ initial, mode, onSubmit, onCancel }: Props) {
  const isCreate = mode === "create";

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fechaNac, setFechaNac] = useState<string>("");
  const [genero, setGenero] = useState<Genero | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxDOB = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    return fmtYYYYMMDD(d);
  }, []);

  const minDOB = "1900-01-01";

  // Cargar datos iniciales (edición)
  useEffect(() => {
    setNombres((initial?.nombres ?? initial?.nombre ?? "").trim());
    setApellidos((initial?.apellidos ?? initial?.apellido ?? "").trim());
    setEmail((initial?.correo ?? initial?.email ?? "").trim());
    setUsername((initial?.username ?? "").trim());
    setFechaNac(toDateInputValue(initial?.fecha_nacimiento ?? ""));
    setGenero((initial?.genero ?? null) as Genero | null);
  }, [initial]);

  function validate() {
    if (!nombres.trim() || !apellidos.trim()) return "Nombre y apellido son obligatorios.";
    if (!email.trim() && !username.trim()) return "Debe tener email o username.";
    if (!fechaNac) return "La fecha de nacimiento es obligatoria.";
    if (!ageOk5(fechaNac)) return "Debe tener al menos 5 años.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        id: initial?.id, // ← MUY IMPORTANTE PARA EDITAR
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim() || null,
        username: username.trim() || null,
        ...(isCreate ? { password: password.trim() } : {}),
        fecha_nacimiento: fechaNac, // ya viene YYYY-MM-DD
        genero: (genero || null) as Genero | null,
      });
    } catch (err: any) {
      setError(err?.message || "Error al guardar alumno.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium dark:text-white">Nombre(s)</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div>
          <label className="text-sm font-medium dark:text-white">Apellido(s)</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            autoComplete="family-name"
          />
        </div>

        <div>
          <label className="text-sm font-medium dark:text-white">Correo</label>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium dark:text-white ">Usuario (si no tiene email)</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alumno_123"
            autoComplete="username"
            pattern="^[a-z0-9_]{3,24}$"
            title="3–24 caracteres: a–z, 0–9 y guión bajo"
          />
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label className="text-sm font-medium dark:text-white" >Fecha de nacimiento *</label>
          <input
            type="date"
            value={fechaNac}
            onChange={(e) => setFechaNac(e.target.value)}
            min={minDOB}
            max={maxDOB}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
          />
          <p className="text-xs text-slate-500 mt-1">Debe tener al menos 5 años.</p>
        </div>

        {/* Género */}
        <div>
          <label className="text-sm font-medium">Género (opcional)</label>
          <select
            value={genero ?? ""}
            onChange={(e) => setGenero((e.target.value || "") as Genero | null)}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
          >
            <option value="">— Selecciona (opcional) —</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="no_binario">No binario</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </div>

        {/* Password solo en creación */}
        {isCreate && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">
              Contraseña <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-600 bg-slate-800/60 px-5 py-2.5 font-semibold text-slate-200 hover:bg-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
