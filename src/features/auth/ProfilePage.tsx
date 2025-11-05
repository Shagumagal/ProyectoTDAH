// src/features/auth/ProfilePage.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { getMe, updateMe, changeMyPassword } from "./services/profile.services";
import ConfirmDialog from "../../componentes/ConfirmDialog";
import WhiteDatePicker from "../../componentes/WhiteDatePicker";

type Gender = "masculino" | "femenino" | "no_binario" | "prefiero_no_decir" | null;

const GENDER_OPTIONS: Array<{ value: Exclude<Gender, null>; label: string }> = [
  { value: "masculino",        label: "Masculino" },
  { value: "femenino",         label: "Femenino" },
  { value: "no_binario",       label: "No binario" },
  { value: "prefiero_no_decir",label: "Prefiero no decir" },
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  // ---- Datos de perfil ----
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

  // Mensajes perfil
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

  // Restricción: mínimo 5 años
  const maxDob = useMemo(() => dayjs().subtract(5, "year"), []);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        // Parseo seguro de fecha
        const d = me.fecha_nacimiento ? dayjs(me.fecha_nacimiento) : null;
        const g: Gender =
          me.genero && ["masculino","femenino","no_binario","prefiero_no_decir"].includes(String(me.genero))
            ? (me.genero as Gender) : null;

        setNombres(me.nombres || "");
        setApellidos(me.apellidos || "");
        setEmail(me.email || "");
        setUsername(me.username || "");
        setDob(d && d.isValid() ? d : null);
        setGenero(g);

        setInitial({
          nombres: me.nombres || "",
          apellidos: me.apellidos || "",
          email: me.email || "",
          username: me.username || "",
          fecha_nacimiento: d && d.isValid() ? d.format("YYYY-MM-DD") : null,
          genero: g,
        });
      } catch (e: any) {
        setErrProfile(e?.message || "No se pudo cargar el perfil");
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
      await updateMe({
        nombres,
        apellidos,
        email: email || null,
        username: username || null,
        fecha_nacimiento: dobStr,     // ← enviamos string YYYY-MM-DD o null
        genero: genero ?? null,       // ← enviamos string o null
      });
      setOkMsgProfile("Perfil actualizado");

      setInitial({
        nombres, apellidos, email, username,
        fecha_nacimiento: dobStr, genero,
      });
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
