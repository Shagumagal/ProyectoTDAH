// src/app/layout/AppShell.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ROUTES } from "../../lib/routes";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/services/auth.services";

type Role = "admin" | "profesor" | "psicologo" | "estudiante";

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return null; }
}
function getRoleFromToken(): Role | null {
  const t = localStorage.getItem("auth_token");
  if (!t) return null;
  const p = parseJwt(t);
  return p?.role ?? null;
}

const ALLOWED_ROUTES: Record<Role, string[]> = {
  admin:     [ROUTES.usuarios, ROUTES.videojuego, ROUTES.alumnos, ROUTES.perfil, ROUTES.resultados],
  profesor:  [ROUTES.videojuego, ROUTES.alumnos, ROUTES.perfil, ROUTES.resultados],
  psicologo: [ROUTES.videojuego, ROUTES.alumnos, ROUTES.perfil, ROUTES.resultados],
  estudiante:[ROUTES.videojuego,                ROUTES.perfil,  ROUTES.resultados],
};

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("tdah_dark", String(isDark));
  }, [isDark]);
  useEffect(() => {
    const stored = localStorage.getItem("tdah_dark");
    if (stored) setIsDark(stored === "true");
  }, []);
  return (
    <button
      onClick={() => setIsDark(d => !d)}
      className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2" />
      </svg>
      {isDark ? "Oscuro" : "Claro"}
    </button>
  );
}

function AvatarMini() {
  return <div className="size-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-inner" aria-hidden />;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const baseNav = useMemo(() => ([
    { to: ROUTES.usuarios,   label: "Usuarios",   icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/><circle cx="9" cy="7" r="4" strokeWidth="2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2"/></svg>)},
    { to: ROUTES.videojuego, label: "Videojuego", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="6" width="20" height="12" rx="2" ry="2" strokeWidth="2"/><path d="M7 12h4M9 10v4" strokeWidth="2"/><circle cx="17" cy="11" r="1"/><circle cx="19" cy="13" r="1"/></svg>)},
    { to: ROUTES.alumnos,    label: "Alumnos",    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m22 7-10-5L2 7l10 5 10-5z" strokeWidth="2"/><path d="M2 17l10 5 10-5" strokeWidth="2"/><path d="M2 12l10 5 10-5" strokeWidth="2"/></svg>)},
    { to: ROUTES.perfil,     label: "Perfil",     icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4" strokeWidth="2"/><path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" strokeWidth="2"/></svg>) },
    { to: ROUTES.resultados, label: "Resultados", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18" strokeWidth="2"/><rect x="7" y="9" width="3" height="9" strokeWidth="2"/><rect x="12" y="5" width="3" height="13" strokeWidth="2"/><rect x="17" y="8" width="3" height="10" strokeWidth="2"/></svg>)},
  ]), []);

  const role = getRoleFromToken();
  const allowed = role ? ALLOWED_ROUTES[role] : [];

  const navItems = useMemo(() => {
    if (role === "admin") return baseNav;
    return baseNav.filter((i) => allowed.includes(i.to));
  }, [role, allowed, baseNav]);

  const linkBase = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const linkInactive = "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white";
  const linkActive = "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow";

  function handleLogout() {
    logout();
    nav(ROUTES.login, { replace: true });
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-sky-50 via-indigo-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Plataforma TDAH</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-300">Panel principal</p>
              </div>
            </div>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(i => (
                <NavLink key={i.to} to={i.to} className={({isActive}) => [linkBase, isActive?linkActive:linkInactive].join(" ")}>
                  {i.icon}{i.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>
              <AvatarMini />
              <button onClick={() => setOpen(o => !o)} className="md:hidden rounded-xl border px-3 py-2 text-sm">
                Menú
              </button>
            </div>
          </div>

          {/* Nav móvil */}
          {open && (
            <nav className="md:hidden pb-3">
              <div className="grid gap-2">
                {navItems.map(i => (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className={({isActive}) => [linkBase, "w-full", isActive?linkActive:linkInactive].join(" ")}
                  >
                    {i.icon}{i.label}
                  </NavLink>
                ))}
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="w-full text-left rounded-xl border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                >
                  Cerrar sesión
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 pb-8 text-center text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} Proyecto TDAH — UNIVALLE
      </footer>
    </div>
  );
}
