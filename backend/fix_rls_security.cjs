require('dotenv').config();
const { query, pool } = require('./db');

async function fixRLS() {
  console.log("Iniciando corrección de seguridad RLS...");

  // Intentar habilitar RLS en public.resultados
  try {
    console.log("Habilitando RLS en 'public.resultados'...");
    await query("ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;");
    console.log("✔ RLS habilitado en 'public.resultados'.");
  } catch (err) {
    console.warn("⚠ Aviso en 'public.resultados':", err.message);
  }

  // Intentar habilitar RLS en public.metricas_hiperactividad
  try {
    console.log("Habilitando RLS en 'public.metricas_hiperactividad'...");
    await query("ALTER TABLE public.metricas_hiperactividad ENABLE ROW LEVEL SECURITY;");
    console.log("✔ RLS habilitado en 'public.metricas_hiperactividad'.");
  } catch (err) {
    console.warn("⚠ Aviso en 'public.metricas_hiperactividad':", err.message);
  }

  console.log("Operación completada.");
  pool.end();
}

fixRLS();
