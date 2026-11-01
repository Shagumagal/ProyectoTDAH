import { useEffect, useRef, useState } from "react";

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

interface CaptchaProps {
    onVerify: (isValid: boolean) => void;
}

export default function Captcha({ onVerify }: CaptchaProps) {
    const [c, setC] = useState(genChallenge);
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
    const [disabled, setDisabled] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // reset estado al generar un reto nuevo
        setStatus(null);
        setDisabled(false);
        onVerify(false);
    }, [c, onVerify]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    function verify(answerId: string) {
        if (disabled) return;
        const ok = answerId === c.targetId;
        if (ok) {
            setStatus({ ok: true, msg: "¡Listo!" });
            setDisabled(true);
            onVerify(true);
        } else {
            setStatus({ ok: false, msg: "Intenta de nuevo" });
            setDisabled(true);
            // Pequeño delay para que vea el error antes de cambiar
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setC(genChallenge());
            }, 1000);
        }
    }

    return (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {status?.ok ? "✔ Verificado" : c.prompt}
                </p>
                {!status?.ok && (
                    <button
                        type="button"
                        onClick={() => setC(genChallenge())}
                        className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                    >
                        Cambiar
                    </button>
                )}
            </div>

            {!status?.ok ? (
                <div className="grid grid-cols-4 gap-2">
                    {c.options.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => verify(opt.id)}
                            disabled={disabled}
                            aria-label={`Opción: ${opt.label}`}
                            className="flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95 transition p-2 text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            <span aria-hidden>{opt.emoji}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-center">
                    Verificación completada correctamente
                </div>
            )}

            {status && !status.ok && (
                <p className="mt-2 text-xs text-rose-500 text-center animate-pulse">{status.msg}</p>
            )}
        </div>
    );
}
