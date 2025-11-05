// src/features/auth/ProfilePage.tsx
import { useEffect, useState } from "react";
import { getMe, updateMe, changeMyPassword } from "./services/profile.services";
import ConfirmDialog from "../../componentes/ConfirmDialog";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  // ---- Datos de perfil ----
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // Copia inicial (para comparar si hubo cambios)
  const [initial, setInitial] = useState({ nombres: "", apellidos: "", email: "", username: "" });

  // Mensajes (separados por sección)
  const [okMsgProfile, setOkMsgProfile] = useState<string | null>(null);
  const [errProfile, setErrProfile] = useState<string | null>(null);

  // ---- Cambio de contraseña ----
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [okMsgPwd, setOkMsgPwd] = useState<string | null>(null);
  const [errPwd, setErrPwd] = useState<string | null>(null);

  // ---- Diálogos de confirmación ----
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [confirmPassOpen, setConfirmPassOpen] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        const base = {
          nombres: me.nombres || "",
          apellidos: me.apellidos || "",
          email: me.email || "",
          username: me.username || "",
        };
        setNombres(base.nombres);
        setApellidos(base.apellidos);
        setEmail(base.email);
        setUsername(base.username);
        setInitial(base);
      } catch (e: any) {
        setErrProfile(e?.message || "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirtyProfile =
    nombres !== initial.nombres ||
    apellidos !== initial.apellidos ||
    email !== initial.email ||
    username !== initial.username;

  // ======= Guardar perfil (con confirmación) =======
  function requestSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErrProfile(null);
    if (!dirtyProfile) {
      setOkMsgProfile("No hay cambios para guardar");
      setTimeout(() => setOkMsgProfile(null), 2000);
      return;
    }
    setConfirmSaveOpen(true);
  }

  async function confirmSaveProfile() {
    try {
      setSavingProfile(true);
      await updateMe({ nombres, apellidos, email: email || null, username: username || null });
      setOkMsgProfile("Perfil actualizado");
      setInitial({ nombres, apellidos, email, username });
      setConfirmSaveOpen(false);
      setTimeout(() => setOkMsgProfile(null), 2500);
    } catch (e: any) {
      setErrProfile(e?.message || "No se pudo actualizar");
    } finally {
      setSavingProfile(false);
    }
  }

  // ======= Cambiar contraseña (con confirmación) =======
  function requestChangePwd(e: React.FormEvent) {
    e.preventDefault();
    setErrPwd(null);

    if (!curPwd || !newPwd || !newPwd2) {
      setErrPwd("Completa todos los campos.");
      return;
    }
    if (newPwd.length < 6) {
      setErrPwd("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPwd !== newPwd2) {
      setErrPwd("Las contraseñas no coinciden");
      return;
    }
    setConfirmPassOpen(true);
  }

  async function confirmChangePwd() {
    try {
      setChangingPwd(true);
      await changeMyPassword(curPwd, newPwd);
      setOkMsgPwd("Contraseña actualizada");
      setCurPwd(""); setNewPwd(""); setNewPwd2("");
      setConfirmPassOpen(false);
      setTimeout(() => setOkMsgPwd(null), 2500);
    } catch (e: any) {
      setErrPwd(e?.message || "No se pudo cambiar la contraseña");
    } finally {
      setChangingPwd(false);
    }
  }

  if (loading) return <div className="p-6 text-slate-600 dark:text-slate-300">Cargando perfil…</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* -------- Mis datos -------- */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Mis datos</h2>

        <form onSubmit={requestSaveProfile} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Nombres</span>
            <input
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Apellidos</span>
            <input
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Correo</span>
            <input
              type="email"
              placeholder="opcional"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Usuario</span>
            <input
              placeholder="opcional"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          {okMsgProfile && <p className="text-sm text-emerald-600">{okMsgProfile}</p>}
          {errProfile && <p className="text-sm text-rose-600">{errProfile}</p>}

          <div className="mt-1">
            <button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 disabled:opacity-60"
              disabled={!dirtyProfile}
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      {/* -------- Cambiar contraseña -------- */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Cambiar contraseña</h2>

        <form onSubmit={requestChangePwd} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200">Contraseña actual</span>
            <input
              type="password"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200">Nueva contraseña</span>
            <input
              type="password"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200">Confirmar nueva contraseña</span>
            <input
              type="password"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
            />
          </label>

          {okMsgPwd && <p className="text-sm text-emerald-600">{okMsgPwd}</p>}
          {errPwd && <p className="text-sm text-rose-600">{errPwd}</p>}

          <div className="mt-1">
            <button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2">
              Actualizar contraseña
            </button>
          </div>
        </form>
      </section>

      {/* ---- Diálogos reutilizables ---- */}
      <ConfirmDialog
        open={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={confirmSaveProfile}
        loading={savingProfile}
        title="Guardar cambios"
        description="¿Deseas guardar los cambios de tu perfil?"
        confirmText="Guardar"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        open={confirmPassOpen}
        onClose={() => setConfirmPassOpen(false)}
        onConfirm={confirmChangePwd}
        loading={changingPwd}
        title="Actualizar contraseña"
        description="Vas a cambiar tu contraseña. Asegúrate de recordarla."
        confirmText="Actualizar"
        cancelText="Cancelar"
        intent="danger"
      />
    </div>
  );
}
