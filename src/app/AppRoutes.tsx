// src/app/AppRoutes.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/AppShell";
import { ROUTES } from "../lib/routes";
import TwoFactorPage from "../features/auth/TwoFactorPage";

const UsersPage     = lazy(() => import("../features/users/pages/UsersPage"));
const LoginPage     = lazy(() => import("../features/auth/LoginPage"));
const StudentsPage  = lazy(() => import("../features/students/pages/StudentsPage"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-slate-600 dark:text-slate-300">Cargando…</div>}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LoginPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path="/auth/code" element={<TwoFactorPage />} />

          {/* Protegido con AppShell */}
          <Route path={ROUTES.usuarios}   element={<AppShell><UsersPage /></AppShell>} />
          <Route path={ROUTES.alumnos}    element={<AppShell><StudentsPage /></AppShell>} />  {/* ← envuelto */}
          <Route path={ROUTES.videojuego} element={<AppShell><div className="p-6">Videojuego (pendiente)</div></AppShell>} />
          <Route path={ROUTES.resultados} element={<AppShell><div className="p-6">Resultados (pendiente)</div></AppShell>} />

          {/* Redirecciones */}
          <Route path={ROUTES.app} element={<Navigate to={ROUTES.usuarios} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.usuarios} replace />} />  {/* ← deja solo una */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
