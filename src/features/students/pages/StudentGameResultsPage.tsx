import { useEffect, useState, useMemo } from "react";
import { getStudentResults } from "../../results/services/results.service";
import GamifiedResults from "../components/GamifiedResults";
import type { ResultadosAlumno } from "../../results/types";
import { Loader2 } from "lucide-react";

export default function StudentGameResultsPage() {
  const [data, setData] = useState<ResultadosAlumno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get name from token (fallback if API doesn't return it or simply for display)
  const studentName = useMemo(() => {
    try {
      const t = localStorage.getItem("auth_token");
      if (!t) return "Estudiante";
      const base64 = t.split(".")[1];
      const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decodeURIComponent(escape(json))).name || "Estudiante";
    } catch { return "Estudiante"; }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Without ID -> fetches current user's results
        const result = await getStudentResults();
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error al cargar resultados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900 mx-4 mt-8">
        <p className="font-bold">No pudimos cargar tus trofeos</p>
        <p className="text-sm mt-1 opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto space-y-8">
      {/* Header Personalizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
             Mi Sala de Trofeos
           </h1>
           <p className="text-slate-600 dark:text-slate-300">
             ¡Mira tu progreso y colecciona todas las medallas!
           </p>
        </div>

        {/* User Card (Style requested) */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="size-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Estudiante</p>
                {/* Prefer Name from API data if available, else token */}
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {data?.alumno?.nombre || studentName}
                </p>
            </div>
        </div>
      </div>

      <GamifiedResults results={data} />
    </div>
  );
}
