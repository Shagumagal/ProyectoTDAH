import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;

  /** Se dispara después de debounce (útil para fetch remotos) */
  onDebouncedChange?: (v: string) => void;
  debounceMs?: number;

  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  ariaLabel?: string;

  /** Muestra botón para limpiar (por defecto true) */
  clearable?: boolean;

  /** Atajo para enfocar: "/" por defecto; usa null para desactivar */
  focusHotkey?: string | null;
};

export default function SearchInput({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  placeholder = "Buscar…",
  className = "",
  autoFocus = false,
  disabled = false,
  ariaLabel,
  clearable = true,
  focusHotkey = "/",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  // Debounce para notificar arriba (peticiones a API, etc.)
  useEffect(() => {
    if (!onDebouncedChange) return;
    const id = setTimeout(() => onDebouncedChange(value), debounceMs);
    return () => clearTimeout(id);
  }, [value, debounceMs, onDebouncedChange]);

  // Atajo "/" para enfocar
  useEffect(() => {
    if (!focusHotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === focusHotkey && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusHotkey]);

  return (
    <div
      className={
        "relative inline-flex items-center " + (className || "")
      }
    >
      {/* Icono */}
      <span className="pointer-events-none absolute left-3 text-slate-500 dark:text-slate-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="7" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" strokeWidth="2" />
        </svg>
      </span>

      {/* Input */}
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className="
          w-full rounded-xl pl-9 pr-9 py-2
          bg-slate-100 text-slate-700
          dark:bg-slate-800 dark:text-slate-200
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          border border-slate-200 dark:border-slate-700
          outline-none focus:ring-2 focus:ring-indigo-400
        "
      />

      {/* Clear */}
      {clearable && value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 inline-flex items-center justify-center size-7 rounded-lg
                     text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
          aria-label="Limpiar búsqueda"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" />
          </svg>
        </button>
      )}
    </div>
  );
}
