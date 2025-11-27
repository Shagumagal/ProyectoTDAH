import { useEffect, useState } from "react";

// === Datos base (emoji + label accesible) ===
const ITEMS = [
  { id: "blue_circle", label: "círculo azul", emoji: "🔵" },
  { id: "red_circle", label: "círculo rojo", emoji: "🔴" },
  { id: "green_circle", label: "círculo verde", emoji: "🟢" },
  { id: "yellow_circle", label: "círculo amarillo", emoji: "🟡" },
  { id: "blue_square", label: "cuadrado azul", emoji: "🟦" },
  { id: "red_square", label: "cuadrado rojo", emoji: "🟥" },
  { id: "green_square", label: "cuadrado verde", emoji: "🟩" },
  { id: "yellow_square", label: "cuadrado amarillo", emoji: "🟨" },
];

function sample<T>(arr: T[], n: number): T[] {
  const pool = arr.slice();
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

function genChallenge() {
  const options = sample(ITEMS, 4);
  const target = options[Math.floor(Math.random() * options.length)];
  return {
    prompt: `Toca el ${target.label}`,
    options,
    targetId: target.id,
  };
}

export default function App() {
  const [c, setC] = useState(genChallenge());
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // reset estado al generar un reto nuevo
    setStatus(null);
    setDisabled(false);
  }, [c.targetId]);

  function verify(answerId: string) {
    if (disabled) return;
    const ok = answerId === c.targetId;
    if (ok) {
      setStatus({ ok: true, msg: "¡Listo! Verificación completada." });
      setDisabled(true);
    } else {
      setStatus({ ok: false, msg: "Ups, no es esa. Probemos otro desafío." });
      setC(genChallenge());
    }
  }

  return (
    <div className="min-h-svh w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Captcha</h1>
          <button
            onClick={() => setC(genChallenge())}
            className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition px-4 py-2 text-sm"
          >
            Otro desafío
          </button>
        </header>

        <div className="rounded-3xl bg-zinc-900/70 backdrop-blur p-5 shadow-2xl">
          <p className="text-base sm:text-lg font-medium mb-4">
            {status?.ok ? "✔ " : ""}{status?.ok ? "Verificación" : "Desafío"}: {status?.ok ? "completada" : c.prompt}
          </p>

          {!status?.ok && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {c.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => verify(opt.id)}
                  disabled={disabled}
                  aria-label={`Opción: ${opt.label}`}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition py-4 px-3 text-lg sm:text-xl md:text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <span aria-hidden className="text-3xl md:text-4xl">{opt.emoji}</span>
                  <span className="text-sm sm:text-base md:text-lg capitalize">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 min-h-6 text-sm">
            {status && (
              <p className={status.ok ? "text-emerald-400" : "text-rose-400"}>{status.msg}</p>
            )}
          </div>

          <div className="mt-4 text-xs text-zinc-400">
            
          </div>
        </div>
      </div>
    </div>
  );
}
