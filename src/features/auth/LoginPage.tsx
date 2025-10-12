// src/features/auth/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // ⬅️ agregado Link

import { ROUTES } from "../../lib/routes";
import { loginPassword, loginWithCode } from "./services/auth.services";

/* === Type guards locales (no cambian tus servicios/typings) === */
type AnyObj = Record<string, any>;

function has<K extends string>(o: unknown, k: K): o is AnyObj & Record<K, unknown> {
  return !!o && typeof o === "object" && k in (o as AnyObj);
}

function isTwoFARequired(o: unknown): o is {
  status: "2FA_REQUIRED";
  user_id: number;
  email: string;
  expires_in?: number;
  role?: string;
  must_change?: boolean;
} {
  return has(o, "status") && (o as AnyObj).status === "2FA_REQUIRED" && has(o, "user_id") && has(o, "email");
}

function isLoginOk(o: unknown): o is {
  status?: "OK";
  token?: string;
  user?: { id: number; role: string; must_change?: boolean };
  user_id?: number; // compat
  role?: string;
  must_change?: boolean;
} {
  // OK moderno con status, o compat con user_id
  return (has(o, "status") && (o as AnyObj).status === "OK") || has(o, "user_id");
}

function isErrorResp(o: unknown): o is { error: string } {
  return has(o, "error") && typeof (o as AnyObj).error === "string";
}
/* ============================================================= */

export default function LoginPage() {
  const nav = useNavigate();

  // UI state
  const [mode, setMode] = useState<"password" | "code">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // password mode
  const [identifier, setIdentifier] = useState(""); // correo o usuario
  const [password, setPassword] = useState("");

  // code mode (alumnos sin email)
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await loginPassword(identifier.trim(), password);

      if (isTwoFARequired(r)) {
        sessionStorage.setItem("pending2fa", JSON.stringify({ user_id: r.user_id, email: r.email }));
        nav(ROUTES.authCode);
        return;
      }

      if (isLoginOk(r)) {
        if ("token" in r && r.token) localStorage.setItem("auth_token", r.token as string);
        if (("must_change" in r && r.must_change) || ("user" in r && (r as AnyObj).user?.must_change)) {
          console.warn("El usuario debe cambiar su contraseña tras el acceso.");
        }
        nav(ROUTES.usuarios);
        return;
      }

      if (isErrorResp(r)) throw new Error(mapError(r.error));
      throw new Error("Credenciales inválidas");
    } catch (err: any) {
      setError(err?.message || "Error de inicio de sesión");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await loginWithCode(username.trim(), code.trim());

      if (isLoginOk(r)) {
        if ("token" in r && r.token) localStorage.setItem("auth_token", r.token as string);
        if ("user" in r && (r as AnyObj).user?.must_change) {
          console.info("El usuario debe cambiar su contraseña en el primer inicio de sesión.");
        }
        nav(ROUTES.usuarios);
        return;
      }

      if (isErrorResp(r)) throw new Error(mapError(r.error));
      throw new Error("Código inválido o expirado");
    } catch (err: any) {
      setError(err?.message || "Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow" />
              <div className="leading-tight">
                <p className="text-lg font-black text-slate-900 dark:text-white">Plataforma TDAH</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Acceso seguro</p>
              </div>
            </div>

            {mode === "password" ? (
              <form onSubmit={submitPassword} className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Correo o usuario</label>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="tu@correo.com o usuario"
                    autoComplete="username"
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                  disabled={loading}
                  className="mt-2 rounded-xl px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {loading ? "Ingresando…" : "Ingresar"}
                </button>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-2 mt-2">
                  <button type="button" onClick={() => setMode("code")} className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Tengo un código
                  </button>
                  <span>·</span>
                  {/* ⬇️ Enlace real a recuperación */}
                  <Link to={ROUTES.forgot} className="underline underline-offset-4">
                    Olvidé mi contraseña
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={submitCode} className="grid gap-4">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-800 p-3 text-xs text-indigo-900 dark:text-indigo-200">
                  Para alumnos sin email: ingresa tu <strong>usuario</strong> y el <strong>código de 6 dígitos</strong> que te dio tu profesor/administrador.
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Usuario</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tu_usuario"
                    autoComplete="username"
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Código (6 dígitos)</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400 tracking-widest"
                  />
                </div>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                  disabled={loading}
                  className="mt-2 rounded-xl px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {loading ? "Validando…" : "Ingresar con código"}
                </button>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-2 mt-2">
                  <button type="button" onClick={() => setMode("password")} className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Volver a contraseña
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600 dark:text-slate-300">
          © {new Date().getFullYear()} Proyecto TDAH — UNIVALLE
        </p>
      </div>
    </div>
  );
}

/** Mapear errores técnicos a mensajes amigables */
function mapError(code: string): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Credenciales inválidas";
    case "NO_CODE":
      return "No hay un código pendiente.";
    case "INVALID_OR_EXPIRED":
      return "El código es inválido o ha expirado.";
    case "NOT_FOUND":
      return "Usuario no encontrado.";
    default:
      return code;
  }
}
