// src/app/AppRoutes.tsx
import { Suspense, lazy, type JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/AppShell";
import { ROUTES } from "../lib/routes";
import TwoFactorPage from "../features/auth/TwoFactorPage";
import ProfilePage from "../features/auth/ProfilePage";

const UsersPage    = lazy(() => import("../features/users/pages/UsersPage"));
const LoginPage    = lazy(() => import("../features/auth/LoginPage"));
const StudentsPage = lazy(() => import("../features/students/pages/StudentsPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/ForgotPasswordPage"));
const ResetPasswordPage  = lazy(() => import("../features/auth/ResetPasswordPage"));

// …


type Role = "admin" | "profesor" | "psicologo" | "estudiante";

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function getRoleFromToken(): Role | null {
  const t = localStorage.getItem("auth_token");
  if (!t) return null;
  const p = parseJwt(t);
  const r = (p?.role || "").toLowerCase();
  return ["admin", "profesor", "psicologo", "estudiante"].includes(r) ? (r as Role) : null;
}

const HOME_BY_ROLE: Record<Role, string> = {
  admin: ROUTES.usuarios,
  profesor: ROUTES.alumnos,
  psicologo: ROUTES.resultados,
  estudiante: ROUTES.videojuego,
};

function homeByRole(role: Role | null) {
  if (!role) return ROUTES.login;
  return HOME_BY_ROLE[role];
}

function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: JSX.Element;
}) {
  const token = localStorage.getItem("auth_token");
  if (!token) return <Navigate to={ROUTES.login} replace />;
  const role = getRoleFromToken();
  if (!role || !allow.includes(role)) {
    return <Navigate to={homeByRole(role)} replace />;
  }
  // AppShell envuelve el contenido protegido
  return <AppShell>{children}</AppShell>;
}

function AppHomeRedirect() {
  const role = getRoleFromToken();
  return <Navigate to={homeByRole(role)} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-slate-600 dark:text-slate-300">Cargando…</div>}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LoginPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.authCode} element={<TwoFactorPage />} />

          {/* Protegido + control por rol */}
          <Route
            path={ROUTES.usuarios}
            element={
              <ProtectedRoute allow={["admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.alumnos}
            element={
              <ProtectedRoute allow={["admin", "profesor"]}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
<Route path={ROUTES.forgot} element={<ForgotPasswordPage />} />
<Route path={ROUTES.reset}  element={<ResetPasswordPage />} />
          <Route
            path={ROUTES.videojuego}
            element={
              <ProtectedRoute allow={["admin", "profesor", "psicologo", "estudiante"]}>
                <div className="p-6">Videojuego (pendiente)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.resultados}
            element={
              <ProtectedRoute allow={["admin", "profesor", "psicologo"]}>
                <div className="p-6">Resultados (pendiente)</div>
              </ProtectedRoute>
            }
          />
          <Route
  path={ROUTES.perfil}
  element={
    <ProtectedRoute allow={["admin","profesor","psicologo","estudiante"]}>
      <ProfilePage />
    </ProtectedRoute>
  }
/>

          {/* Redirecciones según rol */}
          <Route path={ROUTES.app} element={<AppHomeRedirect />} />
          <Route path="*" element={<AppHomeRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
