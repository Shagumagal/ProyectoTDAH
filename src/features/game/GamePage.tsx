// src/features/game/GamePage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../lib/http";
import { ROUTES } from "../../lib/routes";
import ConfirmDialog from "../../componentes/ConfirmDialog";

// URL pública del backend en Render (para cuando el juego corre en Itch.io)
const RENDER_API_URL = "https://proyectotdah.onrender.com";
// URL del juego en Itch.io
const ITCH_GAME_URL = "https://shagumagal.itch.io/tdah-ga";

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function getParticipantIdFromToken(token: string | null): string {
  if (!token) return "demo_user";
  const p = parseJwt(token);
  return (
    p?.username?.toString() ||
    p?.user_name?.toString() ||
    p?.email?.toString() ||
    (p?.sub ? String(p.sub) : "") ||
    "demo_user"
  );
}

function getUserInfoFromToken(token: string | null) {
  if (!token) return null;
  const p = parseJwt(token);
  return {
    username: p?.username || "N/A",
    email: p?.email || "N/A",
    role: p?.role || "N/A",
  };
}

type GameMode = "local" | "itch";

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("itch");

  const token = localStorage.getItem("auth_token");
  const participantId = useMemo(() => getParticipantIdFromToken(token), [token]);
  const userInfo = useMemo(() => getUserInfoFromToken(token), [token]);

  // URL local → abre el build embebido en /game/index.html (usa backend por variable de entorno)
  const localGameUrl = useMemo(() => {
    if (!token) return null;
    const params = new URLSearchParams({ token, pid: participantId, apiUrl: API_URL });
    return `/game/index.html?${params.toString()}`;
  }, [token, participantId]);

  // URL Itch.io → abre el juego desplegado apuntando SIEMPRE al backend de Render
  const itchGameUrl = useMemo(() => {
    if (!token) return null;
    const params = new URLSearchParams({ token, pid: participantId, apiUrl: RENDER_API_URL });
    return `${ITCH_GAME_URL}?${params.toString()}`;
  }, [token, participantId]);

  const activeUrl = gameMode === "local" ? localGameUrl : itchGameUrl;

  const handleCopyUrl = () => {
    if (activeUrl) {
      navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => setShowConsentDialog(true);

  const handleConfirmStart = () => {
    if (activeUrl) {
      window.open(activeUrl, "_blank");
      setShowConsentDialog(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sesión no encontrada</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              No se encontró una sesión activa. Por favor, inicia sesión nuevamente.
            </p>
            <button
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              onClick={() => navigate(ROUTES.login)}
            >
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="6" width="20" height="12" rx="2" ry="2" strokeWidth={2} />
              <path d="M7 12h4M9 10v4" strokeWidth={2} />
              <circle cx="17" cy="11" r="1" fill="currentColor" />
              <circle cx="19" cy="13" r="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Videojuego TDAH</h1>
            <p className="text-emerald-100">Plataforma de evaluación interactiva</p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Información de sesión</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Usuario</p>
            <p className="font-mono text-sm text-slate-900 dark:text-white font-semibold">{userInfo?.username}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
            <p className="font-mono text-sm text-slate-900 dark:text-white font-semibold truncate">{userInfo?.email}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rol</p>
            <p className="font-mono text-sm text-slate-900 dark:text-white font-semibold capitalize">{userInfo?.role}</p>
          </div>
        </div>
      </div>

      {/* Game Launch Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Iniciar evaluación</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Selecciona la versión del juego que deseas abrir. La versión <strong>Itch.io</strong> usa el servidor en la nube y es la recomendada para evaluaciones reales.
        </p>

        {/* Mode Selector */}
        <div className="flex gap-3 mb-6">
          <button
            id="btn-mode-itch"
            onClick={() => setGameMode("itch")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
              gameMode === "itch"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300"
            }`}
          >
            {/* Globe icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2}/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeWidth={2}/>
            </svg>
            Itch.io (Recomendado)
            {gameMode === "itch" && (
              <span className="ml-1 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Activo</span>
            )}
          </button>

          <button
            id="btn-mode-local"
            onClick={() => setGameMode("local")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
              gameMode === "local"
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300"
            }`}
          >
            {/* Server icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="4" rx="1" strokeWidth={2}/>
              <rect x="2" y="10" width="20" height="4" rx="1" strokeWidth={2}/>
              <rect x="2" y="17" width="20" height="4" rx="1" strokeWidth={2}/>
              <circle cx="18" cy="5" r="1" fill="currentColor"/>
              <circle cx="18" cy="12" r="1" fill="currentColor"/>
              <circle cx="18" cy="19" r="1" fill="currentColor"/>
            </svg>
            Local (dev)
            {gameMode === "local" && (
              <span className="ml-1 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Activo</span>
            )}
          </button>
        </div>

        {/* Mode info banner */}
        {gameMode === "itch" ? (
          <div className="mb-4 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-emerald-800 dark:text-emerald-200">
              <p className="font-bold">Modo Itch.io — Servidor en la nube</p>
              <p className="mt-0.5 text-emerald-700 dark:text-emerald-300">Los datos se guardan en <strong>proyectotdah.onrender.com</strong>. Recomendado para evaluaciones con alumnos reales.</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-bold">Modo Local — Solo en esta máquina</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">El juego usa el build embebido y apunta a <strong>{API_URL}</strong>. Útil para pruebas de desarrollo.</p>
            </div>
          </div>
        )}

        {activeUrl && (
          <div className="space-y-4">
            <button
              id="btn-start-game"
              className={`w-full px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg ${
                gameMode === "itch"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              }`}
              onClick={handleStartGame}
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {gameMode === "itch" ? "Abrir juego en Itch.io" : "Abrir juego local"}
              </div>
            </button>

            {/* Debug URL */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">URL generada:</p>
                <button
                  onClick={handleCopyUrl}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  {copied ? "✓ Copiado" : "Copiar URL"}
                </button>
              </div>
              <code className="text-xs text-slate-600 dark:text-slate-400 break-all block">{activeUrl}</code>
            </div>
          </div>
        )}
      </div>

      {/* Consent Dialog */}
      <ConfirmDialog
        open={showConsentDialog}
        onClose={() => setShowConsentDialog(false)}
        onConfirm={handleConfirmStart}
        title="Consentimiento Informado"
        description="Estás a punto de iniciar un juego interactivo diseñado para evaluar indicadores relacionados con el TDAH (Trastorno por Déficit de Atención e Hiperactividad). Los resultados son métricas de apoyo, NO un diagnóstico médico. Esta herramienta NO reemplaza una evaluación clínica profesional. Los datos ayudan al psicólogo a obtener información complementaria. Un diagnóstico de TDAH requiere evaluación integral por un especialista. Tus datos están protegidos y son confidenciales. Solo profesionales autorizados dentro de la institución del colegio Instituto Americano pueden acceder a los resultados."
        confirmText="Aceptar y continuar"
        cancelText="Cancelar"
      />
    </div>
  );
};
