import React, { useEffect, useState } from "react";

type Props = {
  initial?: {
    nombres?: string;
    apellidos?: string;
    correo?: string;
    username?: string;
  };
  mode: "create" | "edit";
  onSubmit: (data: { nombres: string; apellidos: string; email?: string | null; username?: string | null; password?: string }) => Promise<void>;
  onCancel: () => void;
};

export default function StudentForm({ initial, mode, onSubmit, onCancel }: Props) {
  const [nombres, setNombres] = useState(initial?.nombres ?? "");
  const [apellidos, setApellidos] = useState(initial?.apellidos ?? "");
  const [email, setEmail] = useState(initial?.correo ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(""); // opcional en creación
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNombres(initial?.nombres ?? "");
    setApellidos(initial?.apellidos ?? "");
    setEmail(initial?.correo ?? "");
    setUsername(initial?.username ?? "");
  }, [initial]);

  const isCreate = mode === "create";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim() || null,
        username: username.trim() || null,
        ...(isCreate ? { password: password.trim() } : {}),
      };
      if (!payload.nombres || !payload.apellidos) throw new Error("Nombre y apellido son obligatorios.");
      if (!payload.email && !payload.username) {
        throw new Error("Debe tener email o username (para alumnos sin email).");
      }
      await onSubmit(payload as any);
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
        <p className="text-xs text-slate-500 mt-1">Si no hay email, el username es obligatorio (3–24, a-z, 0-9, _).</p>
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
