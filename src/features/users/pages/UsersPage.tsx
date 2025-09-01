import { useState } from "react";
import type { Usuario } from "../../../lib/types";
import Modal from "../../../componentes/Modal";
import UserForm from "../components/UserForm";
import type { UserFormCreate, UserFormEdit } from "../components/UserForm";

type DialogState = { mode: "create" | "edit"; user?: Usuario } | null;
type FormOutput = UserFormCreate | UserFormEdit;

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: "1", nombre: "Ana",   apellido: "García", correo: "ana@correo.com",  rol: "Docente",   estado: "Activo" },
    { id: "2", nombre: "Luis",  apellido: "Pérez",  correo: "luis@correo.com", rol: "Psicólogo", estado: "Activo" },
    { id: "3", nombre: "Marta", apellido: "Loayza", rol: "Alumno",             estado: "Activo" },
  ]);
  const [dialog, setDialog] = useState<DialogState>(null);

  function handleSubmit(data: FormOutput) {
    if ("id" in data) {
      // EDITAR
      setUsuarios(prev =>
        prev.map(u =>
          u.id === data.id ? { ...u, nombre: data.nombre, apellido: data.apellido, correo: data.correo, rol: data.rol } : u
        )
      );
    } else {
      // CREAR
      const nuevo: Usuario = { id: String(Date.now()), estado: "Activo", ...data };
      setUsuarios(prev => [nuevo, ...prev]);
    }
    setDialog(null);
  }

  function toggleEstado(id: string) {
    setUsuarios(prev =>
      prev.map(u => (u.id === id ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" } : u))
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Usuarios</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Gestiona alumnos, docentes y psicólogos.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDialog({ mode: "create" })}
              className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-lg shadow-indigo-600/20"
            >
              Nuevo usuario
            </button>
            <button className="rounded-xl px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
              Importar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Correo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 pr-4">{u.nombre} {u.apellido}</td>
                  <td className="py-3 pr-4">{u.rol}</td>
                  <td className="py-3 pr-4">{u.correo ?? <span className="text-slate-400">—</span>}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.estado === "Activo"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg px-3 py-1 bg-slate-100 dark:bg-slate-800"
                        onClick={() => setDialog({ mode: "edit", user: u })}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleEstado(u.id)}
                        className={`rounded-lg px-3 py-1 ${
                          u.estado === "Activo"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}
                      >
                        {u.estado === "Activo" ? "Inactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? "Editar usuario" : "Nuevo usuario"}
      >
        {dialog && (
          <UserForm
            mode={dialog.mode}
            initialUser={dialog.user}
            onCancel={() => setDialog(null)}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>
    </section>
  );
}
