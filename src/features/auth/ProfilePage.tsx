import { useEffect, useState } from "react";
import { getMe, updateMe, changeMyPassword } from "./services/profile.services";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // password form
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");

  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setNombres(me.nombres || "");
        setApellidos(me.apellidos || "");
        setEmail(me.email || "");
        setUsername(me.username || "");
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await updateMe({ nombres, apellidos, email, username });
      setOkMsg("Perfil actualizado");
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: any) {
      setErr(e?.message || "No se pudo actualizar");
    }
  }

  async function onChangePwd(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (newPwd.length < 6) return setErr("La nueva contraseña debe tener al menos 6 caracteres");
    if (newPwd !== newPwd2) return setErr("Las contraseñas no coinciden");
    try {
      await changeMyPassword(curPwd, newPwd);
      setOkMsg("Contraseña actualizada");
      setCurPwd(""); setNewPwd(""); setNewPwd2("");
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: any) {
      setErr(e?.message || "No se pudo cambiar la contraseña");
    }
  }

  if (loading) return <div className="p-6 text-slate-600 dark:text-slate-300">Cargando perfil…</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Mis datos</h2>
        <form onSubmit={onSaveProfile} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Nombres</span>
            <input className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={nombres} onChange={e=>setNombres(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Apellidos</span>
            <input className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={apellidos} onChange={e=>setApellidos(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Correo</span>
            <input type="email" className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={email} onChange={e=>setEmail(e.target.value)} placeholder="opcional" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Usuario</span>
            <input className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={username} onChange={e=>setUsername(e.target.value)} placeholder="opcional" />
          </label>

          {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="mt-1">
            <button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2">
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Cambiar contraseña</h2>
        <form onSubmit={onChangePwd} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200">Contraseña actual</span>
            <input type="password" className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={curPwd} onChange={e=>setCurPwd(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm dark:text-slate-200" >Nueva contraseña</span>
            <input type="password" className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-s dark:text-slate-200" >Confirmar nueva contraseña</span>
            <input type="password" className="rounded-xl border px-3 py-2 bg-white dark:text-slate-200 dark:bg-slate-900/60"
              value={newPwd2} onChange={e=>setNewPwd2(e.target.value)} />
          </label>

          {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="mt-1">
            <button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2">
              Actualizar contraseña
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
