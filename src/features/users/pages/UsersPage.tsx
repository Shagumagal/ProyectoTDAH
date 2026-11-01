// src/features/users/pages/UsersPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Usuario, RolUI } from "../../../lib/types";
import Modal from "../../../componentes/Modal";
import UserForm, { type UserFormOutput } from "../components/UserForm";
import SearchInput from "../../../componentes/SearchInput";
import ConfirmDialog from "../../../componentes/ConfirmDialog";
import CodeModal from "../../students/components/CodeModal";
import {
  getUsers,
  createUser,
  updateUser,
  setUserActive,
  type RoleDb,
} from "../services/users.services";
import { useNotification } from "../../../context/NotificationContext";

type DialogState = { mode: "create" | "edit"; user?: Usuario } | null;

const ROL_DB_MAP: Record<RolUI, RoleDb> = {
  Alumno: "estudiante",
  Docente: "profesor",
  Psicólogo: "psicologo",
  Admin: "admin",
};

export default function UsersPage() {
  const { showNotification } = useNotification();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ userId: string; isActive: boolean } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [codeData, setCodeData] = useState<{ code: string; username: string; expiresInMinutes: number } | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        if (!cancel) setUsuarios(data);
      } catch (e: unknown) {
        console.error(e);
        if (!cancel) setError(e instanceof Error ? e.message : "Error cargando usuarios");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  async function refresh() {
    const data = await getUsers();
    setUsuarios(data);
  }

  // Filtrado local por búsqueda
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((u) => {
      const text = [
        u.nombre ?? "",
        u.apellido ?? "",
        u.correo ?? "",
        u.username ?? "",
        u.rol ?? "",
        u.estado ?? "",
      ].join(" ").toLowerCase();
      return text.includes(term);
    });
  }, [usuarios, q]);

  async function handleSubmit(data: UserFormOutput) {
    try {
      if (!data.id) {
        const created = await createUser({
          nombres: data.nombre,
          apellidos: data.apellido,
          rol: ROL_DB_MAP[data.rol],
          email: data.correo,
          username: data.username,
          password: data.password ?? undefined,
          fecha_nacimiento: data.fecha_nacimiento ?? undefined,
          genero: data.genero ?? undefined,
        });
        await refresh();
        setDialog(null);
        showNotification("Usuario creado con éxito", "success");
        if (created.login_code) {
          setCodeData({
            code: created.login_code,
            username: data.username || "",
            expiresInMinutes: 15,
          });
        }
        return;
      }

      await updateUser(data.id, {
        nombres: data.nombre,
        apellidos: data.apellido,
        rol: ROL_DB_MAP[data.rol],
        email: data.correo ?? null,
        username: data.username ?? null,
        fecha_nacimiento: data.fecha_nacimiento ?? null,
        genero: data.genero ?? null,
      });

      await refresh();
      setDialog(null);
      showNotification("Usuario actualizado con éxito", "success");
    } catch (e: unknown) {
      showNotification(e instanceof Error ? e.message : "Error al guardar usuario", "error");
    }
  }

  function toggleEstado(id: string) {
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;
    const isActive = u.estado === "Activo";
    setConfirmDialog({ userId: id, isActive });
  }

  async function handleConfirmToggle() {
    if (!confirmDialog) return;
    const { userId, isActive } = confirmDialog;
    
    try {
      setConfirmLoading(true);
      await setUserActive(userId, !isActive);
      await refresh();
      showNotification(
        `Usuario ${!isActive ? "activado" : "inactivado"} con éxito`,
        !isActive ? "success" : "warning"
      );
      setConfirmDialog(null);
    } catch (e: unknown) {
      showNotification(e instanceof Error ? e.message : "No se pudo cambiar el estado", "error");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Usuarios</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Gestiona alumnos, docentes y psicólogos.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={q}
              onChange={(v) => setQ(v)}
              className="w-full sm:w-64 lg:w-80"
              placeholder="Buscar..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setDialog({ mode: "create" })}
                className="flex-1 sm:flex-none whitespace-nowrap rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-lg shadow-indigo-600/20"
              >
                Nuevo usuario
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-700/20 bg-slate-900/10 dark:bg-slate-800/40 p-4 text-slate-600 dark:text-slate-300">
          Cargando usuarios…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/30 text-rose-200 p-3">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
          {usuarios.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <p className="mb-3">No hay usuarios para mostrar.</p>
              <button
                onClick={() => setDialog({ mode: "create" })}
                className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Crear el primero
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Sin resultados para “{q}”.{" "}
              <button className="underline" onClick={() => setQ("")}>Limpiar</button>
            </div>
          ) : (
            <>
              {/* Vista Móvil: Tarjetas */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {rows.map((u) => (
                  <div key={u.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.nombre} {u.apellido}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{u.rol}</div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.estado === "Activo"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                      >
                        {u.estado}
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-300 break-all">
                      {u.correo ? (
                        <div className="flex items-center gap-2">
                          <span>📧</span>
                          <span>{u.correo}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>📧</span>
                          <span>Sin correo</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                      <button
                        className="flex-1 rounded-lg px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium"
                        onClick={() => setDialog({ mode: "edit", user: u })}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleEstado(u.id)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${u.estado === "Activo"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          }`}
                      >
                        {u.estado === "Activo" ? "Inactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista Escritorio: Tabla */}
              <div className="hidden md:block overflow-x-auto">
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
                    {rows.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3 pr-4">{u.nombre} {u.apellido}</td>
                        <td className="py-3 pr-4">{u.rol}</td>
                        <td className="py-3 pr-4">{u.correo ?? <span className="text-slate-400">—</span>}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.estado === "Activo"
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
                              className="rounded-lg px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => setDialog({ mode: "edit", user: u })}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => toggleEstado(u.id)}
                              className={`rounded-lg px-3 py-1 transition-colors ${u.estado === "Activo"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
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
            </>
          )}
        </div>
      )}

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

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.isActive ? "Inactivar usuario" : "Activar usuario"}
        description={confirmDialog?.isActive 
          ? "¿Está seguro que desea inactivar a este usuario? El usuario no podrá acceder al sistema."
          : "¿Está seguro que desea activar a este usuario? El usuario podrá acceder al sistema."}
        confirmText={confirmDialog?.isActive ? "Inactivar" : "Activar"}
        cancelText="Cancelar"
        intent={confirmDialog?.isActive ? "danger" : "success"}
        loading={confirmLoading}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirmToggle}
      />

      <CodeModal
        open={!!codeData}
        onClose={() => setCodeData(null)}
        code={codeData?.code || ""}
        username={codeData?.username || ""}
        expiresInMinutes={codeData?.expiresInMinutes || 15}
      />
    </section>
  );
}
