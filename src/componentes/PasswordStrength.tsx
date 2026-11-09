// Indicador de seguridad de contraseña. Solo informativo: NO bloquea el guardado.
import { Check, Circle, ShieldAlert, ShieldCheck, ShieldHalf, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Rule = { ok: boolean; label: string };

function passwordChecks(pwd: string): Rule[] {
  return [
    { ok: pwd.length >= 8, label: "8 caracteres o más" },
    { ok: /[a-záéíóúñü]/.test(pwd) && /[A-ZÁÉÍÓÚÑÜ]/.test(pwd), label: "Mayúsculas y minúsculas" },
    { ok: /\d/.test(pwd), label: "Al menos un número" },
    { ok: /[^A-Za-z0-9áéíóúñüÁÉÍÓÚÑÜ]/.test(pwd), label: "Un símbolo (ej. ! @ # .)" },
  ];
}

type Level = { text: string; bar: string; color: string; Icon: LucideIcon };

const LEVELS: Level[] = [
  { text: "Muy débil", bar: "bg-rose-500", color: "text-rose-600 dark:text-rose-400", Icon: ShieldAlert },
  { text: "Débil", bar: "bg-orange-500", color: "text-orange-600 dark:text-orange-400", Icon: ShieldAlert },
  { text: "Media", bar: "bg-amber-500", color: "text-amber-600 dark:text-amber-400", Icon: ShieldHalf },
  { text: "Fuerte", bar: "bg-lime-500", color: "text-lime-600 dark:text-lime-400", Icon: ShieldCheck },
  { text: "Muy fuerte", bar: "bg-emerald-500", color: "text-emerald-600 dark:text-emerald-400", Icon: ShieldCheck },
];

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = passwordChecks(password);
  let score = checks.filter((c) => c.ok).length; // 0–4
  if (password.length < 6) score = 0;
  const level = LEVELS[score];
  const LevelIcon = level.Icon;

  return (
    <div className="mt-1.5 grid gap-1.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 gap-1"
          role="meter"
          aria-label="Seguridad de la contraseña"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={score}
          aria-valuetext={level.text}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < Math.max(score, 1) ? level.bar : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${level.color}`}>
          <LevelIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {level.text}
        </span>
      </div>

      {score < 4 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
          {checks.map((c) => (
            <li
              key={c.label}
              className={`flex items-center gap-1.5 ${
                c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {c.ok ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3 shrink-0" aria-hidden="true" />
              )}
              {c.label}
            </li>
          ))}
        </ul>
      )}

      {score < 3 && password.length >= 6 && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Es una recomendación: puedes guardarla igual.
        </p>
      )}
    </div>
  );
}
