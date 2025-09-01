import { useEffect, useState } from "react";
import type { Rol, Usuario } from "../../../lib/types";

type FormCreate = Omit<Usuario, "id" | "estado"> & { password?: string };
type FormEdit   = Omit<Usuario, "estado"> & { password?: string };
export type UserFormCreate = FormCreate;
export type UserFormEdit   = FormEdit;

export default function UserForm({
  mode,
  initialUser,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialUser?: Usuario;
  onSubmit: (data: UserFormCreate | UserFormEdit) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre]     = useState(initialUser?.nombre ?? "");
  const [apellido, setApellido] = useState(initialUser?.apellido ?? "");
  const [rol, setRol]           = useState<Rol>(initialUser?.rol ?? "Alumno");
  const [correo, setCorreo]     = useState(initialUser?.correo ?? "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errores, setErrores]   = useState<Record<string, string>>({});

  // si cambia el usuario a editar, precargar
  useEffect(() => {
    if (!initialUser) return;
    setNombre(initialUser.nombre ?? "");
    setApellido(initialUser.apellido ?? "");
    setRol(initialUser.rol ?? "Alumno");
    setCorreo(initialUser.correo ?? "");
    setPassword("");
    setErrores({});
  }, [initialUser]);

  function validar() {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Requerido";
    if (!apellido.trim()) e.apellido = "Requerido";

    if (correo) {
      const ok = /.+@.+\..+/.test(correo);
      if (!ok) e.correo = "Correo inválido";
    } else if (rol !== "Alumno") {
      e.correo = "Obligatorio para este rol";
    }

    if (password && password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    const base = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim() || undefined,
      rol,
      password: password || undefined,
    };

    if (mode === "edit" && initialUser) {
      onSubmit({ id: initialUser.id, ...base });
    } else {
      onSubmit(base);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre(s)</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Juan Carlos"
            className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errores.nombre && <p className="mt-1 text-xs text-rose-500">{errores.nombre}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Apellido(s)</label>
          <input
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
            placeholder="Pérez López"
            className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errores.apellido && <p className="mt-1 text-xs text-rose-500">{errores.apellido}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Rol</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option>Alumno</option><option>Docente</option><option>Psicólogo</option><option>Administrador</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Correo</label>
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            spellCheck={false}
            className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            Obligatorio para Docente/Psicólogo/Administrador. Opcional para Alumno.
          </p>
          {errores.correo && <p className="mt-1 text-xs text-rose-500">{errores.correo}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Contraseña (opcional)</label>
          <button type="button" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400" onClick={() => setShowPass(v => !v)}>
            {showPass ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mín. 6 caracteres"
            className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 pr-12 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" /><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /></svg>
          </span>
        </div>
        {errores.password && <p className="mt-1 text-xs text-rose-500">{errores.password}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">Cancelar</button>
        <button type="submit" className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-lg shadow-indigo-600/20">Guardar</button>
      </div>
    </form>
  );
}
