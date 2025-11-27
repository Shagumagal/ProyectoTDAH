import React, { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import WhiteDatePicker from "../../../componentes/WhiteDatePicker";
import ConfirmDialog from "../../../componentes/ConfirmDialog";

type Genero = "masculino" | "femenino";

type Props = {
  initial?: {
    id?: string;
    nombre?: string;
    nombres?: string;
    apellido?: string;
    apellidos?: string;
    correo?: string;
    email?: string;
    username?: string;
    fecha_nacimiento?: string | null; // "YYYY-MM-DD" o ISO
    genero?: Genero | null;
  } | null;
  mode: "create" | "edit";
  onSubmit: (data: {
    id?: string;
    nombres: string;
    apellidos: string;
    email?: string | null;
    username?: string | null;
    password?: string;
    fecha_nacimiento: string; // YYYY-MM-DD
    genero?: Genero | null;
  }) => Promise<void> | void;
  onCancel: () => void;
};

/* ---------- Helpers ---------- */
function parseToDayjs(value?: string | null): Dayjs | null {
  if (!value) return null;
  const d =
    value.length > 10 && value.includes("T")
      ? dayjs(value)
      : dayjs(value, "YYYY-MM-DD", true);
  return d.isValid() ? d : null;
}

function isAtLeast5Years(d: Dayjs | null): boolean {
  if (!d) return false;
  const min = dayjs().subtract(5, "year").endOf("day");
  return d.isSame(min) || d.isBefore(min);
}

function fmtGenero(g?: Genero | null): string {
  if (!g) return "—";
  switch (g) {
    case "masculino": return "Masculino";
    case "femenino": return "Femenino";
    default: return "—";
  }
}

export default function StudentForm({ initial, mode, onSubmit, onCancel }: Props) {
  const isCreate = mode === "create";

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [genero, setGenero] = useState<Genero | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [diffList, setDiffList] = useState<Array<{ label: string; before: string; after: string }>>([]);

  const maxDate = useMemo(() => dayjs().subtract(5, "year").endOf("day"), []);
  const minDate = dayjs("1900-01-01");

  // Cargar datos iniciales (edición)
  useEffect(() => {
    setNombres((initial?.nombres ?? initial?.nombre ?? "").trim());
    setApellidos((initial?.apellidos ?? initial?.apellido ?? "").trim());
    setEmail((initial?.correo ?? initial?.email ?? "").trim());
    setUsername((initial?.username ?? "").trim());
    setGenero((initial?.genero ?? null) as Genero | null);
    setDob(parseToDayjs(initial?.fecha_nacimiento));
  }, [initial]);

  function validate(): string | null {
    if (!nombres.trim() || !apellidos.trim()) return "Nombre y apellido son obligatorios.";
    if (!email.trim() && !username.trim()) return "Debe tener email o username.";
    if (!dob) return "La fecha de nacimiento es obligatoria.";
    if (!isAtLeast5Years(dob)) return "Debe tener al menos 5 años.";
    return null;
  }

  function buildPayload() {
    return {
      id: initial?.id,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email.trim() || null,
      username: username.trim() || null,
      ...(isCreate ? { password: password.trim() } : {}),
      fecha_nacimiento: (dob as Dayjs).format("YYYY-MM-DD"),
      genero: (genero || null) as Genero | null,
    };
  }

  function computeDiff(next: any) {
    const prev = {
      nombres: (initial?.nombres ?? initial?.nombre ?? "").trim() || "",
      apellidos: (initial?.apellidos ?? initial?.apellido ?? "").trim() || "",
      email: (initial?.correo ?? initial?.email ?? "").trim() || null,
      username: (initial?.username ?? "").trim() || null,
      fecha_nacimiento: parseToDayjs(initial?.fecha_nacimiento)?.format("YYYY-MM-DD") ?? null,
      genero: (initial?.genero ?? null) as Genero | null,
    };

    const diffs: Array<{ label: string; before: string; after: string }> = [];
    if (prev.nombres !== next.nombres)
      diffs.push({ label: "Nombre(s)", before: prev.nombres || "—", after: next.nombres || "—" });
    if (prev.apellidos !== next.apellidos)
      diffs.push({ label: "Apellido(s)", before: prev.apellidos || "—", after: next.apellidos || "—" });
    if ((prev.email || null) !== (next.email || null))
      diffs.push({ label: "Correo", before: prev.email || "—", after: next.email || "—" });
    if ((prev.username || null) !== (next.username || null))
      diffs.push({ label: "Usuario", before: prev.username || "—", after: next.username || "—" });
    if ((prev.fecha_nacimiento || null) !== (next.fecha_nacimiento || null))
      diffs.push({
        label: "Fecha de nacimiento",
        before: prev.fecha_nacimiento || "—",
        after: next.fecha_nacimiento || "—",
      });
    if ((prev.genero || null) !== (next.genero || null))
      diffs.push({
        label: "Género",
        before: fmtGenero(prev.genero),
        after: fmtGenero(next.genero),
      });

    return diffs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    const payload = buildPayload();

    if (isCreate) {
      // Crear: sin confirmación
      try {
        setSaving(true);
        await onSubmit(payload);
      } catch (err: any) {
        setError(err?.message || "Error al guardar alumno.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Editar: confirmación si hay cambios
    const diffs = computeDiff(payload);
    if (diffs.length === 0) {
      return; // Sin cambios: no abrimos diálogo
    }
    setDiffList(diffs);
    setPendingPayload(payload);
    setConfirmOpen(true);
  }

  async function confirmAndSave() {
    if (!pendingPayload) return;
    try {
      setSaving(true);
      await onSubmit(pendingPayload);
      setConfirmOpen(false);
      setPendingPayload(null);
    } catch (err: any) {
      setError(err?.message || "Error al guardar alumno.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium dark:text-white">Nombre(s)</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label className="text-sm font-medium dark:text-white">Apellido(s)</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              autoComplete="family-name"
            />
          </div>

          <div>
            <label className="text-sm font-medium dark:text-white">Correo</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium dark:text-white">Usuario (si no tiene email)</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alumno_123"
              autoComplete="username"
              pattern="^[a-z0-9_]{3,24}$"
              title="3–24 caracteres: a–z, 0–9 y guión bajo"
            />
          </div>

          {/* Fecha de nacimiento (WhiteDatePicker) */}
          <div>
            <span className="text-sm font-medium dark:text-white">Fecha de nacimiento *</span>
            <div className="mt-1">
              <WhiteDatePicker
                value={dob}
                onChange={setDob}
                maxDate={maxDate}
                minDate={minDate}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: { helperText: "Debe tener al menos 5 años." },
                  popper: { disablePortal: false },
                }}
              />
            </div>
          </div>

          {/* Género */}
          <div>
            <label className="text-sm font-medium">Género (opcional)</label>
            <select
              value={genero ?? ""}
              onChange={(e) => setGenero((e.target.value || "") as Genero | null)}
              className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            >
              <option value="">— Selecciona (opcional) —</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>

          {/* Password solo en creación */}
          {isCreate && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">
                Contraseña <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border px-4 py-3 text-base text-white dark:text-white bg-white/10 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-5 py-2.5 font-semibold text-slate-200 hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (isCreate ? "Guardando…" : "Guardando…") : isCreate ? "Crear" : "Guardar"}
          </button>
        </div>
      </form>

      {/* Diálogo de confirmación (solo edición) */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (!saving ? setConfirmOpen(false) : undefined)}
        onConfirm={confirmAndSave}
        loading={saving}
        title="Confirmar cambios"
        confirmText="Guardar cambios"
        cancelText="Seguir editando"
        // Puedes dejar solo description o solo children, o ambos:
        description="Estás a punto de actualizar los datos del alumno. Revisa el resumen de cambios:"
        intent="default"
      >
        <ul className="mt-1 space-y-1 text-sm">
          {diffList.map((d, i) => (
            <li key={i}>
              <span className="font-medium">{d.label}:</span>{" "}
              <span className="text-slate-500 line-through decoration-rose-400/70">{d.before}</span>{" "}
              <span className="mx-1">→</span>
              <span className="font-semibold">{d.after}</span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
