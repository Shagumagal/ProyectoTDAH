import React, { useMemo, useState } from "react";

// Login amigable y responsive para Estudiante y Psicólogo
// - Mobile-first, tipografía grande, altos contrastes y áreas táctiles generosas
// - No depende de librerías externas: solo React + Tailwind
// - Listo para conectar con tu backend (onSubmit)

export default function LoginPage() {
  const [role, setRole] = useState<"estudiante" | "psicologo">("estudiante");
  const [showPassword, setShowPassword] = useState(false);
  const [useCode, setUseCode] = useState(false); // alternativa para estudiantes sin correo

  const title = useMemo(
    () => (role === "estudiante" ? "¡Hola! Ingresa para jugar" : "Acceso para profesionales"),
    [role]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Aquí conectas con tu backend
    // Ejemplo: fetch('/api/auth/login', { method: 'POST', body: new URLSearchParams(fd as any) })
    const payload = Object.fromEntries(fd.entries());
    console.log("Login payload", payload);
    alert("(Demo) Enviar credenciales al backend. Reemplaza este alert por tu lógica.");
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
        {/* Panel Ilustración / Mensaje */}
        <div className="hidden md:flex flex-col justify-center p-8 rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur shadow-xl border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-md" />
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Plataforma TDAH</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">Juego + Reportes</p>
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            Atención, diversión y progreso
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
            Los estudiantes desarrollan actividades lúdicas evaluadas por el sistema. Los psicólogos acceden
            a paneles claros para seguimiento y reportes. Todo en una interfaz simple y accesible.
          </p>

          {/* mini-ilustración accesible (SVG simple) */}
          <div className="mt-8 aspect-[3/2] rounded-3xl bg-gradient-to-tr from-sky-100 to-indigo-100 dark:from-indigo-900 dark:to-slate-900 grid place-items-center overflow-hidden">
            <svg viewBox="0 0 300 180" className="w-4/5 opacity-90" aria-hidden>
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="30" fill="url(#g1)" />
              <rect x="120" y="40" width="60" height="40" rx="10" fill="#60a5fa" />
              <rect x="120" y="90" width="110" height="50" rx="12" fill="#34d399" />
              <circle cx="220" cy="70" r="18" fill="#f59e0b" />
            </svg>
          </div>
        </div>

        {/* Panel Formulario */}
        <div className="flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white dark:bg-slate-900/80 shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
            {/* Tabs de rol */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6" role="tablist" aria-label="Selecciona tu perfil">
              <button
                type="button"
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  role === "estudiante"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
                onClick={() => setRole("estudiante")}
                role="tab"
                aria-selected={role === "estudiante"}
              >
                Estudiante
              </button>
              <button
                type="button"
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  role === "psicologo"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
                onClick={() => setRole("psicologo")}
                role="tab"
                aria-selected={role === "psicologo"}
              >Docente / Psicólogo</button>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white mb-1">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Interfaz simple, accesible y segura.</p>

            {role === "estudiante" && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Sin correo electrónico?</span>
                <button
                  type="button"
                  onClick={() => setUseCode((v) => !v)}
                  className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {useCode ? "Usar correo y contraseña" : "Usar código de ingreso"}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <input type="hidden" name="role" value={role} />

              {role === "estudiante" && useCode ? (
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Código de ingreso</label>
                  <input
                    id="codigo"
                    name="codigo"
                    inputMode="numeric"
                    pattern="\d{6}"
                    placeholder="6 dígitos"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 caret-indigo-400 outline-none ring-2 ring-transparent focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  />
                  <p className="mt-1 text-xs text-slate-500">Pide tu código al docente/psicólogo (6 dígitos).</p>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Correo electrónico</label>
                    <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="tucorreo@ejemplo.com"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900/60 px-4 py-3 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 caret-indigo-400 outline-none ring-2 ring-transparent focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        aria-pressed={showPassword}
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900/60 px-4 py-3 pr-12 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/90 caret-indigo-400 outline-none ring-2 ring-transparent focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 opacity-60">
                        {/* icono ojo simple */}
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-500"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-5 0-9.27-3.11-10.94-8  .54-1.66 1.43-3.16 2.57-4.4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" strokeWidth="2"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-500"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input type="checkbox" name="remember" className="size-4 rounded border-slate-300 dark:border-slate-700" />
                  Recuérdame
                </label>
                <a href="#" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Olvidé mi contraseña</a>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800"
              >
                Ingresar
              </button>

              {/* CTA para registro — opcional */}
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                ¿Aún no tienes cuenta? <a href="#" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Solicitar acceso</a>
              </p>
            </form>

            {/* Avisos de accesibilidad / privacidad */}
            <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
              <ul className="list-disc pl-5 space-y-1">
                <li>Compatible con lectores de pantalla y navegación por teclado.</li>
                <li>Campos y botones grandes para manos pequeñas.</li>
                <li>Datos protegidos. Esta plataforma no reemplaza un diagnóstico clínico.</li>
              </ul>
            </div>
          </div>

          {/* Footer simple */}
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Proyecto TDAH — UNIVALLE</p>
        </div>
      </div>
    </div>
  );
}
