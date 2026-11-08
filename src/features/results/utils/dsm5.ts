import type { ResultadosAlumno, Evidence } from "../types";

/* =========================
   Umbrales/Reglas
   ========================= */
export const RULES = {
  commission: { weak: 0.12, mod: 0.18, strong: 0.28 },
  omission:   { weak: 0.10, mod: 0.18, strong: 0.28 },
  cvRT:       { weak: 0.18, mod: 0.24, strong: 0.30 },
  vigDec:     { weak: 0.06, mod: 0.10, strong: 0.16 },
  stopFail:   { weak: 0.30, mod: 0.40, strong: 0.50 },
  stroopDelta:{ weak: 0.15, mod: 0.25, strong: 0.35 },
  tolMoves:   { weak: 1, mod: 2, strong: 4 },
  // Umbrales de la Torre de Londres clásica (en pantalla). No se usan para el riesgo de la
  // Planificación 3D: allí la "latencia" incluye caminar hasta el animal y llevarlo (siempre > 6 s).
  planLatency:{ weak: 2.5, mod: 4.0, strong: 6.0 },
};

/**
 * Análisis de actividad motora (ratón/teclado) oculto de momento: la telemetría aún no es fiable
 * en el juego en primera persona. Mientras esté en false no se muestra (panel, PDF, resumen del
 * alumno) ni cuenta como evidencia en los criterios DSM-5. Los datos se siguen guardando.
 */
export const SHOW_MOTOR_ANALYSIS = false;

/**
 * Evidencia de la Planificación (juego 3D de la granja).
 * Se basa solo en los errores de orden (excessMoves = sequence_errors, calculado con LCS):
 * 0 = sin evidencia, 1 = débil, 2–3 = moderada, 4 o más = fuerte.
 * La latencia no entra porque en 3D mide desplazamiento, no tiempo de planificación.
 */
export function tolEvidence(tl?: { excessMoves?: number } | null): Evidence {
  if (!tl) return "sin";
  return scoreToEvidence(tl.excessMoves ?? 0, RULES.tolMoves);
}

export function scoreToEvidence(value: number, bands: { weak: number; mod: number; strong: number }): Evidence {
  if (value >= bands.strong) return "fuerte";
  if (value >= bands.mod)    return "moderada";
  if (value >= bands.weak)   return "debil";
  return "sin";
}

export function maxEvidence(evs: Evidence[]): Evidence {
  if (evs.includes("fuerte"))   return "fuerte";
  if (evs.includes("moderada")) return "moderada";
  if (evs.includes("debil"))    return "debil";
  return "sin";
}

/* =========================
   Mapeo DSM-5 heurístico
   ========================= */
export type Criterio = {
  id: string;
  dominio: "Desatención" | "Hiperactividad/Impulsividad";
  label: string;
  medidoPor: string[];
  evidencia: Evidence;
  nota?: string;
};

export function inferDSM5(r: ResultadosAlumno): Criterio[] {
  const g = r.goNoGo, s = r.stopSignal, tl = r.tol;

  const evCommission = scoreToEvidence(((g?.commissionRate ?? 0) + (s?.commissionRate ?? 0)) / 2, RULES.commission);
  const evOmission   = scoreToEvidence(((g?.omissionRate   ?? 0) + (s?.omissionRate   ?? 0)) / 2, RULES.omission);
  const evCV         = scoreToEvidence(Math.max(g?.cvRT ?? 0, s?.cvRT ?? 0), RULES.cvRT);
  const evVig        = scoreToEvidence(g?.vigilanceDecrement ?? 0, RULES.vigDec);
  const evStop       = scoreToEvidence(s?.stopFailureRate ?? 0, RULES.stopFail);
  const evOrg: Evidence = tolEvidence(tl);

  const h = SHOW_MOTOR_ANALYSIS ? (tl?.hyperactivity ?? g?.hyperactivity ?? s?.hyperactivity) : undefined;
  const evFrenetic = scoreToEvidence(h?.freneticMovement ?? 0, { weak: 0.15, mod: 0.30, strong: 0.50 });
  const evUnnecClicks = scoreToEvidence(h?.unnecessaryClicks ?? 0, { weak: 3, mod: 6, strong: 12 });
  const evHyperMotor = maxEvidence([evFrenetic, evUnnecClicks]);
  const evFastGuess = scoreToEvidence(g?.fastGuessRate ?? 0, { weak: 0.04, mod: 0.07, strong: 0.12 });

  const A1: Criterio[] = [
    { id: "A1-1", dominio: "Desatención", label: "Comete errores por descuido / falta de atención a detalles",
      medidoPor: ["Comisiones (Go/No-Go)", "Comisiones (Stop)"],
      evidencia: maxEvidence([evCommission]),
      nota: "Comisiones sugieren fallos de control de respuesta y atención a detalles.",
    },
    { id: "A1-2", dominio: "Desatención", label: "Dificultad para mantener la atención",
      medidoPor: ["CV-RT (variabilidad)", "Vigilance decrement"],
      evidencia: maxEvidence([evCV, evVig]),
    },
    { id: "A1-3", dominio: "Desatención", label: "Parece no escuchar cuando se le habla directamente",
      medidoPor: ["Omisiones (Go/No-Go, Stop)"], evidencia: evOmission,
      nota: "Omisiones elevadas pueden reflejar desconexión atencional.",
    },
    { id: "A1-4", dominio: "Desatención", label: "No sigue instrucciones / no termina tareas",
      medidoPor: ["Vigilance decrement", "Omisiones tardías"], evidencia: evVig },
    { id: "A1-5", dominio: "Desatención", label: "Dificultad para organizar tareas/actividades",
      medidoPor: ["Torre de Londres: movimientos extra / latencia de planificación"], evidencia: evOrg },
    { id: "A1-6", dominio: "Desatención", label: "Evita tareas que requieren esfuerzo mental sostenido",
      medidoPor: ["Vigilance decrement"], evidencia: evVig },
    { id: "A1-7", dominio: "Desatención", label: "Pierde cosas necesarias para tareas",
      medidoPor: ["Stop"], evidencia: "sin" },
    { id: "A1-8", dominio: "Desatención", label: "Se distrae fácilmente por estímulos externos",
      medidoPor: ["CV-RT", "p95 RT"], evidencia: evCV },
    { id: "A1-9", dominio: "Desatención", label: "Olvida actividades diarias",
      medidoPor: ["No medido por juegos actuales"], evidencia: "sin" },
  ];

  const A2: Criterio[] = [
    { id: "A2-1", dominio: "Hiperactividad/Impulsividad", label: "Se mueve inquieto con manos/pies",
      medidoPor: ["Movimiento errático del cursor", "Clics innecesarios (Fidgeting)"],
      evidencia: evHyperMotor,
      nota: "Evaluado mediante telemetría cinemática del ratón y pulsaciones sin función en el juego.",
    },
    { id: "A2-2", dominio: "Hiperactividad/Impulsividad", label: "Se levanta cuando debe estar sentado", medidoPor: ["Observación en aula"], evidencia: "sin" },
    { id: "A2-3", dominio: "Hiperactividad/Impulsividad", label: "Corre o trepa inapropiadamente", medidoPor: ["Observación en aula"], evidencia: "sin" },
    { id: "A2-4", dominio: "Hiperactividad/Impulsividad", label: "Incapaz de jugar tranquilamente",
      medidoPor: ["Clics innecesarios (Fidgeting)", "Anticipaciones (Fast guesses)"],
      evidencia: maxEvidence([evUnnecClicks, evFastGuess]),
    },
    { id: "A2-5", dominio: "Hiperactividad/Impulsividad", label: "\"En marcha\"; como impulsado por un motor",
      medidoPor: ["CV-RT elevada (indicio)", "Fast guesses", "Actividad motora cursor"],
      evidencia: maxEvidence([evCV, evFastGuess, evFrenetic]) },
    { id: "A2-6", dominio: "Hiperactividad/Impulsividad", label: "Habla en exceso", medidoPor: ["No medido"], evidencia: "sin" },
    { id: "A2-7", dominio: "Hiperactividad/Impulsividad", label: "Responde antes de terminar la pregunta (impulsividad)",
      medidoPor: ["Comisiones (Go/No-Go)", "Fallas de stop (SST)"], evidencia: maxEvidence([evCommission, evStop]) },
    { id: "A2-8", dominio: "Hiperactividad/Impulsividad", label: "Dificultad para esperar turno",
      medidoPor: ["Fallas de stop (SST)"], evidencia: evStop },
    { id: "A2-9", dominio: "Hiperactividad/Impulsividad", label: "Interrumpe o se inmiscuye",
      medidoPor: ["No medido"], evidencia: "sin" },
  ];

  return [...A1, ...A2];
}
