import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * TwoFactorPage
 * - Vista para ingresar un código 2FA de 6 dígitos
 * - Diseño responsive, dark-friendly (Tailwind)
 * - Maneja pegado, auto-avance, backspace, reenvío con contador
 * - Espera encontrar `pending2fa` en sessionStorage o en location.state { user_id, email }
 *   → Al recibir 2FA_REQUIRED en /auth/login-password, hacer:
 *      sessionStorage.setItem('pending2fa', JSON.stringify({ user_id, email }))
 *      navigate('/auth/code')
 */
export default function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  // Preferir state, si no hay usar sessionStorage.
  const pending = useMemo(() => {
    const fromState = location?.state?.pending2fa;
    if (fromState?.user_id) return fromState;
    try {
      const raw = sessionStorage.getItem("pending2fa");
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, [location?.state]);

  const userId: number | null = pending?.user_id ?? null;
  const email: string | null = pending?.email ?? null;

  // Si no hay contexto, invitar a loguearse de nuevo
  if (!userId) {
    return (
      <div className="min-h-dvh grid place-items-center bg-neutral-100 dark:bg-neutral-900 px-4">
        <div className="max-w-md w-full text-center p-8 rounded-2xl bg-white/80 dark:bg-neutral-900/60 shadow-lg ring-1 ring-black/5 backdrop-blur">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Verificación en dos pasos</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">No encontramos una sesión pendiente de verificación. Por favor, inicia sesión nuevamente.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full py-2.5 rounded-xl font-medium shadow-sm border border-transparent bg-indigo-600/90 hover:bg-indigo-600 text-white transition"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // ======= Estado de PIN y enfoque =======
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======= Reenvío (cooldown) =======
  const INITIAL_SECONDS = 60;
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

  const maskedEmail = useMemo(() => (email ? maskEmail(email) : ""), [email]);

  function onChangeDigit(idx: number, v: string) {
    setError(null);
    const onlyNum = v.replace(/\D/g, "");
    if (!onlyNum) {
      setDigits((d) => {
        const nd = [...d];
        nd[idx] = "";
        return nd;
      });
      return;
    }
    // Permite pegar varios dígitos
    const chars = onlyNum.split("");
    setDigits((prev) => {
      const nd = [...prev];
      for (let i = 0; i < chars.length && idx + i < 6; i++) {
        nd[idx + i] = chars[i];
      }
      return nd;
    });
    // Mover foco según la cantidad pegada
    const nextIndex = Math.min(idx + chars.length, 5);
    queueMicrotask(() => inputsRef.current[nextIndex]?.focus());
  }

  function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
      setDigits((d) => {
        const nd = [...d];
        nd[idx - 1] = "";
        return nd;
      });
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      e.preventDefault();
      inputsRef.current[idx + 1]?.focus();
    }
  }

  const code = digits.join("");
  const ready = code.length === 6 && /^\d{6}$/.test(code);

  async function submitCode() {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, code })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Código inválido o expirado");

      // Guardar token y limpiar estado temporal
      if (data?.token) localStorage.setItem("auth_token", data.token);
      sessionStorage.removeItem("pending2fa");

      // TODO: ajusta la ruta de éxito según tu app
      navigate("/app/usuarios", { replace: true });
    } catch (e: any) {
      setError(e.message || "No se pudo verificar el código");
      // Resaltar inputs si falla
      shakeRow();
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/auth/resend-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "No se pudo reenviar");
      setSeconds(INITIAL_SECONDS);
    } catch (e: any) {
      setError(e.message || "No se pudo reenviar el código");
    } finally {
      setResending(false);
    }
  }

  // Efecto "shake" sutil en error
  const rowRef = useRef<HTMLDivElement | null>(null);
  function shakeRow() {
    const el = rowRef.current;
    if (!el) return;
    el.classList.remove("animate-[shake_.18s_ease-in-out_1]");
    // Forzar reflow
    void el.offsetWidth;
    el.classList.add("animate-[shake_.18s_ease-in-out_1]");
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-950 dark:to-neutral-900 px-4">
      <div className="w-full max-w-md">
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/40 to-sky-500/60 shadow-xl">
          <div className="rounded-3xl bg-white/90 dark:bg-neutral-900/70 backdrop-blur p-8">
            <header className="text-center">
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Verificación en dos pasos
              </h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Enviamos un código a <span className="font-medium">{maskedEmail}</span>. Ingresa los 6 dígitos.
              </p>
            </header>

            <div ref={rowRef} className="mt-6 flex items-center justify-center gap-2 select-none">
              {digits.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  inputMode="numeric"
                  pattern="\\d*"
                  maxLength={6}
                  value={val}
                  onChange={(e) => onChangeDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  onFocus={(e) => e.currentTarget.select()}
                  className={
                    "w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl rounded-2xl " +
                    "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 " +
                    "outline-none ring-2 ring-transparent focus:ring-indigo-500/60 transition"
                  }
                  aria-label={`Dígito ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-rose-400 text-center">{error}</p>
            )}

            <button
              onClick={submitCode}
              disabled={!ready || submitting}
              className="mt-6 w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed 
                         bg-indigo-600 hover:bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20 transition"
            >
              {submitting ? "Verificando…" : "Verificar"}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
              <button
                onClick={() => navigate("/login")}
                className="hover:underline underline-offset-4"
              >
                Cambiar cuenta
              </button>

              <div className="flex items-center gap-3">
                {seconds > 0 ? (
                  <span>Reenviar en {seconds}s</span>
                ) : (
                  <button
                    onClick={resendCode}
                    disabled={resending}
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4 disabled:opacity-50"
                  >
                    {resending ? "Enviando…" : "Reenviar código"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          ¿No recibiste el correo? Revisa spam/promociones. Si el problema persiste, contacta al administrador.
        </p>
      </div>

      {/* Animación shake */}
      <style>{`
        @keyframes shake { 10% { transform: translateX(-2px) } 30% { transform: translateX(2px) } 50% { transform: translateX(-1px) } 70% { transform: translateX(1px) } 100% { transform: translateX(0) } }
      `}</style>
    </div>
  );
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const u = user.length <= 2 ? user[0] + "*" : user[0] + "*".repeat(Math.max(1, user.length - 2)) + user[user.length - 1];
  const [host, tld] = domain.split(".");
  const h = host ? host[0] + "*".repeat(Math.max(1, host.length - 1)) : domain;
  return `${u}@${h}${tld ? "." + tld : ""}`;
}
