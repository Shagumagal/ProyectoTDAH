import React, { useEffect, useMemo, useState } from "react";
import type { Usuario } from "../../../lib/types";
import dayjs, { Dayjs } from "dayjs";
import WhiteDatePicker from "../../../componentes/WhiteDatePicker";
import ValidatedInput from "../../../componentes/ValidatedInput";
import { validateField, DomainValidators, type ValidationRule } from "../../../lib/validation";

// Tipos del form
export type UserFormOutput = {
  id?: string;
  nombre: string;
  apellido: string;
  correo?: string;
  rol: "Alumno" | "Docente" | "Psicólogo" | "Admin";
  username?: string;
  password?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  genero?: "masculino" | "femenino" | null;
};

export type UserFormMode = "create" | "edit";

type Props = {
  mode: UserFormMode;
  initialUser?: Usuario | null;
  onCancel: () => void;
  onSubmit: (data: UserFormOutput) => void | Promise<void>;
  className?: string;
};

// Helpers
const normalizeUsername = (s = "") =>
  s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

function isAtLeast5Years(d: Dayjs | null) {
  if (!d || !d.isValid()) return false;
  const cut = dayjs().subtract(5, "year").endOf("day");
  const min = dayjs("1900-01-01");
  return d.isBefore(cut) && d.isAfter(min.subtract(1, "day"));
}

const fmt = (d: Dayjs | null) => (d && d.isValid() ? d.format("YYYY-MM-DD") : "");

export default function UserForm({
  mode,
  initialUser,
  onCancel,
  onSubmit,
  className = "",
}: Props) {
  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState<UserFormOutput["rol"]>("Alumno");
  const [correo, setCorreo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [fechaNac, setFechaNac] = useState<Dayjs | null>(null);
  const [genero, setGenero] = useState<UserFormOutput["genero"]>(null);

  // Estados de validación
  const [touched, setTouched] = useState({
    nombre: false,
    apellido: false,
    correo: false,
    username: false,
    password: false,
    fechaNac: false,
    genero: false,
  });

  const [errors, setErrors] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    username: "",
    password: "",
    fechaNac: "",
    genero: "",
    emailOrUsername: "",
  });

  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isAlumno = useMemo(() => rol === "Alumno", [rol]);

  // límites del picker
  const maxDOB = dayjs().subtract(5, "year");
  const minDOB = dayjs("1900-01-01");

  // precarga cuando editas
  useEffect(() => {
    if (mode === "edit" && initialUser) {
      setNombre(initialUser.nombre ?? "");
      setApellido(initialUser.apellido ?? "");
      setRol((initialUser.rol as any) || "Alumno");
      setCorreo(initialUser.correo ?? "");
      setUsername((initialUser as any).username ?? "");
      setPassword("");

      const d = initialUser.fecha_nacimiento
        ? dayjs(initialUser.fecha_nacimiento)
        : null;
      setFechaNac(d && d.isValid() ? d : null);

      setGenero((initialUser as any).genero ?? null);
    } else {
      setNombre("");
      setApellido("");
      setRol("Alumno");
      setCorreo("");
      setUsername("");
      setPassword("");
      setFechaNac(null);
      setGenero(null);
    }
    setGlobalError(null);
    // Reset validation state
    setTouched({
      nombre: false,
      apellido: false,
      correo: false,
      username: false,
      password: false,
      fechaNac: false,
      genero: false,
    });
    setErrors({
      nombre: "",
      apellido: "",
      correo: "",
      username: "",
      password: "",
      fechaNac: "",
      genero: "",
      emailOrUsername: "",
    });
  }, [mode, initialUser]);

  // Validaciones individuales
  const validateNombre = (value: string) => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'El nombre es obligatorio' },
      { type: 'minLength', length: 2, message: 'Mínimo 2 caracteres' },
      { type: 'pattern', regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, message: 'Solo letras y espacios' },
    ];
    return validateField(value, rules);
  };

  const validateApellido = (value: string) => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'El apellido es obligatorio' },
      { type: 'minLength', length: 2, message: 'Mínimo 2 caracteres' },
      { type: 'pattern', regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, message: 'Solo letras y espacios' },
    ];
    return validateField(value, rules);
  };

  const validateCorreo = (value: string) => {
    if (!value.trim() && isAlumno) return { isValid: true }; // Opcional para alumno si tiene username
    if (rol !== "Alumno" && !value.trim()) return { isValid: false, error: "El correo es obligatorio para este rol" };
    
    const rules: ValidationRule[] = [
      { type: 'email', message: 'Correo inválido' },
    ];
    return validateField(value, rules);
  };

  const validateUsername = (value: string) => {
    if (!value.trim() && isAlumno) return { isValid: true }; // Opcional para alumno si tiene email
    if (rol !== "Alumno" && !value.trim()) return { isValid: true }; // Opcional para otros roles
    
    const rules: ValidationRule[] = [
      { type: 'username', message: 'Usuario inválido (3-24 caracteres: a-z, 0-9, _)' },
    ];
    return validateField(value, rules);
  };

  const validatePassword = (value: string) => {
    if (mode !== "create") return { isValid: true };
    if (!value.trim()) return { isValid: true }; // Opcional
    
    const rules: ValidationRule[] = [
      { type: 'minLength', length: 6, message: 'Mínimo 6 caracteres' },
    ];
    return validateField(value, rules);
  };

  const validateGenero = (value: string | null) => {
    if (!value) return { isValid: false, error: "Debes seleccionar un género" };
    return { isValid: true };
  };

  // Handlers de blur
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let result;
    switch (field) {
      case 'nombre':
        result = validateNombre(nombre);
        setErrors(prev => ({ ...prev, nombre: result.error || '' }));
        break;
      case 'apellido':
        result = validateApellido(apellido);
        setErrors(prev => ({ ...prev, apellido: result.error || '' }));
        break;
      case 'correo':
        result = validateCorreo(correo);
        setErrors(prev => ({ ...prev, correo: result.error || '' }));
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

  function validateAll(): boolean {
    const nombreRes = validateNombre(nombre);
    const apellidoRes = validateApellido(apellido);
    const correoRes = validateCorreo(correo);
    const usernameRes = validateUsername(username);
    const passwordRes = validatePassword(password);
    const generoRes = validateGenero(genero);

    // Validación especial para alumno: email O username
    let emailOrUsernameError = "";
    let hasEmailOrUsername = true;
    
    if (isAlumno) {
      hasEmailOrUsername = DomainValidators.requireAtLeastOne([correo, username]);
      if (!hasEmailOrUsername) {
        emailOrUsernameError = "Para Alumno, debe proporcionar correo o usuario";
      }
    }

    // Validación fecha nacimiento
    let fechaNacError = "";
    let fechaNacValid = true;
    if (isAlumno) {
      if (!fechaNac) {
        fechaNacError = "Fecha de nacimiento obligatoria para Alumno";
        fechaNacValid = false;
      } else if (!isAtLeast5Years(fechaNac)) {
        fechaNacError = "Debe tener al menos 5 años";
        fechaNacValid = false;
      }
    }

    setErrors({
      nombre: nombreRes.error || '',
      apellido: apellidoRes.error || '',
      correo: correoRes.error || '',
      username: usernameRes.error || '',
      password: passwordRes.error || '',
      genero: generoRes.error || '',
      fechaNac: fechaNacError,
      emailOrUsername: emailOrUsernameError,
    });

    setTouched({
      nombre: true,
      apellido: true,
      correo: true,
      username: true,
      password: true,
      fechaNac: true,
      genero: true,
    });

    return (
      nombreRes.isValid &&
      apellidoRes.isValid &&
      correoRes.isValid &&
      usernameRes.isValid &&
      passwordRes.isValid &&
      generoRes.isValid &&
      fechaNacValid &&
      hasEmailOrUsername
    );
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError(null);

    if (!validateAll()) {
      setGlobalError("Por favor, corrige los errores en el formulario");
      return;
    }

    const payload: UserFormOutput = {
      id: mode === "edit" ? initialUser?.id : undefined,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim() || undefined,
      rol,
      username: normalizeUsername(username) || undefined,
      password: password || undefined,
      fecha_nacimiento: fmt(fechaNac) || undefined,
      genero: genero ?? undefined,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (e: any) {
      setGlobalError(e?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {globalError && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {globalError}
        </div>
      )}

      {errors.emailOrUsername && touched.correo && touched.username && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          {errors.emailOrUsername}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Nombre */}
        <ValidatedInput
          label="Nombre(s)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={() => handleBlur('nombre')}
          error={errors.nombre}
          touched={touched.nombre}
          required
          placeholder="Juan Carlos"
        />

        {/* Apellido */}
        <ValidatedInput
          label="Apellido(s)"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          onBlur={() => handleBlur('apellido')}
          error={errors.apellido}
          touched={touched.apellido}
          required
          placeholder="Pérez López"
        />

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Rol
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as UserFormOutput["rol"])}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-4 py-3 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option>Alumno</option>
            <option>Docente</option>
            <option>Psicólogo</option>
            <option>Admin</option>
          </select>
        </div>

        {/* Correo */}
        <ValidatedInput
          label="Correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          onBlur={() => handleBlur('correo')}
          error={errors.correo}
          touched={touched.correo}
          required={rol !== "Alumno"}
          placeholder="correo@ejemplo.com"
          helpText={rol === "Alumno" ? "Opcional si tiene usuario" : undefined}
        />

        {/* DatePicker MUI */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Fecha de nacimiento{" "}
            {isAlumno && <span className="text-rose-500">*</span>}
          </label>
          <div className="mt-1">
            <WhiteDatePicker
              label="Fecha de Nacimiento"
              format="DD/MM/YYYY"
              value={fechaNac}
              onChange={(newValue: Dayjs | null) => setFechaNac(newValue)}
              minDate={minDOB}
              maxDate={maxDOB}
              slotProps={{
                textField: { 
                  helperText: errors.fechaNac || (isAlumno ? "Debe tener al menos 5 años" : "(opcional)"),
                  error: touched.fechaNac && !!errors.fechaNac,
                },
                popper: {
                  disablePortal: false,
                  sx: { zIndex: 2100 },
                },
              }}
            />
          </div>
        </div>

        {/* Género (Obligatorio) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Género <span className="text-rose-500">*</span>
          </label>
          <select
            value={genero ?? ""}
            onChange={(e) => {
              const val = (e.target.value || null) as UserFormOutput["genero"];
              setGenero(val);
              if (touched.genero) {
                 const res = validateGenero(val);
                 setErrors(prev => ({ ...prev, genero: res.error || '' }));
              }
            }}
            onBlur={() => handleBlur('genero')}
            className={`w-full rounded-xl border px-4 py-3 text-base bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              touched.genero && errors.genero 
                ? "border-rose-500 ring-rose-500" 
                : "border-slate-300 dark:border-slate-700"
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

        {/* Username */}
        <ValidatedInput
          label="Usuario"
          value={username}
          onChange={(e) => setUsername(normalizeUsername(e.target.value))}
          onBlur={() => handleBlur('username')}
          error={errors.username}
          touched={touched.username}
          placeholder="alumno_123 (a-z, 0-9, _)"
          helpText={isAlumno ? "Si no tiene email. 3–24 caracteres: a–z, 0–9 y _" : "Opcional"}
          autoComplete="username"
        />

        {/* Password (solo creación) */}
        {mode === "create" && (
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Contraseña <span className="text-slate-400">(opcional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                aria-pressed={showPass}
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <ValidatedInput
              label="" // Label handled above for custom layout
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              error={errors.password}
              touched={touched.password}
              placeholder="Mín. 6 caracteres"
              autoComplete="new-password"
              showValidIcon={false} // Custom layout makes icon tricky, simplifying
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-200 dark:bg-slate-600/40 px-5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600/60 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}