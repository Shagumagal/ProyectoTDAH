import { useMemo } from 'react';
import { Target, Zap, Brain, Trophy, Medal, Shield, Clock, AlertTriangle, Flame, Star, Sparkles, Activity, MousePointer } from 'lucide-react';
import type { ResultadosAlumno } from '../../results/types';

interface InternalProps {
  results: ResultadosAlumno | null;
}

// --- Helper: Stat row with optional bar ---
function StatRow({
  label,
  value,
  barPct,
  barColor = 'bg-indigo-500',
  icon,
  soon = false,
}: {
  label: string;
  value: string;
  barPct?: number;
  barColor?: string;
  icon?: React.ReactNode;
  soon?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          {icon}
          {label}
        </span>
        {soon ? (
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 italic bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Próximamente
          </span>
        ) : (
          <span className="font-bold text-slate-900 dark:text-white">{value}</span>
        )}
      </div>
      {barPct !== undefined && !soon && (
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// --- Helper: Mini stat badge ---
function MiniBadge({ label, value, soon = false }: { label: string; value: string; soon?: boolean }) {
  return (
    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
      <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{label}</p>
      {soon ? (
        <p className="text-xs font-semibold text-slate-400 italic mt-1">Próximo</p>
      ) : (
        <p className="text-base font-black text-slate-700 dark:text-slate-200 mt-1">{value}</p>
      )}
    </div>
  );
}

export default function GamifiedResults({ results }: InternalProps) {
  const stats = useMemo(() => {
    if (!results) return null;
    const { goNoGo, stopSignal, tol } = results;

    // --- 1. Misión: Atención (Go/No-Go) ---
    const gngAcc = (goNoGo.accuracy || 0) * 100;
    const gngSpeed = (goNoGo.medianRT || 0) * 1000;

    let gngRank = 'Aprendiz';
    let gngColor = 'from-amber-400 to-orange-500';
    let gngIcon = <Medal className="w-8 h-8 text-amber-100" />;

    if (gngAcc >= 90) {
      gngRank = 'Leyenda';
      gngColor = 'from-yellow-400 via-amber-300 to-yellow-500';
      gngIcon = <Trophy className="w-8 h-8 text-yellow-50" />;
    } else if (gngAcc >= 75) {
      gngRank = 'Maestro';
      gngColor = 'from-slate-300 to-slate-400';
      gngIcon = <Medal className="w-8 h-8 text-slate-50" />;
    }

    // --- 2. Misión: Control (Stop Signal) ---
    const sstFail = stopSignal.stopFailureRate || stopSignal.commissionRate || 0;
    const sstControl = Math.max(0, (1 - sstFail) * 100);
    const sstReflex = (stopSignal.medianRT || 0) * 1000;

    let sstRank = 'Iniciado';
    let sstColor = 'from-amber-600 to-orange-700';
    let sstIcon = <Medal className="w-8 h-8 text-amber-100" />;

    if (sstControl >= 85) {
      sstRank = 'Imperturbable';
      sstColor = 'from-yellow-400 via-amber-300 to-yellow-600';
      sstIcon = <Trophy className="w-8 h-8 text-yellow-50" />;
    } else if (sstControl >= 70) {
      sstRank = 'Guardián';
      sstColor = 'from-slate-400 to-slate-500';
      sstIcon = <Medal className="w-8 h-8 text-slate-100" />;
    }

    // --- 3. Misión: Estrategia (ToL) ---
    const tolScore = tol ? (tol.planningScore || 0) * 100 : 0;
    const tolTime = tol ? (tol.decisionTime || 0) : 0;

    let tolRank = 'Explorador';
    let tolColor = 'from-violet-500 to-purple-600';
    let tolIcon = <Medal className="w-8 h-8 text-violet-100" />;

    if (tolScore >= 80) {
      tolRank = 'Genio';
      tolColor = 'from-yellow-400 via-amber-300 to-yellow-500';
      tolIcon = <Brain className="w-8 h-8 text-yellow-50" />;
    } else if (tolScore >= 50) {
      tolRank = 'Ingeniero';
      tolColor = 'from-slate-300 to-slate-500';
      tolIcon = <Medal className="w-8 h-8 text-slate-50" />;
    }

    return {
      gng: { rank: gngRank, color: gngColor, icon: gngIcon, acc: gngAcc, speed: gngSpeed },
      sst: { rank: sstRank, color: sstColor, icon: sstIcon, ctrl: sstControl, speed: sstReflex },
      tol: { rank: tolRank, color: tolColor, icon: tolIcon, score: tolScore, time: tolTime, exists: !!tol },
    };
  }, [results]);

  const motivationalMessage = useMemo(() => {
    if (!stats) return null;
    const avg = (stats.gng.acc + stats.sst.ctrl + (stats.tol.exists ? stats.tol.score : 0)) /
                (stats.tol.exists ? 3 : 2);
    if (avg >= 85) return { emoji: '🏆', msg: '¡Increíble! Eres un campeón. Tu concentración y control son de alto nivel. ¡Sigue así!' };
    if (avg >= 70) return { emoji: '⭐', msg: '¡Muy bien hecho! Tienes habilidades muy fuertes. Con un poco más de práctica, ¡serás imbatible!' };
    if (avg >= 50) return { emoji: '💪', msg: '¡Buen trabajo! Cada vez que juegas mejoras. ¡No te rindas, el campeón está dentro de ti!' };
    return { emoji: '🚀', msg: '¡Tú puedes! Esta fue tu primera aventura. Juega más y verás cómo tus poderes crecen cada día.' };
  }, [stats]);

  if (!results || !stats) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-600 dark:text-slate-300">¡Aún no hay trofeos!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Juega para ganar tus primeras medallas.</p>
      </div>
    );
  }

  const xpLevel = Math.round(
    (stats.gng.acc + stats.sst.ctrl + (stats.tol.exists ? stats.tol.score : 0)) /
    (stats.tol.exists ? 3 : 2)
  );

  // Hyperactivity data — may be null
  const hyper = results.goNoGo.hyperactivity;
  const mouseDistanceOk = hyper?.mouseDistance != null && hyper.mouseDistance > 0;
  const freneticOk = hyper?.freneticMovement != null && hyper.freneticMovement > 0;
  const unnecessaryClicksOk = hyper?.unnecessaryClicks != null;
  const clickRateOk = hyper?.clickRate != null;

  return (
    <section className="space-y-8">

      {/* ── BANNER XP ── */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-[2px] shadow-lg">
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
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${xpLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── TROFEOS (3 misiones) ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Sala de Trofeos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: Atención */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.gng.color} opacity-90`} />
            <div className="relative p-6 pt-8 text-center flex flex-col h-full">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.gng.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                {stats.gng.icon}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-md">Misión: Ojo de Águila</div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{stats.gng.rank}</h3>

              <div className="space-y-3 flex-1 text-left">
                <StatRow label="Puntería" value={`${Math.round(stats.gng.acc)}%`} barPct={stats.gng.acc} barColor="bg-indigo-500" icon={<Target className="w-4 h-4 text-indigo-500" />} />
                <StatRow label="Velocidad" value={`${Math.round(stats.gng.speed)} ms`} icon={<Zap className="w-4 h-4 text-amber-500" />} />
                <StatRow label="Anticipaciones" value={`${Math.round((results.goNoGo.fastGuessRate || 0) * 100)}%`} barPct={(results.goNoGo.fastGuessRate || 0) * 100} barColor="bg-orange-400" icon={<Flame className="w-4 h-4 text-orange-400" />} />
                <StatRow label="Lapsos" value={`${Math.round((results.goNoGo.lapsesRate || 0) * 100)}%`} icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />} />

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <MiniBadge label="Omisiones" value={`${Math.round((results.goNoGo.omissionRate || 0) * 100)}%`} />
                  <MiniBadge label="Impulsos" value={`${Math.round((results.goNoGo.commissionRate || 0) * 100)}%`} />
                </div>

                {/* Resistencia: vigilanceDecrement — puede ser null */}
                {results.goNoGo.vigilanceDecrement != null ? (
                  <StatRow
                    label="Resistencia"
                    value={results.goNoGo.vigilanceDecrement <= 0.1 ? '💪 Alta' : results.goNoGo.vigilanceDecrement <= 0.25 ? '👍 Media' : '⚠️ Baja'}
                    icon={<Activity className="w-4 h-4 text-emerald-500" />}
                  />
                ) : (
                  <StatRow label="Resistencia" value="" soon icon={<Activity className="w-4 h-4 text-emerald-500" />} />
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: Control */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.sst.color} opacity-90`} />
            <div className="relative p-6 pt-8 text-center flex flex-col h-full">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.sst.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                {stats.sst.icon}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-md">Misión: Mente Zen</div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{stats.sst.rank}</h3>

              <div className="space-y-3 flex-1 text-left">
                <StatRow label="Control" value={`${Math.round(stats.sst.ctrl)}%`} barPct={stats.sst.ctrl} barColor="bg-emerald-500" icon={<Shield className="w-4 h-4 text-emerald-500" />} />
                <StatRow label="Reflejos" value={`${Math.round(stats.sst.speed)} ms`} icon={<Zap className="w-4 h-4 text-amber-500" />} />

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <MiniBadge label="Frenado" value={`${Math.round((results.stopSignal?.ssrt || 0) * 1000)}ms`} />
                  <MiniBadge label="Fallos Stop" value={`${Math.round((results.stopSignal?.stopFailureRate || 0) * 100)}%`} />
                  <MiniBadge label="SSD Prom." value={results.stopSignal?.ssdAverage != null ? `${Math.round(results.stopSignal.ssdAverage)}ms` : '—'} />
                  <MiniBadge label="Omisiones" value={`${Math.round((results.stopSignal.omissionRate || 0) * 100)}%`} />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Estrategia (condicional) */}
          {stats.tol.exists ? (
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.tol.color} opacity-90`} />
              <div className="relative p-6 pt-8 text-center flex flex-col h-full">
                <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.tol.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                  {stats.tol.icon}
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow-md">Misión: Arquitecto</div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{stats.tol.rank}</h3>

                <div className="space-y-3 flex-1 text-left">
                  <StatRow label="Ingeniería" value={`${Math.round(stats.tol.score)} pts`} barPct={stats.tol.score} barColor="bg-purple-500" icon={<Brain className="w-4 h-4 text-purple-500" />} />
                  <StatRow label="Tiempo Total" value={`${Math.round(stats.tol.time)} s`} icon={<Clock className="w-4 h-4 text-blue-400" />} />

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <MiniBadge label="Planificación" value={`${Math.round(results.tol?.planLatency || 0)}s`} />
                    <MiniBadge label="Mov. Extra" value={`${results.tol?.excessMoves ?? 0}`} />
                    <MiniBadge label="Reglas Rotas" value={`${results.tol?.ruleViolations ?? 0}`} />
                    <MiniBadge
                      label="Decisión"
                      value={results.tol?.decisionTime != null ? `${Math.round(results.tol.decisionTime)}s` : '—'}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-8 opacity-70">
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
      </div>

      {/* ── SECCIÓN ENERGÍA (Hiperactividad) ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
            <Activity className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Análisis de Energía</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cómo te moviste durante el juego</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Distancia (nulo → pronto) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider text-center">Movimiento Total</p>
            {mouseDistanceOk ? (
              <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round((hyper!.mouseDistance! / 1000))}k</p>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Próximamente</span>
            )}
            <p className="text-[10px] text-slate-400">píxeles</p>
          </div>

          {/* Movimiento Frenético (nulo → pronto) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider text-center">Impulso</p>
            {freneticOk ? (
              <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round((hyper!.freneticMovement! || 0) * 100)}%</p>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Próximamente</span>
            )}
            <p className="text-[10px] text-slate-400">mov. frenético</p>
          </div>

          {/* Clicks innecesarios */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider text-center">Clicks Extra</p>
            {unnecessaryClicksOk ? (
              <p className="text-2xl font-black text-slate-800 dark:text-white">{hyper!.unnecessaryClicks ?? 0}</p>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Próximamente</span>
            )}
            <p className="text-[10px] text-slate-400">clicks innecesarios</p>
          </div>

          {/* Click Rate / Ritmo */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider text-center">Ritmo</p>
            {clickRateOk ? (
              <p className="text-2xl font-black text-slate-800 dark:text-white">{((hyper!.clickRate ?? 0)).toFixed(1)}</p>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Próximamente</span>
            )}
            <p className="text-[10px] text-slate-400">clicks / seg</p>
          </div>
        </div>
      </div>

      {/* ── FRASE MOTIVADORA ── */}
      {motivationalMessage && (
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 flex items-center gap-5">
          <div className="text-5xl select-none shrink-0">{motivationalMessage.emoji}</div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white text-lg mb-1">¡Mensaje de tu entrenador!</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{motivationalMessage.msg}</p>
          </div>
        </div>
      )}

    </section>
  );
}
