// src/features/users/components/StudentForm.tsx
import React, { useEffect, useMemo, useState } from "react";

type Genero = "masculino" | "femenino" | "no_binario" | "prefiero_no_decir";

type Props = {
  initial?: {
    nombres?: string;
    apellidos?: string;
    correo?: string;
    username?: string;
    fecha_nacimiento?: string;     // ← opcional en edición
    genero?: Genero | null;        // ← opcional
  };
  mode: "create" | "edit";
  onSubmit: (data: {
    nombres: string;
    apellidos: string;
    email?: string | null;
    username?: string | null;
    password?: string;
    fecha_nacimiento: string;      // ← OBLIGATORIO para alumno
    genero?: Genero | null;
  }) => Promise<void>;
  onCancel: () => void;
};

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
  const min = new Date(1900, 0, 1);
  return dt <= cut && dt >= min;
}

export default function StudentForm({ initial, mode, onSubmit, onCancel }: Props) {
  const [nombres, setNombres] = useState(initial?.nombres ?? "");
  const [apellidos, setApellidos] = useState(initial?.apellidos ?? "");
  const [email, setEmail] = useState(initial?.correo ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [fechaNac, setFechaNac] = useState(initial?.fecha_nacimiento ?? "");
  const [genero, setGenero] = useState<Genero | "">((initial?.genero as any) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNombres(initial?.nombres ?? "");
    setApellidos(initial?.apellidos ?? "");
    setEmail(initial?.correo ?? "");
    setUsername(initial?.username ?? "");
    setFechaNac(initial?.fecha_nacimiento ?? "");
    setGenero(((initial?.genero as any) ?? "") as any);
  }, [initial]);

  const isCreate = mode === "create";

  const maxDOB = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    return fmtYYYYMMDD(d);
  }, []);
  const minDOB = "1900-01-01";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim() || null,
        username: username.trim() || null,
        ...(isCreate ? { password: password.trim() } : {}),
        fecha_nacimiento: (fechaNac || "").trim(),         // ← se envía al back
        genero: (genero || null) as Genero | null,
      };

      if (!payload.nombres || !payload.apellidos) throw new Error("Nombre y apellido son obligatorios.");
      if (!payload.email && !payload.username) throw new Error("Debe tener email o username.");
      if (!payload.fecha_nacimiento) throw new Error("La fecha de nacimiento es obligatoria.");
      if (!ageOk5(payload.fecha_nacimiento)) throw new Error("Debe tener al menos 5 años.");

      setLoading(true);
      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nombres</label>
          <input value={nombres} onChange={(e) => setNombres(e.target.value)}
                 className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"/>
        </div>
        <div>
          <label className="text-sm font-medium">Apellidos</label>
          <input value={apellidos} onChange={(e) => setApellidos(e.target.value)}
                 className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"/>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Fecha de nacimiento *</label>
          <input type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)}
                 min={minDOB} max={maxDOB}
                 className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"/>
          <p className="text-xs text-slate-500 mt-1">Debe tener al menos 5 años.</p>
        </div>
        <div>
          <label className="text-sm font-medium">Género (opcional)</label>
          <select value={genero} onChange={(e) => setGenero(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600">
            <option value="">— Selecciona (opcional) —</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="no_binario">No binario</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Email (opcional)</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)}
               className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
               placeholder="alumno@colegio.edu.bo"/>
      </div>

      <div>
        <label className="text-sm font-medium">Username (si no hay email)</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)}
               className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
               placeholder="alumno001"/>
        <p className="text-xs text-slate-500 mt-1">Si no hay email, el username es obligatorio (3–24, a-z, 0–9, _).</p>
      </div>

      {isCreate && (
        <div>
          <label className="text-sm font-medium">Contraseña (opcional)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 className="mt-1 w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                 placeholder="Dejar vacío para emitir código temporal"/>
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex items-center gap-3 justify-end">
        <button type="button" onClick={onCancel}
                className="rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-700">Cancelar</button>
        <button disabled={loading}
                className="rounded-xl px-4 py-2.5 bg-indigo-600 text-white font-semibold disabled:opacity-60">
          {loading ? "Guardando…" : (isCreate ? "Registrar alumno" : "Guardar cambios")}
        </button>
      </div>
    </form>
  );
}
