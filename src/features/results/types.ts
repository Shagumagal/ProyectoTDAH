export type HyperactivityMetrics = {
  // Existing snake_case fields (kept for compatibility if needed)
  total_mouse_distance_px?: number;
  mean_mouse_speed_px_s?: number;
  max_mouse_speed_px_s?: number;
  frenetic_movement_rate?: number;
  direction_changes?: number;
  total_clicks?: number;
  unnecessary_clicks?: number;
  unnecessary_click_rate?: number;
  total_key_presses?: number;
  burst_activity_rate?: number;
  mean_burst_interval_s?: number;
  idle_time_ratio?: number;
  active_time_ratio?: number;
  session_duration_s?: number;
  activity_consistency?: number;

  // New camelCase fields for frontend components
  mouseDistance?: number;
  freneticMovement?: number;
  unnecessaryClicks?: number;
  clickRate?: number;
};

export type GameBase = {
  accuracy: number;           // 0–1
  commissionRate: number;     // 0–1
  omissionRate: number;       // 0–1
  medianRT: number;           // s
  p95RT: number;              // s
  cvRT: number;               // std/mean
  hyperactivity?: HyperactivityMetrics | null;
};

export type GoNoGoMetrics = GameBase & {
  fastGuessRate?: number;
  lapsesRate?: number;
  vigilanceDecrement?: number;
};

export type StopSignalMetrics = GameBase & {
  stopFailureRate: number;
  ssrt?: number;
  ssdAverage?: number;
};

export type TowerOfLondonMetrics = {
  planLatency: number;
  excessMoves: number;
  ruleViolations: number;
  decisionTime?: number;
  planningScore?: number;
  hyperactivity?: HyperactivityMetrics | null;
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
  // stroop?: StroopMetrics;
  tol?: TowerOfLondonMetrics;
  aiAnalysisText?: string;
};

export type Evidence = "sin" | "debil" | "moderada" | "fuerte";
