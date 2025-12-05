import { useState } from "react";
import { useLocation } from "react-router-dom";
import { getADHDAnalysis } from "../services/adhdPrediction.service";

export default function AIAnalysisPage() {
  const location = useLocation();
  const { studentName, studentId } = location.state || {};
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (!studentId) {
        alert("No se ha seleccionado un estudiante para analizar.");
        return;
    }

    try {
        setLoading(true);
        setError(null);
        const result = await getADHDAnalysis(studentId);
        setPrediction(result);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al realizar el análisis");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Análisis de Probabilidad de TDAH
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Procesamiento de juegos y análisis de probabilidad de TDAH mediante IA
              </p>
            </div>
          </div>

          {studentName && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="size-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Estudiante</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{studentName}</p>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Info Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Análisis de Probabilidad de TDAH
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Utiliza inteligencia artificial para procesar los resultados de los juegos 
                cognitivos y calcular la probabilidad de TDAH basándose en métricas de atención, 
                impulsividad, hiperactividad y control inhibitorio.
              </p>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg mb-6">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Genera un Análisis de Probabilidad
            </h3>
            
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Procesa todos los juegos completados para calcular la probabilidad de TDAH 
              con un reporte detallado que incluye análisis de criterios DSM-5 y recomendaciones.
            </p>
            
            <button
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-bold px-8 py-4 shadow-2xl shadow-purple-600/30 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all duration-200 transform hover:scale-105"
              onClick={handleAnalysis}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Analizar Probabilidad de TDAH
            </button>

            {loading && (
                <div className="mt-8 p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-slate-600 dark:text-slate-300">Procesando análisis...</p>
                </div>
            )}

            {error && (
                <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center">
                    {error}
                </div>
            )}

            {!loading && prediction !== null && (
                <div className="mt-8 p-6 border border-purple-200 dark:border-purple-700 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Resultado del Análisis:</h2>
                    <div className={`text-lg font-semibold ${prediction === 1 ? 'text-red-500' : 'text-green-500'}`}>
                        {prediction === 1 ? "⚠️ Posible TDAH Detectado" : "✅ No se detecta TDAH"}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Nota: Este resultado es una estimación basada en el modelo de IA y no sustituye un diagnóstico profesional.
                    </p>
                </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2"
              >
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
              Procesamiento de Juegos
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Analiza los resultados de Go/No-Go, Stop-Signal y Torre de Londres
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center mb-4">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2"
              >
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
              Cálculo de Probabilidad
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Determina la probabilidad de TDAH basada en criterios DSM-5-TR
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
              Reportes Clínicos
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Genera informes orientativos con métricas cognitivas y conductuales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

