import { useMemo } from 'react';
import { Target, Zap, Brain, Trophy, Medal, Shield, Clock, Star, Activity, TrendingUp, Sprout, Hand, Eye, Lightbulb } from 'lucide-react';
import type { ResultadosAlumno, GameBase } from '../../results/types';

// ¿El alumno jugó este juego? El backend envía `played`; si es una versión anterior
// sin ese campo, un juego sin partidas llega con todo en cero.
function wasPlayed(g: GameBase | undefined): boolean {
  if (!g) return false;
  if (typeof g.played === 'boolean') return g.played;
  return (g.accuracy || 0) > 0 || (g.medianRT || 0) > 0 || (g.commissionRate || 0) > 0 || (g.omissionRate || 0) > 0;
}

// Tarjeta de misión sin partidas (mismo estilo que tenía "Torre Bloqueada")
function LockedCard({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-8 opacity-70">
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{hint}</p>
      </div>
    </div>
  );
}

/* ---------- Textos para niños de primaria (sin %, ms ni decimales) ---------- */

// Proporción 0–1 → "X de cada 10"
function outOfTen(rate: number) {
  const n = Number.isFinite(rate) ? rate : 0;
  return Math.round(Math.min(1, Math.max(0, n)) * 10);
}

// Tiempo de reacción en ms → palabra. Cortes orientativos; las tres opciones son positivas.
function speedWord(ms: number) {
  if (!ms || ms <= 0) return '—';
  if (ms < 500) return '¡Rapidísimo!';
  if (ms < 800) return '¡Rápido!';
  return 'Con calma';
}

// Proporción de veces que lo hizo bien (0–1) → frecuencia en palabras, sin "nunca"
function freqWord(rate: number) {
  const n = Number.isFinite(rate) ? rate : 0;
  if (n >= 0.9) return 'siempre';
  if (n >= 0.7) return 'casi siempre';
  if (n >= 0.4) return 'muchas veces';
  return 'a veces';
}

function seconds(s: number | undefined) {
  if (s == null || !Number.isFinite(s) || s <= 0) return '—';
  const n = Math.max(1, Math.round(s));
  return n === 1 ? '1 segundo' : `${n} segundos`;
}

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
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
          {icon}
          {label}
        </span>
        {soon ? (
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 italic bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Próximamente
          </span>
        ) : (
          <span className="font-bold text-slate-900 dark:text-white text-right shrink-0">{value}</span>
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
    // Se usa la precisión global (aciertos / intentos). "1 - stopFailureRate" inflaba el
    // resultado porque el backend calcula los fallos sobre todos los intentos, no solo los de stop.
    const sstControl = Math.max(0, Math.min(100, (stopSignal.accuracy || 0) * 100));
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

    const gngPlayed = wasPlayed(goNoGo);
    const sstPlayed = wasPlayed(stopSignal);

    // Promedio solo de las misiones realmente jugadas (escala 0–100)
    const playedScores = [
      gngPlayed ? gngAcc : null,
      sstPlayed ? sstControl : null,
      tol ? tolScore : null,
    ].filter((v): v is number => v !== null);
    const avg = playedScores.length
      ? playedScores.reduce((s, v) => s + v, 0) / playedScores.length
      : null;

    return {
      gng: { rank: gngRank, color: gngColor, icon: gngIcon, acc: gngAcc, speed: gngSpeed, played: gngPlayed },
      sst: { rank: sstRank, color: sstColor, icon: sstIcon, ctrl: sstControl, speed: sstReflex, played: sstPlayed },
      tol: { rank: tolRank, color: tolColor, icon: tolIcon, score: tolScore, time: tolTime, exists: !!tol },
      avg,
    };
  }, [results]);

  const motivationalMessage = useMemo(() => {
    if (!stats || stats.avg === null) return null;
    const avg = stats.avg;
    // Clases completas (no interpoladas) para que Tailwind las detecte
    if (avg >= 85) return {
      icon: <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      tile: 'bg-amber-100 dark:bg-amber-900/30',
      accent: 'bg-amber-400',
      msg: '¡Lo hiciste increíble! Estuviste muy atento y concentrado. ¡Sigue así!',
    };
    if (avg >= 70) return {
      icon: <Star className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      tile: 'bg-indigo-100 dark:bg-indigo-900/30',
      accent: 'bg-indigo-400',
      msg: '¡Muy bien hecho! Te fue muy bien en tus misiones. Con un poco más de práctica te saldrá aún mejor.',
    };
    if (avg >= 50) return {
      icon: <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tile: 'bg-emerald-100 dark:bg-emerald-900/30',
      accent: 'bg-emerald-400',
      msg: '¡Buen trabajo! Cada vez que juegas vas mejorando. ¡Sigue practicando!',
    };
    return {
      icon: <Sprout className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      tile: 'bg-teal-100 dark:bg-teal-900/30',
      accent: 'bg-teal-400',
      msg: '¡Buen intento! Cada vez que juegas, practicas. Vuelve a jugar y verás cómo mejoras.',
    };
  }, [stats]);

  if (!results || !stats || stats.avg === null) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-600 dark:text-slate-300">¡Aún no hay trofeos!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Juega para ganar tus primeras medallas.</p>
      </div>
    );
  }

  const xpLevel = Math.round(stats.avg);

  // El movimiento del ratón solo se captura en Planificación (Torre de Londres)
  const tolClicks = results.tol?.hyperactivity?.unnecessaryClicks;

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
              <p className="text-sm text-slate-500 dark:text-slate-400">Puntaje promedio de tus juegos</p>
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
          {!stats.gng.played ? (
            <LockedCard icon={<Target className="w-8 h-8 text-slate-400" />} title="Juego Bloqueado" hint='Juega "Go/No-Go" para desbloquear' />
          ) : (
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.gng.color} opacity-90`} />
            <div className="relative p-6 pt-8 text-center flex flex-col h-full">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.gng.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                {stats.gng.icon}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Juego: Go/No-Go</div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{stats.gng.rank}</h3>

              <div className="space-y-3 flex-1 text-left">
                <StatRow label="Atrapaste" value={`${outOfTen(stats.gng.acc / 100)} de cada 10`} barPct={stats.gng.acc} barColor="bg-indigo-500" icon={<Target className="w-4 h-4 text-indigo-500" />} />
                <StatRow label="Rapidez" value={speedWord(stats.gng.speed)} icon={<Zap className="w-4 h-4 text-amber-500" />} />
                <StatRow label="Esperaste la señal" value={freqWord(1 - (results.goNoGo.fastGuessRate || 0))} icon={<Hand className="w-4 h-4 text-orange-400" />} />
                <StatRow label="Estuviste atento" value={freqWord(1 - (results.goNoGo.lapsesRate || 0))} icon={<Eye className="w-4 h-4 text-sky-500" />} />

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <MiniBadge label="Se te escaparon" value={`${outOfTen(results.goNoGo.omissionRate || 0)} de 10`} />
                  <MiniBadge label="Tocaste sin querer" value={`${outOfTen(results.goNoGo.commissionRate || 0)} de 10`} />
                </div>

                {results.goNoGo.vigilanceDecrement != null && (
                  <StatRow
                    label="Energía hasta el final"
                    value={results.goNoGo.vigilanceDecrement <= 0.1 ? '¡Mucha!' : results.goNoGo.vigilanceDecrement <= 0.25 ? 'Buena' : 'Te cansaste un poco'}
                    icon={<Activity className="w-4 h-4 text-emerald-500" />}
                  />
                )}
              </div>
            </div>
          </div>
          )}

          {/* CARD 2: Control */}
          {!stats.sst.played ? (
            <LockedCard icon={<Shield className="w-8 h-8 text-slate-400" />} title="Juego Bloqueado" hint='Juega "Semáforo" para desbloquear' />
          ) : (
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.sst.color} opacity-90`} />
            <div className="relative p-6 pt-8 text-center flex flex-col h-full">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.sst.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                {stats.sst.icon}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Juego: Semáforo</div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{stats.sst.rank}</h3>

              <div className="space-y-3 flex-1 text-left">
                <StatRow label="Acertaste" value={`${outOfTen(stats.sst.ctrl / 100)} de cada 10`} barPct={stats.sst.ctrl} barColor="bg-emerald-500" icon={<Shield className="w-4 h-4 text-emerald-500" />} />
                <StatRow label="Reflejos" value={speedWord(stats.sst.speed)} icon={<Zap className="w-4 h-4 text-amber-500" />} />

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <MiniBadge label="No frenaste" value={`${outOfTen(results.stopSignal.commissionRate || 0)} de 10`} />
                  <MiniBadge label="Se te escaparon" value={`${outOfTen(results.stopSignal.omissionRate || 0)} de 10`} />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* CARD 3: Estrategia (condicional) */}
          {stats.tol.exists ? (
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${stats.tol.color} opacity-90`} />
              <div className="relative p-6 pt-8 text-center flex flex-col h-full">
                <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${stats.tol.color} shadow-lg flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                  {stats.tol.icon}
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Juego: Planificación</div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{stats.tol.rank}</h3>

                <div className="space-y-3 flex-1 text-left">
                  <StatRow label="Puntos de constructor" value={`${Math.round(stats.tol.score)} de 100`} barPct={stats.tol.score} barColor="bg-purple-500" icon={<Brain className="w-4 h-4 text-purple-500" />} />
                  <StatRow label="Pensaste antes de mover" value={seconds(results.tol?.planLatency)} icon={<Lightbulb className="w-4 h-4 text-amber-500" />} />
                  <StatRow label="Tiempo por jugada" value={seconds(stats.tol.time)} icon={<Clock className="w-4 h-4 text-blue-400" />} />

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <MiniBadge label="Pasos fuera de orden" value={`${results.tol?.excessMoves ?? 0}`} />
                    <MiniBadge label="Clics de más" value={tolClicks != null ? `${tolClicks}` : '—'} />
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
                <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">Juego Bloqueado</h3>
                <p className="text-sm text-slate-500 mt-1">Juega "Planificación" para desbloquear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FRASE MOTIVADORA ── */}
      {motivationalMessage && (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 pl-6 flex items-start gap-4 shadow-sm">
          <div className={`absolute left-0 inset-y-0 w-1 ${motivationalMessage.accent}`} />
          <div className={`w-11 h-11 rounded-xl ${motivationalMessage.tile} flex items-center justify-center shrink-0`}>
            {motivationalMessage.icon}
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Mensaje de tu entrenador</p>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{motivationalMessage.msg}</p>
          </div>
        </div>
      )}

    </section>
  );
}
