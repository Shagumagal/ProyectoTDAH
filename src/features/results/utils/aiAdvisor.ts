import type { ResultadosAlumno } from '../types';

export function generateClinicalAnalysis(data: ResultadosAlumno): string {
  const lines: string[] = [];

  // --- 1. Introducción General ---
  lines.push(`El perfil cognitivo de ${data.alumno.nombre || 'el estudiante'} muestra los siguientes hallazgos relevantes basados en las pruebas de atención, inhibición y planificación:`);
  lines.push("");

  // --- 2. Análisis de Atención (Go/No-Go) ---
  const gng = data.goNoGo;
  const inatencion = gng.omissionRate > 0.10; // >10% omisiones
  const gngImpulsividad = gng.commissionRate > 0.15; // >15% comisiones
  const variabilidad = gng.cvRT > 0.3; // Variabilidad alta

  if (inatencion) {
    lines.push(`• ATENCIÓN SOSTENIDA: Se observan indicadores de inatención. La tasa de omisiones del ${(gng.omissionRate * 100).toFixed(0)}% sugiere dificultades para mantener el foco en tareas monótonas.`);
  } else {
    lines.push(`• ATENCIÓN SOSTENIDA: Desempeño dentro de rangos esperados. Buena capacidad para detectar estímulos objetivo.`);
  }

  if (variabilidad) {
    lines.push(`• CONSISTENCIA: La variabilidad en los tiempos de respuesta es alta (CV=${gng.cvRT.toFixed(2)}), lo cual es comúnmente asociado a fluctuaciones en la atención.`);
  }

  // --- 3. Análisis de Control Inhibitorio (Stop Signal / GNG) ---
  const sst = data.stopSignal;
  const sstFailure = sst.stopFailureRate > 0.40; // >40% fallos en stop
  const ssrtAlto = (sst.ssrt || 0) > 0.350; // >350ms es lento para niños/adolescentes (aprox)

  if (sstFailure || gngImpulsividad) {
    lines.push(`• CONTROL INHIBITORIO: Se detectan desafíos en la inhibición de impulsos.`);
    if (gngImpulsividad) lines.push(`  - En tareas de respuesta rápida, tiende a responder precipitadamente (Comisiones: ${(gng.commissionRate * 100).toFixed(0)}%).`);
    if (sstFailure) lines.push(`  - Muestra dificultad para detener una acción ya iniciada (Falla de frenado: ${(sst.stopFailureRate * 100).toFixed(0)}%).`);
    if (ssrtAlto && sst.ssrt) lines.push(`  - El tiempo de frenado interno (SSRT) de ${(sst.ssrt * 1000).toFixed(0)}ms sugiere un proceso de inhibición más lento que el promedio.`);
  } else {
    lines.push(`• CONTROL INHIBITORIO: Capacidad de frenado e inhibición adecuada. Logra controlar impulsos de manera efectiva.`);
  }

  // --- 4. Planificación (Torres) ---
  if (data.tol) {
    const tol = data.tol;
    const planningBajo = (tol.planningScore || 0) < 0.6;
    const impulsivoTol = tol.planLatency < 2.0; // Menos de 2s pensando antes de mover

    if (impulsivoTol) {
      lines.push(`• PLANIFICACIÓN Y FUNCIÓN EJECUTIVA: Estilo de resolución impulsivo. Inicia los movimientos rápidamente (${tol.planLatency.toFixed(1)}s) sin un periodo de reflexión adecuado.`);
    }
    
    if (planningBajo) {
        lines.push(`  - La eficiencia en la resolución de problemas complejos es reducida (Score: ${((tol.planningScore || 0) * 100).toFixed(0)}%), requiriendo más movimientos de los necesarios.`);
    } else {
        lines.push(`• PLANIFICACIÓN: Buen desempeño ejecutivo. Muestra capacidad para secuenciar pasos lógicos y alcanzar metas eficientemente.`);
    }

    if (tol.hyperactivity) {
        if ((tol.hyperactivity.freneticMovement || 0) > 0.2) {
            lines.push(`• ACTIVIDAD MOTORA: Se registra un nivel elevado de movimiento del cursor no funcional (Movimiento frenético > 20%), lo que podría correlacionarse con inquietud motora.`);
        }
    }
  }

  // --- 5. Conclusión ---
  lines.push("");
  if (inatencion || gngImpulsividad || sstFailure || variabilidad) {
    lines.push("CONCLUSIÓN PRELIMINAR: Los resultados sugieren un perfil compatible con desafíos en las funciones ejecutivas, recomendándose una evaluación clínica para descartar TDAH, especialmente en las áreas de atención e inhibición.");
  } else {
    lines.push("CONCLUSIÓN PRELIMINAR: El desempeño general es armonioso y no se observan indicadores significativos de déficit atencional o impulsividad en esta evaluación psicométrica.");
  }

  return lines.join("\n");
}
