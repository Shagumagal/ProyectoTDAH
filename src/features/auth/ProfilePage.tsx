// src/features/auth/ProfilePage.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { getMe, updateMe, changeMyPassword } from "./services/profile.services";

import { useNotification } from "../../context/NotificationContext";
import WhiteDatePicker from "../../componentes/WhiteDatePicker";
import ConfirmDialog from "../../componentes/ConfirmDialog";

type Gender = "masculino" | "femenino" | null;

const GENDER_OPTIONS: Array<{ value: Exclude<Gender, null>; label: string }> = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
];

export default function ProfilePage() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);

  // ---- Datos de perfil ----
  const [mustChangePwd, setMustChangePwd] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // Nuevos: fecha de nacimiento y género
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [genero, setGenero] = useState<Gender>(null);

  // Copia inicial (para detectar cambios)
  const [initial, setInitial] = useState({
    nombres: "", apellidos: "", email: "", username: "",
    fecha_nacimiento: null as string | null, // "YYYY-MM-DD" o null
    genero: null as Gender,
  });

  // Mensajes perfil (REMOVED)

  // ---- Cambio de contraseña ----
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");

  // ---- Diálogos de confirmación ----
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [confirmPassOpen, setConfirmPassOpen] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // Restricción: mínimo 5 años
  const maxDob = useMemo(() => dayjs().subtract(5, "year"), []);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        // Parseo seguro de fecha
        const d = me.fecha_nacimiento ? dayjs(me.fecha_nacimiento) : null;
        const g: Gender =
          me.genero && ["masculino", "femenino"].includes(String(me.genero))
            ? (me.genero as Gender) : null;

        setNombres(me.nombres || "");
        setApellidos(me.apellidos || "");
        setEmail(me.email || "");
        setUsername(me.username || "");
        setDob(d && d.isValid() ? d : null);
        setGenero(g);
        setMustChangePwd(!!me.must_change_password);

        setInitial({
          nombres: me.nombres || "",
          apellidos: me.apellidos || "",
          email: me.email || "",
          username: me.username || "",
          fecha_nacimiento: d && d.isValid() ? d.format("YYYY-MM-DD") : null,
          genero: g,
        });
      } catch (e: any) {
        showNotification(e?.message || "No se pudo cargar el perfil", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dobStr = dob && dob.isValid() ? dob.format("YYYY-MM-DD") : null;

  const dirtyProfile =
    nombres !== initial.nombres ||
    apellidos !== initial.apellidos ||
    email !== initial.email ||
    username !== initial.username ||
    dobStr !== initial.fecha_nacimiento ||
    genero !== initial.genero;

  // ======= Guardar perfil (con confirmación) =======
  function requestSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!dirtyProfile) {
      showNotification("No hay cambios para guardar", "info");
      return;
    }
    setConfirmSaveOpen(true);
  }

  async function confirmSaveProfile() {
    try {
      setSavingProfile(true);
      await updateMe({
        nombres,
        apellidos,
        email: email || null,
        username: username || null,
        fecha_nacimiento: dobStr,     // ← enviamos string YYYY-MM-DD o null
        genero: genero ?? null,       // ← enviamos string o null
      });
      showNotification("Perfil actualizado", "success");

      setInitial({
        nombres, apellidos, email, username,
        fecha_nacimiento: dobStr, genero,
      });
      setConfirmSaveOpen(false);
    } catch (e: any) {
      showNotification(e?.message || "No se pudo actualizar", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  // ======= Cambiar contraseña (con confirmación) =======
  function requestChangePwd(e: React.FormEvent) {
    e.preventDefault();

    if ((!curPwd && !mustChangePwd) || !newPwd || !newPwd2) {
      showNotification("Completa todos los campos.", "warning");
      return;
    }
    if (newPwd.length < 6) {
      showNotification("La nueva contraseña debe tener al menos 6 caracteres", "warning");
      return;
    }
    if (newPwd !== newPwd2) {
      showNotification("Las contraseñas no coinciden", "warning");
      return;
    }
    setConfirmPassOpen(true);
  }

  async function confirmChangePwd() {
    try {
      setChangingPwd(true);
      await changeMyPassword(curPwd, newPwd);
      showNotification("Contraseña actualizada", "success");
      setCurPwd(""); setNewPwd(""); setNewPwd2("");
      setConfirmPassOpen(false);
    } catch (e: any) {
      let msg = e?.message || "No se pudo cambiar la contraseña";
      if (msg.includes("BAD_CURRENT_PASSWORD")) {
        msg = "La contraseña actual no es correcta.";
      } else if (msg.includes("WEAK_PASSWORD")) {
        msg = "La nueva contraseña es muy débil.";
      }
      showNotification(msg, "error");
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

          {/* Fecha de nacimiento (opcional) */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Fecha de nacimiento (opcional)</span>
            <WhiteDatePicker
              value={dob}
              onChange={(v) => setDob(v)}
              label={undefined}
              maxDate={maxDob}
              slotProps={{
                textField: { helperText: "Debe tener al menos 5 años. (opcional)" },
              }}
            />
          </label>

          {/* Género (opcional) */}
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Género</span>
            <select
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60"
              value={genero ?? ""}
              onChange={(e) => setGenero((e.target.value || null) as Gender)}
            >
              <option value="">— Selecciona (opcional) —</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {/* Mensajes eliminados */}

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
          {!mustChangePwd && (
            <label className="grid gap-1">
              <span className="text-sm dark:text-slate-200">
                Contraseña actual <span className="text-rose-500">*</span>
              </span>
              <input
                type="password"
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={curPwd}
                onChange={(e) => setCurPwd(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
              />
              {curPwd && curPwd.length >= 6 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ahora puedes ingresar tu nueva contraseña
                </p>
              )}
            </label>
          )}

          {mustChangePwd && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-xl text-sm mb-2">
              ⚠️ Has ingresado con un código temporal. Debes crear una nueva contraseña.
            </div>
          )}

          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200">
              Nueva contraseña <span className="text-rose-500">*</span>
            </span>
            <input
              type="password"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              disabled={!mustChangePwd && (!curPwd || curPwd.length < 6)}
              placeholder={!mustChangePwd && (!curPwd || curPwd.length < 6) ? "Primero ingresa tu contraseña actual" : "Mínimo 6 caracteres"}
            />
            {newPwd && newPwd.length < 6 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                La contraseña debe tener al menos 6 caracteres
              </p>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200">
              Confirmar nueva contraseña <span className="text-rose-500">*</span>
            </span>
            <input
              type="password"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white text-slate-900 dark:text-slate-200 dark:bg-slate-900/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
              disabled={!mustChangePwd && (!curPwd || curPwd.length < 6)}
              placeholder={!mustChangePwd && (!curPwd || curPwd.length < 6) ? "Primero ingresa tu contraseña actual" : "Repite la nueva contraseña"}
            />
            {newPwd2 && newPwd !== newPwd2 && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Las contraseñas no coinciden
              </p>
            )}
            {newPwd2 && newPwd === newPwd2 && newPwd.length >= 6 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Las contraseñas coinciden
              </p>
            )}
          </label>

          <div className="mt-1">
            <button 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!mustChangePwd && (!curPwd || curPwd.length < 6)}
            >
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
