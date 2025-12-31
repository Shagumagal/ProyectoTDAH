import type { ResultadosAlumno } from '../types';
import { inferDSM5 } from './dsm5';

export function generateClinicalAnalysis(data: ResultadosAlumno): string {
  const criteria = inferDSM5(data);
  const lines: string[] = [];

  // Agrupar evidencias
  const desatencion = criteria.filter(c => c.dominio === "Desatención" && (c.evidencia === "fuerte" || c.evidencia === "moderada"));
  const hiperactividad = criteria.filter(c => c.dominio === "Hiperactividad/Impulsividad" && (c.evidencia === "fuerte" || c.evidencia === "moderada"));
  
  // --- 1. Introducción General ---
  lines.push(`El perfil cognitivo de ${data.alumno.nombre || 'el estudiante'} ha sido procesado mediante algoritmos de detección de patrones asociados al TDAH.`);
  lines.push("");

  // --- 2. Análisis de Atención ---
  const gng = data.goNoGo;
  const maxCV = Math.max(gng.cvRT, data.stopSignal.cvRT);

  if (desatencion.length > 0) {
    const list = desatencion.map(c => c.label).slice(0, 3).join(", ");
    lines.push(`• ATENCIÓN SOSTENIDA: Se detectan indicadores significativos de inatención (Evidencia: ${desatencion[0].evidencia.toUpperCase()}).`);
    lines.push(`  - Hallazgos principales: ${list}.`);
    if (maxCV >= 0.3) lines.push(`  - La variabilidad en los tiempos de respuesta es crítica (CV=${maxCV.toFixed(2)}), sugiriendo fluctuaciones severas en el foco atencional.`);
    else if (maxCV >= 0.2) lines.push(`  - Se observa inestabilidad en la respuesta (CV=${maxCV.toFixed(2)}).`);
    
    if (gng.omissionRate >= 0.10) lines.push(`  - Tasa de omisiones del ${(gng.omissionRate * 100).toFixed(0)}%, indicando desconexiones momentáneas.`);
  } else {
    lines.push(`• ATENCIÓN SOSTENIDA: Desempeño consistente. No se observan indicadores clínicos de inatención en las pruebas realizadas.`);
  }

  // --- 3. Análisis de Control e Impulsividad ---
  const sst = data.stopSignal;
  
  if (hiperactividad.length > 0) {
    const list = hiperactividad.map(c => c.label).slice(0, 3).join(", ");
    lines.push(`• CONTROL INHIBITORIO: Se identifican desafíos en la regulación de impulsos (Evidencia: ${hiperactividad[0].evidencia.toUpperCase()}).`);
    lines.push(`  - Hallazgos principales: ${list}.`);

    if (sst.stopFailureRate > 0.4) lines.push(`  - Dificultad marcada para detener acciones (Falla de frenado: ${(sst.stopFailureRate*100).toFixed(0)}%).`);
    if (gng.commissionRate > 0.15) lines.push(`  - Tendencia a responder precipitadamente (Comisiones: ${(gng.commissionRate*100).toFixed(0)}%).`);
  } else {
    const sstCtrl = 100 - (sst.stopFailureRate * 100);
    lines.push(`• CONTROL INHIBITORIO: Capacidad de frenado adecuada (${sstCtrl.toFixed(0)}% de éxito en inhibición).`);
  }

  // --- 4. Planificación (Torres) ---
  if (data.tol) {
    const tol = data.tol;
    // Usar criterio A1-5 si existe
    const orgProb = criteria.find(c => c.id === "A1-5" && c.evidencia !== "sin");
    
    if (orgProb) {
       lines.push(`• PLANIFICACIÓN: Se observan dificultades en la función ejecutiva de organización.`);
       lines.push(`  - Puntuación de eficiencia: ${((tol.planningScore || 0) * 100).toFixed(0)}%.`);
       lines.push(`  - Latencia de planificación: ${tol.planLatency.toFixed(1)}s.`);
    } else {
       lines.push(`• PLANIFICACIÓN: Buen desempeño ejecutivo. Estrategias de resolución eficientes.`);
    }
  }

  // --- 5. Conclusión ---
  lines.push("");
  if (desatencion.length > 0 || hiperactividad.length > 0) {
    const dominios = [];
    if (desatencion.length > 0) dominios.push("Atención");
    if (hiperactividad.length > 0) dominios.push("Control de Impulsos");
    
    lines.push(`CONCLUSIÓN PRELIMINAR: Los resultados presentan áreas de oportunidad en ${dominios.join(" y ")}. Se sugiere iniciar un seguimiento pedagógico para fortalecer estas habilidades, complementando la información con la observación cotidiana en el aula y el hogar.`);
  } else {
    lines.push("CONCLUSIÓN PRELIMINAR: El desempeño observado es consistente. Se recomienda continuar fomentando el desarrollo cognitivo general mediante actividades lúdicas y educativas.");
  }

  return lines.join("\n");
}
