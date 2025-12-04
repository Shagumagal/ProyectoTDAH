import React, { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import WhiteDatePicker from "../../../componentes/WhiteDatePicker";
import ConfirmDialog from "../../../componentes/ConfirmDialog";
import ValidatedInput from "../../../componentes/ValidatedInput";
import { validateField, DomainValidators, type ValidationRule } from "../../../lib/validation";

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
    fecha_nacimiento?: string | null;
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
    fecha_nacimiento: string;
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

  // Estados del formulario
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [genero, setGenero] = useState<Genero | null>(null);

  // Estados de validación
  const [touched, setTouched] = useState({
    nombres: false,
    apellidos: false,
    email: false,
    username: false,
    password: false,
    dob: false,
    genero: false,
  });

  const [errors, setErrors] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    username: "",
    password: "",
    dob: "",
    genero: "",
    emailOrUsername: "",
  });

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [diffList, setDiffList] = useState<Array<{ label: string; before: string; after: string }>>([]);

  const maxDate = useMemo(() => dayjs().subtract(5, "year").endOf("day"), []);
  const minDate = dayjs("1900-01-01");

  // Cargar datos iniciales
  useEffect(() => {
    setNombres((initial?.nombres ?? initial?.nombre ?? "").trim());
    setApellidos((initial?.apellidos ?? initial?.apellido ?? "").trim());
    setEmail((initial?.correo ?? initial?.email ?? "").trim());
    setUsername((initial?.username ?? "").trim());
    setGenero((initial?.genero ?? null) as Genero | null);
    setDob(parseToDayjs(initial?.fecha_nacimiento));
  }, [initial]);

  // Validación en tiempo real
  const validateNombres = (value: string) => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'El nombre es obligatorio' },
      { type: 'minLength', length: 2, message: 'El nombre debe tener al menos 2 caracteres' },
      { type: 'pattern', regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, message: 'Solo se permiten letras y espacios' },
    ];
    return validateField(value, rules);
  };

  const validateApellidos = (value: string) => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'El apellido es obligatorio' },
      { type: 'minLength', length: 2, message: 'El apellido debe tener al menos 2 caracteres' },
      { type: 'pattern', regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, message: 'Solo se permiten letras y espacios' },
    ];
    return validateField(value, rules);
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return { isValid: true }; // Opcional si hay username
    const rules: ValidationRule[] = [
      { type: 'email', message: 'Ingresa un correo electrónico válido' },
    ];
    return validateField(value, rules);
  };

  const validateUsername = (value: string) => {
    if (!value.trim()) return { isValid: true }; // Opcional si hay email
    const rules: ValidationRule[] = [
      { type: 'username', message: 'Usuario inválido (3-24 caracteres: a-z, 0-9, _)' },
    ];
    return validateField(value, rules);
  };

  const validatePassword = (value: string) => {
    if (!isCreate) return { isValid: true };
    if (!value.trim()) return { isValid: true }; // Opcional en creación
    const rules: ValidationRule[] = [
      { type: 'minLength', length: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
    ];
    return validateField(value, rules);
  };

  const validateGenero = (value: Genero | null) => {
    if (!value) return { isValid: false, error: "Debes seleccionar un género" };
    return { isValid: true };
  };

  // Handlers de blur para marcar como tocado y validar
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let result: { isValid: boolean; error?: string };
    switch (field) {
      case 'nombres':
        result = validateNombres(nombres);
        setErrors(prev => ({ ...prev, nombres: result.error || '' }));
        break;
      case 'apellidos':
        result = validateApellidos(apellidos);
        setErrors(prev => ({ ...prev, apellidos: result.error || '' }));
        break;
      case 'email':
        result = validateEmail(email);
        setErrors(prev => ({ ...prev, email: result.error || '' }));
        break;
      case 'username':
        result = validateUsername(username);
        setErrors(prev => ({ ...prev, username: result.error || '' }));
        break;
      case 'password':
        result = validatePassword(password);
        setErrors(prev => ({ ...prev, password: result.error || '' }));
        break;
      case 'genero':
        result = validateGenero(genero);
        setErrors(prev => ({ ...prev, genero: result.error || '' }));
        break;
    }
  };

  // Validación completa del formulario
  function validateAll(): boolean {
    const nombresResult = validateNombres(nombres);
    const apellidosResult = validateApellidos(apellidos);
    const emailResult = validateEmail(email);
    const usernameResult = validateUsername(username);
    const passwordResult = validatePassword(password);
    const generoResult = validateGenero(genero);

    // Validación especial: debe tener email O username
    const hasEmailOrUsername = DomainValidators.requireAtLeastOne([email, username]);
    
    // Validación de fecha de nacimiento
    const dobValid = dob ? isAtLeast5Years(dob) : false;

    setErrors({
      nombres: nombresResult.error || '',
      apellidos: apellidosResult.error || '',
      email: emailResult.error || '',
      username: usernameResult.error || '',
      password: passwordResult.error || '',
      genero: generoResult.error || '',
      dob: !dobValid ? 'La fecha de nacimiento es obligatoria y debe ser de al menos 5 años atrás' : '',
      emailOrUsername: !hasEmailOrUsername ? 'Debe proporcionar un correo electrónico o un nombre de usuario' : '',
    });

    setTouched({
      nombres: true,
      apellidos: true,
      email: true,
      username: true,
      password: true,
      genero: true,
      dob: true,
    });

    return (
      nombresResult.isValid &&
      apellidosResult.isValid &&
      emailResult.isValid &&
      usernameResult.isValid &&
      passwordResult.isValid &&
      generoResult.isValid &&
      dobValid &&
      hasEmailOrUsername
    );
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
    setGlobalError(null);

    if (!validateAll()) {
      setGlobalError("Por favor, corrige los errores en el formulario");
      return;
    }

    const payload = buildPayload();

    if (isCreate) {
      try {
        setSaving(true);
        await onSubmit(payload);
      } catch (err: any) {
        setGlobalError(err?.message || "Error al guardar alumno.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Editar: confirmación si hay cambios
    const diffs = computeDiff(payload);
    if (diffs.length === 0) {
      return;
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
      setGlobalError(err?.message || "Error al guardar alumno.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {globalError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            {globalError}
          </div>
        )}

        {errors.emailOrUsername && touched.email && touched.username && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            {errors.emailOrUsername}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ValidatedInput
            label="Nombre(s)"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            onBlur={() => handleBlur('nombres')}
            error={errors.nombres}
            touched={touched.nombres}
            required
            autoComplete="given-name"
            placeholder="Ej: Juan Carlos"
          />

          <ValidatedInput
            label="Apellido(s)"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            onBlur={() => handleBlur('apellidos')}
            error={errors.apellidos}
            touched={touched.apellidos}
            required
            autoComplete="family-name"
            placeholder="Ej: Pérez García"
          />

          <ValidatedInput
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            helpText="Opcional si proporciona un usuario"
            autoComplete="email"
            placeholder="alumno@ejemplo.com"
          />

          <ValidatedInput
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            onBlur={() => handleBlur('username')}
            error={errors.username}
            touched={touched.username}
            helpText="3-24 caracteres: a-z, 0-9, _"
            autoComplete="username"
            placeholder="alumno_123"
          />

          {/* Fecha de nacimiento */}
          <div className="sm:col-span-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Fecha de nacimiento <span className="text-rose-500">*</span>
            </span>
            <WhiteDatePicker
              value={dob}
              onChange={setDob}
              maxDate={maxDate}
              minDate={minDate}
              format="DD/MM/YYYY"
              slotProps={{
                textField: { 
                  helperText: errors.dob || "Debe tener al menos 5 años",
                  error: touched.dob && !!errors.dob,
                },
                popper: { disablePortal: false },
              }}
            />
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Género <span className="text-rose-500">*</span>
            </label>
            <select
              value={genero ?? ""}
              onChange={(e) => {
                const val = (e.target.value || null) as Genero | null;
                setGenero(val);
                if (touched.genero) {
                   const res = validateGenero(val);
                   setErrors(prev => ({ ...prev, genero: res.error || '' }));
                }
              }}
              onBlur={() => handleBlur('genero')}
              className={`w-full rounded-xl border px-4 py-3 text-base bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                touched.genero && errors.genero 
                  ? "border-rose-500 ring-rose-500" 
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              <option value="">— Selecciona —</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
            {touched.genero && errors.genero && (
              <p className="mt-1 text-sm text-rose-500">{errors.genero}</p>
            )}
          </div>

          {/* Password solo en creación */}
          {isCreate && (
            <ValidatedInput
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              error={errors.password}
              touched={touched.password}
              helpText="Opcional. Si no se proporciona, se generará un código temporal"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {saving ? "Guardando…" : isCreate ? "Crear alumno" : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (!saving ? setConfirmOpen(false) : undefined)}
        onConfirm={confirmAndSave}
        loading={saving}
        title="Confirmar cambios"
        confirmText="Guardar cambios"
        cancelText="Seguir editando"
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
