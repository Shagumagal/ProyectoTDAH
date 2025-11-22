import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "./services/password.services";
import { ROUTES } from "../../lib/routes";
import { useNotification } from "../../context/NotificationContext";

export default function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const token = sp.get("token") ?? "";
  const nav = useNavigate();

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!token) showNotification("Enlace inválido", "error");
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return showNotification("Enlace inválido", "error");
    if (pwd.length < 6) return showNotification("La contraseña debe tener al menos 6 caracteres", "warning");
    if (pwd !== pwd2) return showNotification("Las contraseñas no coinciden", "warning");

    setLoading(true);
    try {
      await resetPassword(token, pwd);
      showNotification("¡Listo! Redirigiendo al inicio de sesión…", "success");
      setTimeout(() => nav(ROUTES.login, { replace: true }), 1200);
    } catch (e: any) {
      showNotification(e?.message ?? "No se pudo restablecer la contraseña", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow">
        <h1 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Restablecer contraseña</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Ingresa tu nueva contraseña.
        </p>

        <form onSubmit={onSubmit} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Nueva contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-700 dark:text-slate-200">Confirmar contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>

          <button
            disabled={loading}
            className="inline-flex justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Restablecer"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to={ROUTES.login} className="text-indigo-600 hover:underline">Volver al inicio de sesión</Link>
        </div>
      </div >
    </div >
  );
}
