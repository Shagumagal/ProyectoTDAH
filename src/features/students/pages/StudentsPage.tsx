// src/features/students/pages/StudentsPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Usuario } from "../../../lib/types";
import Modal from "../../../componentes/Modal";
import StudentForm from "../components/StudentForm";
import {
  getUsers,
  createUser,
  updateUser,
  setUserActive,
  type RoleDb,
} from "../../users/services/users.services";

const ROLE_ESTUDIANTE: RoleDb = "estudiante";

type DialogState = { mode: "create" | "edit"; user?: Usuario } | null;

export default function StudentsPage() {
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        const onlyStudents = (data || []).filter(
          (u) => (u.rol || "").toLowerCase() === "alumno"
        );
        if (!cancel) setAlumnos(onlyStudents);
      } catch (e: any) {
        if (!cancel) setError(e?.message || "Error cargando alumnos");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  async function refresh() {
    const data = await getUsers();
    setAlumnos((data || []).filter((u) => (u.rol || "").toLowerCase() === "alumno"));
  }

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return alumnos;
    return alumnos.filter((u) =>
      [u.nombre||"", u.apellido||"", u.correo||"", u.username||"", u.estado||""]
        .join(" ").toLowerCase().includes(term)
    );
  }, [alumnos, q]);

  async function handleSubmit(data: {
    id?: string;
    nombres: string;
    apellidos: string;
    email?: string | null;
    username?: string | null;
    password?: string;
    fecha_nacimiento: string;
    genero?: "masculino"|"femenino"|"no_binario"|"prefiero_no_decir"|null;
  }) {
    try {
      if (!data.id) {
        await createUser({
          nombres: data.nombres,
          apellidos: data.apellidos,
          rol: ROLE_ESTUDIANTE,
          email: data.email ?? undefined,
          username: data.username ?? undefined,
          password: data.password ?? undefined,
          fecha_nacimiento: data.fecha_nacimiento,
          genero: data.genero ?? undefined,
        });
      } else {
        await updateUser(data.id, {
          nombres: data.nombres,
          apellidos: data.apellidos,
          rol: ROLE_ESTUDIANTE,
          email: data.email ?? null,
          username: data.username ?? null,
          fecha_nacimiento: data.fecha_nacimiento ?? null,
          genero: (data.genero ?? null) as any,
        });
      }
      await refresh();
      setDialog(null);
    } catch (e: any) {
      alert(e?.message || "Error al guardar alumno");
    }
  }

  async function toggleEstado(id: string) {
    try {
      const u = alumnos.find((x) => x.id === id);
      if (!u) return;
      await setUserActive(id, u.estado !== "Activo");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "No se pudo cambiar el estado");
    }
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Alumnos</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Listado, registro y edición de alumnos.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, email, usuario…"
              className="rounded-xl px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
            <button
              onClick={() => setDialog({ mode: "create" })}
              className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-lg shadow-indigo-600/20"
            >
              Nuevo alumno
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-700/20 bg-slate-900/10 dark:bg-slate-800/40 p-4 text-slate-600 dark:text-slate-300">
          Cargando alumnos…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/30 text-rose-200 p-3">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
          {rows.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <p className="mb-3">No hay alumnos para mostrar.</p>
              <button
                onClick={() => setDialog({ mode: "create" })}
                className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Crear el primero
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 dark:text-slate-300">
                    <th className="py-2 pr-4">Nombre completo</th>
                    <th className="py-2 pr-4">Correo</th>
                    <th className="py-2 pr-4">Usuario</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-100">
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 pr-4">{u.nombre} {u.apellido}</td>
                      <td className="py-3 pr-4">{u.correo ?? <span className="text-slate-400">—</span>}</td>
                      <td className="py-3 pr-4">{u.username ?? <span className="text-slate-400">—</span>}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            u.estado === "Activo"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
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
          )}
        </div>
      )}

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? "Editar alumno" : "Nuevo alumno"}
      >
        {dialog && (
          <StudentForm
            mode={dialog.mode}
            initial={dialog.user as any}
            onCancel={() => setDialog(null)}
            onSubmit={async (form) => {
              await handleSubmit({
                ...form,
                id: dialog.user?.id,
              });
            }}
          />
        )}
      </Modal>
    </section>
  );
}
