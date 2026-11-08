import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Target, Shield, Brain, Star, Lock, Trophy, TrendingUp, Sprout } from 'lucide-react';
import type { ResultadosAlumno, GameBase } from '../../results/types';

interface InternalProps {
  results: ResultadosAlumno | null;
}

type MissionKey = 'gng' | 'sst' | 'tol';

type Mission = {
  key: MissionKey;
  name: string;
  played: boolean;
  score: number; // 0–1, solo tiene sentido si played
  detail: string;
};

// Clases completas (no interpoladas) para que Tailwind las detecte. Un color por juego.
const THEME: Record<MissionKey, { icon: ReactNode; tile: string; bar: string }> = {
  gng: {
    icon: <Target className="w-7 h-7 text-sky-600 dark:text-sky-400" />,
    tile: 'bg-sky-100 dark:bg-sky-900/30',
    bar: 'bg-sky-400',
  },
  sst: {
    icon: <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
    tile: 'bg-emerald-100 dark:bg-emerald-900/30',
    bar: 'bg-emerald-400',
  },
  tol: {
    icon: <Brain className="w-7 h-7 text-violet-600 dark:text-violet-400" />,
    tile: 'bg-violet-100 dark:bg-violet-900/30',
    bar: 'bg-violet-400',
  },
};

const PRAISE: Record<1 | 2 | 3, string> = {
  3: '¡Increíble!',
  2: '¡Muy bien!',
  1: '¡Buen comienzo!',
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

// Completar la misión siempre da al menos 1 estrella: se premia participar, no se castiga.
function starsFor(score: number): 1 | 2 | 3 {
  if (score >= 0.85) return 3;
  if (score >= 0.6) return 2;
  return 1;
}

// Compatibilidad con un backend que aún no envía `played`: si todo viene en cero, no se jugó.
function wasPlayed(g: GameBase | undefined): boolean {
  if (!g) return false;
  if (typeof g.played === 'boolean') return g.played;
  return (g.accuracy || 0) > 0 || (g.medianRT || 0) > 0 || (g.commissionRate || 0) > 0 || (g.omissionRate || 0) > 0;
}

function outOfTen(score: number) {
  return Math.round(clamp01(score) * 10);
}

function MissionCard({ mission }: { mission: Mission }) {
  const theme = THEME[mission.key];

  if (!mission.played) {
    return (
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Misión</p>
        <h3 className="text-xl font-black text-slate-500 dark:text-slate-400">{mission.name}</h3>
        <p className="mt-4 font-bold text-slate-500 dark:text-slate-400">Misión pendiente</p>
        <p className="text-sm text-slate-400 mt-1">Juega esta misión para ganar tus estrellas.</p>
      </div>
    );
  }

  const stars = starsFor(mission.score);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center">
      <div className={`absolute top-0 inset-x-0 h-1 ${theme.bar}`} />
      <div className={`w-14 h-14 rounded-2xl ${theme.tile} flex items-center justify-center mb-3`}>
        {theme.icon}
      </div>
      <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Misión</p>
      <h3 className="text-xl font-black text-slate-800 dark:text-white">{mission.name}</h3>

      <div className="flex gap-1 my-4" role="img" aria-label={`${stars} de 3 estrellas`}>
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={`w-9 h-9 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
          />
        ))}
      </div>

      <p className="font-bold text-slate-800 dark:text-white">{PRAISE[stars]}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{mission.detail}</p>
    </div>
  );
}

export default function GamifiedResults({ results }: InternalProps) {
  const missions = useMemo<Mission[] | null>(() => {
    if (!results) return null;
    const { goNoGo, stopSignal, tol } = results;

    const gngScore = clamp01(goNoGo?.accuracy ?? 0);
    const sstScore = clamp01(stopSignal?.accuracy ?? 0);
    const tolScore = clamp01(tol?.planningScore ?? 0);

    return [
      {
        key: 'gng',
        name: 'Ojo de Águila',
        played: wasPlayed(goNoGo),
        score: gngScore,
        detail: `Acertaste ${outOfTen(gngScore)} de cada 10.`,
      },
      {
        key: 'sst',
        name: 'Mente Zen',
        played: wasPlayed(stopSignal),
        score: sstScore,
        detail: `Acertaste ${outOfTen(sstScore)} de cada 10.`,
      },
      {
        key: 'tol',
        name: 'Arquitecto',
        played: !!tol,
        score: tolScore,
        detail: `Conseguiste ${Math.round(tolScore * 100)} de 100 puntos.`,
      },
    ];
  }, [results]);

  const played = useMemo(() => missions?.filter((m) => m.played) ?? [], [missions]);

  const coach = useMemo(() => {
    if (played.length === 0) return null;
    // Promedio solo de las misiones jugadas
    const avg = played.reduce((s, m) => s + m.score, 0) / played.length;
    if (avg >= 0.85) return {
      icon: <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      tile: 'bg-amber-100 dark:bg-amber-900/30',
      accent: 'bg-amber-400',
      msg: '¡Lo hiciste increíble! Estuviste muy atento y concentrado. ¡Sigue así!',
    };
    if (avg >= 0.7) return {
      icon: <Star className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      tile: 'bg-indigo-100 dark:bg-indigo-900/30',
      accent: 'bg-indigo-400',
      msg: '¡Muy bien hecho! Te fue muy bien en tus misiones. Con un poco más de práctica te saldrá aún mejor.',
    };
    if (avg >= 0.5) return {
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
  }, [played]);

  if (!missions || played.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-600 dark:text-slate-300">¡Aún no hay trofeos!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Juega para ganar tus primeras estrellas.</p>
      </div>
    );
  }

  const totalStars = played.reduce((s, m) => s + starsFor(m.score), 0);

  return (
    <section className="space-y-8">

      {/* ── RESUMEN ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Misiones completadas</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            {played.length} <span className="text-lg font-bold text-slate-400">de {missions.length}</span>
          </p>
          <div className="flex gap-2 mt-3" aria-hidden>
            {missions.map((m) => (
              <div
                key={m.key}
                className={`h-2 w-12 rounded-full ${m.played ? THEME[m.key].bar : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Star className="w-10 h-10 text-amber-400 fill-amber-400" aria-hidden />
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Estrellas ganadas</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              {totalStars} <span className="text-lg font-bold text-slate-400">de {missions.length * 3}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── MISIONES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {missions.map((m) => (
          <MissionCard key={m.key} mission={m} />
        ))}
      </div>

      {/* ── MENSAJE DEL ENTRENADOR ── */}
      {coach && (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 pl-6 flex items-start gap-4 shadow-sm">
          <div className={`absolute left-0 inset-y-0 w-1 ${coach.accent}`} />
          <div className={`w-11 h-11 rounded-xl ${coach.tile} flex items-center justify-center shrink-0`}>
            {coach.icon}
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Mensaje de tu entrenador</p>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{coach.msg}</p>
          </div>
        </div>
      )}

    </section>
  );
}
