import * as React from "react";
import { useParams } from "react-router-dom";
import {
  Brain, Activity, TrendingUp, AlertTriangle, CircleCheck, CircleX, Info, Download,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
} from "recharts";

/* =========================
   UI STUBS (sin shadcn/ui)
   ========================= */
type BaseDivProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children?: React.ReactNode;
};
export const Card: React.FC<BaseDivProps> = ({ className = "", children, ...p }) => (
  <div {...p} className={`rounded-2xl border bg-white/5 shadow-sm ${className}`}>{children}</div>
);
export const CardHeader: React.FC<BaseDivProps> = ({ className = "", children, ...p }) => (
  <div {...p} className={`p-4 ${className}`}>{children}</div>
);
export const CardContent: React.FC<BaseDivProps> = ({ className = "", children, ...p }) => (
  <div {...p} className={`p-4 pt-0 ${className}`}>{children}</div>
);
export const CardFooter: React.FC<BaseDivProps> = ({ className = "", children, ...p }) => (
  <div {...p} className={`p-4 pt-0 ${className}`}>{children}</div>
);
export const CardTitle: React.FC<BaseDivProps> = ({ className = "", children, ...p }) => (
  <h3 {...p} className={`text-lg font-semibold ${className}`}>{children}</h3>
);

type BadgeVariant = "secondary" | "outline" | "destructive" | "default";
export const Badge: React.FC<{ variant?: BadgeVariant; className?: string; children?: React.ReactNode }> =
({ variant = "default", className = "", children }) => {
  const base = "inline-flex items-center rounded-md px-2 py-0.5 text-xs border";
  const styles: Record<BadgeVariant, string> = {
    secondary: "bg-gray-100 text-gray-900 border-gray-200",
    outline: "bg-transparent text-gray-900 border-gray-300",
    destructive: "bg-red-100 text-red-800 border-red-200",
    default: "bg-gray-100 text-gray-900 border-gray-200",
  };
  return <span className={`${base} ${styles[variant]} ${className}`}>{children}</span>;
};

export const Progress: React.FC<{ value?: number; className?: string }> = ({ value = 0, className = "" }) => (
  <div className={`h-2 w-full rounded-full bg-gray-200 ${className}`}>
    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

/* Tabs (interactivas) */
type TabsCtxType = { value: string; set: (v: string) => void };
const TabsCtx = React.createContext<TabsCtxType | null>(null);

export const Tabs: React.FC<{ defaultValue?: string; className?: string; children?: React.ReactNode }> =
({ defaultValue = "A1", className, children }) => {
  const [value, set] = React.useState<string>(defaultValue);
  return <TabsCtx.Provider value={{ value, set }}><div className={className}>{children}</div></TabsCtx.Provider>;
};
export const TabsList: React.FC<{ className?: string; children?: React.ReactNode }> =
({ className = "", children }) => <div className={`flex gap-2 ${className}`}>{children}</div>;
export const TabsTrigger: React.FC<{ value: string; children?: React.ReactNode }> =
({ value, children }) => {
  const ctx = React.useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.set(value)}
      className={`text-xs px-2 py-1 border rounded-md ${active ? "bg-gray-900 text-white" : "bg-white/10"}`}
    >
      {children}
    </button>
  );
};
export const TabsContent: React.FC<{ value: string; className?: string; children?: React.ReactNode }> =
({ value, className = "", children }) => {
  const ctx = React.useContext(TabsCtx);
  if (!ctx || ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
};

/* Tooltips (no-op) */
export const TooltipProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Tooltip: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const TooltipTrigger: React.FC<{ asChild?: boolean; children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const TooltipContent: React.FC<{ className?: string; children?: React.ReactNode }> = ({ children }) => <>{children}</>;

/* =========================
   Tipos de datos
   ========================= */
export type GameBase = {
  accuracy: number;           // 0–1
  commissionRate: number;     // 0–1
  omissionRate: number;       // 0–1
  medianRT: number;           // s
  p95RT: number;              // s
  cvRT: number;               // std/mean
};

export type GoNoGoMetrics = GameBase & {
  fastGuessRate?: number;
  lapsesRate?: number;
  vigilanceDecrement?: number;
};

export type StopSignalMetrics = GameBase & {
  stopFailureRate: number;
  ssrt?: number;
};

export type StroopMetrics = {
  deltaInterference: number;
  accuracy: number;
};

export type TowerOfLondonMetrics = {
  planLatency: number;
  excessMoves: number;
  ruleViolations: number;
};

export type Alumno = {
  id: string;
  nombre: string;
  edad?: number;
  curso?: string;
};

export type ResultadosAlumno = {
  alumno: Alumno;
  fecha: string; // ISO
  goNoGo: GoNoGoMetrics;
  stopSignal: StopSignalMetrics;
  stroop?: StroopMetrics;
  tol?: TowerOfLondonMetrics;
};

/* =========================
   Datos DEMO
   ========================= */
const DEMO: ResultadosAlumno = {
  alumno: { id: "A-001", nombre: "Juan P.", edad: 8, curso: "3° Primaria" },
  fecha: new Date().toISOString(),
  goNoGo: {
    accuracy: 0.82, commissionRate: 0.18, omissionRate: 0.08,
    medianRT: 0.42, p95RT: 0.80, cvRT: 0.22,
    fastGuessRate: 0.06, lapsesRate: 0.04, vigilanceDecrement: 0.12,
  },
  stopSignal: {
    accuracy: 0.78, commissionRate: 0.22, omissionRate: 0.09,
    medianRT: 0.45, p95RT: 0.88, cvRT: 0.26,
    stopFailureRate: 0.46, ssrt: 0.26,
  },
  stroop: { deltaInterference: 0.21, accuracy: 0.86 },
  tol: { planLatency: 3.4, excessMoves: 2, ruleViolations: 0 },
};

/* =========================
   Umbrales/Reglas
   ========================= */
const RULES = {
  commission: { weak: 0.12, mod: 0.18, strong: 0.28 },
  omission:   { weak: 0.10, mod: 0.18, strong: 0.28 },
  cvRT:       { weak: 0.18, mod: 0.24, strong: 0.30 },
  vigDec:     { weak: 0.06, mod: 0.10, strong: 0.16 },
  stopFail:   { weak: 0.30, mod: 0.40, strong: 0.50 },
  stroopDelta:{ weak: 0.15, mod: 0.25, strong: 0.35 },
  tolMoves:   { weak: 1, mod: 2, strong: 4 },
  planLatency:{ weak: 2.5, mod: 4.0, strong: 6.0 },
};

export type Evidence = "sin" | "debil" | "moderada" | "fuerte";
function scoreToEvidence(value: number, bands: { weak: number; mod: number; strong: number }): Evidence {
  if (value >= bands.strong) return "fuerte";
  if (value >= bands.mod)    return "moderada";
  if (value >= bands.weak)   return "debil";
  return "sin";
}

/* =========================
   Mapeo DSM-5 heurístico
   ========================= */
type Criterio = {
  id: string;
  dominio: "Desatención" | "Hiperactividad/Impulsividad";
  label: string;
  medidoPor: string[];
  evidencia: Evidence;
  nota?: string;
};

function inferDSM5(r: ResultadosAlumno): Criterio[] {
  const g = r.goNoGo, s = r.stopSignal, st = r.stroop, tl = r.tol;

  const evCommission = scoreToEvidence(((g?.commissionRate ?? 0) + (s?.commissionRate ?? 0)) / 2, RULES.commission);
  const evOmission   = scoreToEvidence(((g?.omissionRate   ?? 0) + (s?.omissionRate   ?? 0)) / 2, RULES.omission);
  const evCV         = scoreToEvidence(Math.max(g?.cvRT ?? 0, s?.cvRT ?? 0), RULES.cvRT);
  const evVig        = scoreToEvidence(g?.vigilanceDecrement ?? 0, RULES.vigDec);
  const evStop       = scoreToEvidence(s?.stopFailureRate ?? 0, RULES.stopFail);
  const evStroop     = st ? scoreToEvidence(st.deltaInterference, RULES.stroopDelta) : "sin";
  const evOrg: Evidence = tl
    ? (tl.excessMoves >= RULES.tolMoves.strong || tl.planLatency >= RULES.planLatency.strong) ? "fuerte"
    : (tl.excessMoves >= RULES.tolMoves.mod    || tl.planLatency >= RULES.planLatency.mod)    ? "moderada"
    : (tl.excessMoves >= RULES.tolMoves.weak   || tl.planLatency >= RULES.planLatency.weak)   ? "debil"
    : "sin"
    : "sin";

  const A1: Criterio[] = [
    { id: "A1-1", dominio: "Desatención", label: "Comete errores por descuido / falta de atención a detalles",
      medidoPor: ["Comisiones (Go/No-Go)", "Comisiones (Stop)", "Interferencia Stroop"],
      evidencia: maxEvidence([evCommission, evStroop]),
      nota: "Comisiones e interferencia sugieren fallos de control de respuesta y atención a detalles.",
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
    { id: "A2-1", dominio: "Hiperactividad/Impulsividad", label: "Se mueve inquieto con manos/pies", medidoPor: ["No medido"], evidencia: "sin" },
    { id: "A2-2", dominio: "Hiperactividad/Impulsividad", label: "Se levanta cuando debe estar sentado", medidoPor: ["No medido"], evidencia: "sin" },
    { id: "A2-3", dominio: "Hiperactividad/Impulsividad", label: "Corre o trepa inapropiadamente", medidoPor: ["No medido"], evidencia: "sin" },
    { id: "A2-4", dominio: "Hiperactividad/Impulsividad", label: "Incapaz de jugar tranquilamente", medidoPor: ["No medido"], evidencia: "sin" },
    { id: "A2-5", dominio: "Hiperactividad/Impulsividad", label: "\"En marcha\"; como impulsado por un motor",
      medidoPor: ["CV-RT elevada (indicio)", "Fast guesses"],
      evidencia: maxEvidence([evCV, scoreToEvidence(g?.fastGuessRate ?? 0, { weak: 0.04, mod: 0.07, strong: 0.12 })]) },
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
function maxEvidence(evs: Evidence[]): Evidence {
  if (evs.includes("fuerte"))   return "fuerte";
  if (evs.includes("moderada")) return "moderada";
  if (evs.includes("debil"))    return "debil";
  return "sin";
}

/* =========================
   Utilidades UI
   ========================= */
function EvidenceBadge({ e }: { e: Evidence }) {
  const map: Record<Evidence, { label: string; className: string }> = {
    sin:      { label: "Evidencia baja",        className: "bg-gray-200 text-gray-800" },
    debil:    { label: "Evidencia débil",     className: "bg-yellow-100 text-yellow-800" },
    moderada: { label: "Evidencia moderada",  className: "bg-amber-200 text-amber-900" },
    fuerte:   { label: "Evidencia fuerte",    className: "bg-red-200 text-red-900" },
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[e].className}`}>{map[e].label}</span>;
}
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}
function pct(n: number, digits = 0) { return `${(n * 100).toFixed(digits)}%`; }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

/* =========================
   Riesgo y helpers
   ========================= */
function riskFromTriad(a: number, b: number, c: number) {
  const m = (a + b + c) / 3;
  if (m >= 0.4) return "alto" as const;
  if (m >= 0.25) return "medio" as const;
  return "bajo" as const;
}
function riskLabel(r: ReturnType<typeof riskFromTriad>) {
  return r === "alto" ? "Riesgo alto" : r === "medio" ? "Riesgo medio" : "Riesgo bajo";
}
function riskVariant(r: ReturnType<typeof riskFromTriad> | "bajo" | "medio" | "alto"): BadgeVariant {
  switch (r) {
    case "alto":  return "destructive";
    case "medio": return "secondary";
    default:      return "outline";
  }
}
function scoreLevel(e: Evidence) { return e === "fuerte" ? "alto" : e === "moderada" ? "medio" : "bajo"; }
function evTo(tl: TowerOfLondonMetrics): Evidence {
  if (tl.excessMoves >= RULES.tolMoves.strong || tl.planLatency >= RULES.planLatency.strong) return "fuerte";
  if (tl.excessMoves >= RULES.tolMoves.mod    || tl.planLatency >= RULES.planLatency.mod)    return "moderada";
  if (tl.excessMoves >= RULES.tolMoves.weak   || tl.planLatency >= RULES.planLatency.weak)   return "debil";
  return "sin";
}

/* =========================
   Componente principal
   ========================= */
export default function ResultsPage({ data: propData = DEMO }: { data?: ResultadosAlumno }) {
  const { id } = useParams();
  const [apiData, setApiData] = React.useState<ResultadosAlumno | null>(null);

  // Carga opcional por :id (usa DEMO si no hay API o falla)
  React.useEffect(() => {
    let cancelled = false;
    if (!id) { setApiData(null); return; }
    (async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/resultados/${id}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as ResultadosAlumno;
        if (!cancelled) setApiData(json);
      } catch (e) {
        console.warn("Resultados API:", e);
        if (!cancelled) setApiData(null);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const data = apiData ?? propData; // DEMO hasta tener API

  const criterios = inferDSM5(data);
  const radarData = [
    { k: "Impulsividad",        v: Math.max(data.goNoGo.commissionRate, data.stopSignal.stopFailureRate) },
    { k: "Inatención",          v: Math.max(data.goNoGo.omissionRate, data.goNoGo.vigilanceDecrement ?? 0) },
    { k: "Variabilidad RT",     v: Math.max(data.goNoGo.cvRT, data.stopSignal.cvRT) },
    { k: "Control inhibitorio", v: data.stopSignal.stopFailureRate },
  ];
  const trendData = Array.from({ length: 12 }).map((_, i) => ({
    t: i + 1,
    acc: clamp01(data.goNoGo.accuracy + (i - 5) * -0.01 + (Math.random() - 0.5) * 0.02),
  }));
  const a1 = criterios.filter(c => c.id.startsWith("A1-"));
  const a2 = criterios.filter(c => c.id.startsWith("A2-"));

  return (
    <div className="w-full px-4 py-6 md:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Encabezado */}
      <div className="xl:col-span-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resultados del alumno</h1>
            <p className="text-sm text-muted-foreground">
              Reporte orientativo basado en desempeño en minijuegos — <span className="font-medium">no constituye diagnóstico clínico</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">ID: {data.alumno.id}</Badge>
            {data.alumno.edad && <Badge className="text-xs">{data.alumno.edad} años</Badge>}
            {data.alumno.curso && <Badge className="text-xs" variant="outline">{data.alumno.curso}</Badge>}
          </div>
        </div>
      </div>

      {/* Izquierda: Radar + Resumen */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Perfil cognitivo (derivado)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="k" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 1]} tickFormatter={(v: number) => pct(v)} />
                <Radar dataKey="v" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <Stat label="Accuracy Go/No-Go" value={pct(data.goNoGo.accuracy, 1)} />
            <Stat label="Comisiones Go/No-Go" value={pct(data.goNoGo.commissionRate, 1)} />
            <Stat label="Fallas de Stop (SST)" value={pct(data.stopSignal.stopFailureRate, 1)} />
            <Stat
              label="CV-RT (máx.)"
              value={(Math.max(data.goNoGo.cvRT, data.stopSignal.cvRT)).toFixed(2)}
              hint=">0.24 sugiere variabilidad elevada"
            />
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">Última actualización: {new Date(data.fecha).toLocaleString()}</CardFooter>
      </Card>

      {/* Centro: Juegos */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Desempeño por minijuego</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Go/No-Go */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Go/No-Go</span>
              <Badge variant={riskVariant(riskFromTriad(
                data.goNoGo.commissionRate, data.goNoGo.cvRT, data.goNoGo.vigilanceDecrement ?? 0
              ))}>
                {riskLabel(riskFromTriad(
                  data.goNoGo.commissionRate, data.goNoGo.cvRT, data.goNoGo.vigilanceDecrement ?? 0
                ))}
              </Badge>
            </div>
            <Progress value={data.goNoGo.accuracy * 100} className="h-2" />
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Comisión: <span className="font-semibold text-foreground">{pct(data.goNoGo.commissionRate, 1)}</span></div>
              <div>Omisión:  <span className="font-semibold text-foreground">{pct(data.goNoGo.omissionRate, 1)}</span></div>
              <div>Mediana RT: <span className="font-semibold text-foreground">{data.goNoGo.medianRT.toFixed(3)}s</span></div>
              <div>CV-RT: <span className="font-semibold text-foreground">{data.goNoGo.cvRT.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Stop Signal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Stop-Signal (SST)</span>
              <Badge variant={riskVariant(riskFromTriad(
                data.stopSignal.stopFailureRate, data.stopSignal.cvRT, data.stopSignal.commissionRate
              ))}>
                {riskLabel(riskFromTriad(
                  data.stopSignal.stopFailureRate, data.stopSignal.cvRT, data.stopSignal.commissionRate
                ))}
              </Badge>
            </div>
            <Progress value={data.stopSignal.accuracy * 100} className="h-2" />
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Fallas Stop: <span className="font-semibold text-foreground">{pct(data.stopSignal.stopFailureRate, 1)}</span></div>
              <div>Mediana RT:  <span className="font-semibold text-foreground">{data.stopSignal.medianRT.toFixed(3)}s</span></div>
              <div>CV-RT:       <span className="font-semibold text-foreground">{data.stopSignal.cvRT.toFixed(2)}</span></div>
              {typeof data.stopSignal.ssrt === "number" && (
                <div>SSRT: <span className="font-semibold text-foreground">{data.stopSignal.ssrt.toFixed(3)}s</span></div>
              )}
            </div>
          </div>

          {/* Stroop */}
          {data.stroop && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Stroop</span>
                <Badge variant={riskVariant(scoreLevel(scoreToEvidence(data.stroop.deltaInterference, RULES.stroopDelta)))}>
                  {riskLabel(scoreLevel(scoreToEvidence(data.stroop.deltaInterference, RULES.stroopDelta)))}
                </Badge>
              </div>
              <Progress value={data.stroop.accuracy * 100} className="h-2" />
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Interferencia Δ: <span className="font-semibold text-foreground">{(data.stroop.deltaInterference * 100).toFixed(1)}%</span></div>
                <div>Accuracy: <span className="font-semibold text-foreground">{pct(data.stroop.accuracy, 1)}</span></div>
              </div>
            </div>
          )}

          {/* Torre de Londres */}
          {data.tol && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Torre de Londres</span>
                <Badge variant={riskVariant(scoreLevel(evTo(data.tol)))}>{riskLabel(scoreLevel(evTo(data.tol)))}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Latencia plan: <span className="font-semibold text-foreground">{data.tol.planLatency.toFixed(1)}s</span></div>
                <div>Mov. extra:    <span className="font-semibold text-foreground">{data.tol.excessMoves}</span></div>
                <div>Violaciones:   <span className="font-semibold text-foreground">{data.tol.ruleViolations}</span></div>
              </div>
            </div>
          )}

          <div className="pt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Interpretación orientativa. Confirmar siempre con evaluación clínica.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Derecha: DSM-5 */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Criterios DSM-5-TR asociados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="A1" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="A1">Desatención</TabsTrigger>
              <TabsTrigger value="A2">Hiper/Impuls.</TabsTrigger>
            </TabsList>

            <TabsContent value="A1" className="mt-3 space-y-2">
              {a1.map((c) => (
                <div key={c.id} className="rounded-lg border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{c.id}</span>
                        <EvidenceBadge e={c.evidencia} />
                      </div>
                      <p className="text-sm font-medium mt-1">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">Medido por: {c.medidoPor.join(", ")}</p>
                      {c.nota && <p className="text-xs text-muted-foreground mt-1 italic">{c.nota}</p>}
                    </div>
                    {c.evidencia === "sin"
                      ? <CircleX className="h-5 w-5 text-muted-foreground" />
                      : <CircleCheck className="h-5 w-5 text-emerald-600" />}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="A2" className="mt-3 space-y-2">
              {a2.map((c) => (
                <div key={c.id} className="rounded-lg border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{c.id}</span>
                        <EvidenceBadge e={c.evidencia} />
                      </div>
                      <p className="text-sm font-medium mt-1">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">Medido por: {c.medidoPor.join(", ")}</p>
                      {c.nota && <p className="text-xs text-muted-foreground mt-1 italic">{c.nota}</p>}
                    </div>
                    {c.evidencia === "sin"
                      ? <CircleX className="h-5 w-5 text-muted-foreground" />
                      : <CircleCheck className="h-5 w-5 text-emerald-600" />}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">DSM-5-TR: Códigos A1/A2 (uso orientativo)</div>
          <button className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border hover:bg-accent">
            <Download className="h-3.5 w-3.5" /> Exportar PDF
          </button>
        </CardFooter>
      </Card>

      {/* Tendencia */}
      <Card className="xl:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Tendencia de accuracy (ensayo→ensayo, demo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} tickFormatter={(v: number) => pct(v)} tick={{ fontSize: 11 }} />
                <RTooltip
                  formatter={(value: number | string) =>
                    typeof value === "number" ? pct(value, 1) : String(value)
                  }
                  labelFormatter={(label: string | number) => `Ensayo ${label}`}
                />
                <Line type="monotone" dataKey="acc" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
