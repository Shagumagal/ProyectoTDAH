import { useState } from "react";
import { requestPasswordReset } from "./services/password.services";
import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo procesar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow">
        <h1 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Recuperar contraseña</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        {sent ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 p-3">
            Si el correo existe, se envió un enlace para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-slate-700 dark:text-slate-200">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>

            {err && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 p-3">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="inline-flex justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm">
          <Link to={ROUTES.login} className="text-indigo-600 hover:underline">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}
