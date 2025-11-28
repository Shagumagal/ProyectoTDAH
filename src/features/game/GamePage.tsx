// src/features/game/GamePage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GAME_URL } from "./gameUrl";
import { ROUTES } from "../../lib/routes";

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
  // Ajusta estos campos a lo que lleve tu JWT
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

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("auth_token");
  const participantId = useMemo(() => getParticipantIdFromToken(token), [token]);
  const userInfo = useMemo(() => getUserInfoFromToken(token), [token]);

  const gameUrl = useMemo(() => {
    if (!token) return null;
    const params = new URLSearchParams({
      token,
      pid: participantId,
    });
    return `${GAME_URL}?${params.toString()}`;
  }, [token, participantId]);

  const handleCopyUrl = () => {
    if (gameUrl) {
      navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          Al iniciar el juego, tu sesión será enviada automáticamente al módulo de Unity para registrar tus resultados de forma segura.
        </p>

        {gameUrl && (
          <div className="space-y-4">
            <button
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg"
              onClick={() => window.open(gameUrl, "_blank")}
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar juego en nueva pestaña
              </div>
            </button>

            {/* Debug URL */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">URL generada (debug):</p>
                <button
                  onClick={handleCopyUrl}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  {copied ? "✓ Copiado" : "Copiar URL"}
                </button>
              </div>
              <code className="text-xs text-slate-600 dark:text-slate-400 break-all block">{gameUrl}</code>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                    <li>El juego se abrirá en una nueva pestaña</li>
                    <li>Tu progreso se guardará automáticamente</li>
                    <li>Puedes cerrar y volver a abrir el juego cuando quieras</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
