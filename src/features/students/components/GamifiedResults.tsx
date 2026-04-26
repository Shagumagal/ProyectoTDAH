import { useMemo } from 'react';
import { Target, Zap, Brain, Trophy, Medal, Shield, Clock } from 'lucide-react';
import type { ResultadosAlumno } from '../../results/types';

interface InternalProps {
  results: ResultadosAlumno | null;
}

export default function GamifiedResults({ results }: InternalProps) {
  const stats = useMemo(() => {
    if (!results) return null;
    const { goNoGo, stopSignal, tol } = results;

    // --- 1. Misión: Atención (Go/No-Go) ---
    // Puntería = Accuracy
    const gngAcc = (goNoGo.accuracy || 0) * 100;
    // Velocidad = RT (ms)
    const gngSpeed = (goNoGo.medianRT || 0) * 1000;
    
    let gngRank = "Aprendiz";
    let gngColor = "from-amber-400 to-orange-500"; // Bronce
    let gngIcon = <Medal className="w-8 h-8 text-amber-100" />;
    
    if (gngAcc >= 90) {
      gngRank = "Leyenda"; // Oro
      gngColor = "from-yellow-400 via-amber-300 to-yellow-500";
      gngIcon = <Trophy className="w-8 h-8 text-yellow-50" />;
    } else if (gngAcc >= 75) {
      gngRank = "Maestro"; // Plata
      gngColor = "from-slate-300 to-slate-400";
      gngIcon = <Medal className="w-8 h-8 text-slate-50" />;
    }

    // --- 2. Misión: Control (Stop Signal) ---
    // Control = 1 - StopFailureRate (aprox) o Accuracy?
    // En SST, primary outcome is SSRT but for kids, "Success on Stop" is easier.
    // Usaremos (1 - commissionRate) si commissionRate es "falta de inhibición".
    // stopSignal.commissionRate (o stopFailureRate)
    const sstFail = stopSignal.stopFailureRate || stopSignal.commissionRate || 0;
    const sstControl = Math.max(0, (1 - sstFail) * 100);
    const sstReflex = (stopSignal.medianRT || 0) * 1000;

    let sstRank = "Iniciado";
    let sstColor = "from-amber-600 to-orange-700";
    let sstIcon = <Medal className="w-8 h-8 text-amber-100" />;

    if (sstControl >= 85) {
      sstRank = "Imperturbable";
      sstColor = "from-yellow-400 via-amber-300 to-yellow-600 shadow-yellow-500/50";
      sstIcon = <Trophy className="w-8 h-8 text-yellow-50" />;
    } else if (sstControl >= 70) {
      sstRank = "Guardián";
      sstColor = "from-slate-400 to-slate-500";
      sstIcon = <Medal className="w-8 h-8 text-slate-100" />;
    }

    // --- 3. Misión: Estrategia (ToL) ---
    // Tol Planning Score (0-1) or Sequence Compliance
    const tolScore = tol ? (tol.planningScore || 0) * 100 : 0;
    const tolTime = tol ? (tol.decisionTime || 0) : 0; // s

    let tolRank = "Explorador";
    let tolColor = "from-orange-400 to-red-500";
    let tolIcon = <Medal className="w-8 h-8 text-orange-100" />;

    if (tolScore >= 80) {
      tolRank = "Genio";
      tolColor = "from-yellow-400 via-amber-300 to-yellow-500";
      tolIcon = <Brain className="w-8 h-8 text-yellow-50" />;
    } else if (tolScore >= 50) {
      tolRank = "Ingeniero";
      tolColor = "from-slate-300 to-slate-500";
      tolIcon = <Medal className="w-8 h-8 text-slate-50" />;
    }

    return {
      gng: { rank: gngRank, color: gngColor, icon: gngIcon, acc: gngAcc, speed: gngSpeed },
      sst: { rank: sstRank, color: sstColor, icon: sstIcon, ctrl: sstControl, speed: sstReflex },
      tol: { rank: tolRank, color: tolColor, icon: tolIcon, score: tolScore, time: tolTime, exists: !!tol },
    };
  }, [results]);

  if (!results || !stats) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-400">Aún no hay resultados disponibles. ¡Juega para ganar trofeos!</p>
      </div>
    );
  }

  const xpLevel = Math.round(
    (stats.gng.acc + stats.sst.ctrl + (stats.tol.exists ? stats.tol.score : 0)) / 
    (stats.tol.exists ? 3 : 2)
  );

  return (
    <section className="space-y-8 animate-fade-in">
      {/* Resumen Global (Nivel/Puntuación) */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-1 shadow-lg">
        <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                 <Zap className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Energía Total</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Puntaje promedio de tus misiones</p>
              </div>
           </div>
           
           <div className="flex-1 w-full max-w-md">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Nivel de Habilidad</span>
                 <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">
                    {xpLevel} / 100
                 </span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: `${xpLevel}%` }} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: ATENCIÓN */}
        <div className="relative overflow-hidden group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.gng.color} opacity-90`} />
          
          <div className="relative p-6 pt-8 text-center flex flex-col h-full">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.gng.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
              {stats.gng.icon}
            </div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-md">Misión: Ojo de Águila</div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{stats.gng.rank}</h3>
            
            <div className="mt-6 space-y-4 flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Target className="w-4 h-4 text-indigo-500" /> Puntería</span>
                  <span className="font-bold text-slate-900 dark:text-white">{Math.round(stats.gng.acc)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats.gng.acc}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Zap className="w-3 h-3" /> Velocidad
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(stats.gng.speed)} ms</span>
              </div>
              
               {/* Detail Stats */}
               <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Omisiones</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round((results?.goNoGo.omissionRate || 0) * 100)}%
                    </p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Impulsos</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round((results?.goNoGo.commissionRate || 0) * 100)}%
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: CONTROL */}
        <div className="relative overflow-hidden group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.sst.color} opacity-90`} />
          
          <div className="relative p-6 pt-8 text-center flex flex-col h-full">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.sst.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
              {stats.sst.icon}
            </div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-md">Misión: Mente Zen</div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{stats.sst.rank}</h3>
            
            <div className="mt-6 space-y-4 flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Shield className="w-4 h-4 text-emerald-500" /> Control</span>
                  <span className="font-bold text-slate-900 dark:text-white">{Math.round(stats.sst.ctrl)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.sst.ctrl}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Zap className="w-3 h-3" /> Reflejos
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(stats.sst.speed)} ms</span>
              </div>

               {/* Detail Stats */}
               <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Frenado (SSRT)</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round((results?.stopSignal?.ssrt || 0) * 1000)}ms
                    </p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Fallos</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round((results?.stopSignal?.stopFailureRate || 0) * 100)}%
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: ESTRATEGIA (Si existe) */}
        {stats.tol.exists ? (
          <div className="relative overflow-hidden group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.tol.color} opacity-90`} />
            
            <div className="relative p-6 pt-8 text-center flex flex-col h-full">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.tol.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                {stats.tol.icon}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-md">Misión: Arquitecto</div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{stats.tol.rank}</h3>
              
              <div className="mt-6 space-y-4 flex-1">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Brain className="w-4 h-4 text-purple-500" /> Ingeniería</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(stats.tol.score)} pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, stats.tol.score)}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" /> Tiempo Total
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(stats.tol.time)} s</span>
                </div>

                {/* Detail Stats */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Planificación</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round((results?.tol?.planLatency || 0))}s
                    </p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Mov. Extra</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {results?.tol?.excessMoves || 0}
                    </p>
                  </div>
               </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 border-dashed flex items-center justify-center p-8 opacity-70">
             <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                   <Brain className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">Torre Bloqueada</h3>
                <p className="text-sm text-slate-500 mt-1">Juega "Torres" para desbloquear</p>
             </div>
          </div>
        )}

      </div>
    </section>
  );
}
