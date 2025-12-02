// src/lib/validation.ts

/**
 * Utilidades de validación centralizadas para formularios
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FieldValidation {
  value: string | null | undefined;
  rules: ValidationRule[];
}

export type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'minLength'; length: number; message?: string }
  | { type: 'maxLength'; length: number; message?: string }
  | { type: 'pattern'; regex: RegExp; message?: string }
  | { type: 'username'; message?: string }
  | { type: 'password'; message?: string }
  | { type: 'custom'; validator: (value: string) => boolean; message: string };

// Patrones comunes
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-z0-9_]{3,24}$/,
  // Contraseña: mínimo 6 caracteres, al menos una letra y un número
  passwordStrong: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  // Contraseña básica: solo mínimo 6 caracteres
  passwordBasic: /^.{6,}$/,
  // Solo letras y espacios (para nombres)
  nameLetters: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
  // Números de teléfono (formato flexible)
  phone: /^[\d\s\-\+\(\)]{7,20}$/,
};

// Mensajes de error por defecto
const DEFAULT_MESSAGES = {
  required: 'Este campo es obligatorio',
  email: 'Ingresa un correo electrónico válido',
  username: 'Usuario inválido (3-24 caracteres: a-z, 0-9, _)',
  password: 'La contraseña debe tener al menos 6 caracteres',
  passwordStrong: 'La contraseña debe tener al menos 6 caracteres, una letra y un número',
  minLength: (n: number) => `Debe tener al menos ${n} caracteres`,
  maxLength: (n: number) => `No debe exceder ${n} caracteres`,
  pattern: 'El formato no es válido',
  nameLetters: 'Solo se permiten letras y espacios',
  phone: 'Número de teléfono inválido',
};

/**
 * Valida un campo según las reglas especificadas
 */
export function validateField(value: string | null | undefined, rules: ValidationRule[]): ValidationResult {
  const val = (value || '').trim();

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!val) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.required };
        }
        break;

      case 'email':
        if (val && !PATTERNS.email.test(val)) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.email };
        }
        break;

      case 'minLength':
        if (val && val.length < rule.length) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.minLength(rule.length) };
        }
        break;

      case 'maxLength':
        if (val && val.length > rule.length) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.maxLength(rule.length) };
        }
        break;

      case 'pattern':
        if (val && !rule.regex.test(val)) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.pattern };
        }
        break;

      case 'username':
        if (val && !PATTERNS.username.test(val)) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.username };
        }
        break;

      case 'password':
        if (val && !PATTERNS.passwordBasic.test(val)) {
          return { isValid: false, error: rule.message || DEFAULT_MESSAGES.password };
        }
        break;

      case 'custom':
        if (val && !rule.validator(val)) {
          return { isValid: false, error: rule.message };
        }
        break;
    }
  }

  return { isValid: true };
}

/**
 * Valida múltiples campos a la vez
 */
export function validateFields(fields: Record<string, FieldValidation>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, field] of Object.entries(fields)) {
    const result = validateField(field.value, field.rules);
    if (!result.isValid) {
      errors[fieldName] = result.error!;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Validaciones específicas del dominio
 */
export const DomainValidators = {
  /**
   * Valida que la fecha de nacimiento sea de al menos 5 años atrás
   */
  isAtLeast5YearsOld: (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
    return date <= fiveYearsAgo && date >= new Date('1900-01-01');
  },

  /**
   * Valida que al menos uno de los campos tenga valor
   */
  requireAtLeastOne: (values: (string | null | undefined)[]): boolean => {
    return values.some(v => (v || '').trim().length > 0);
  },

  /**
   * Valida formato de nombre (solo letras y espacios)
   */
  isValidName: (name: string): boolean => {
    return PATTERNS.nameLetters.test(name.trim());
  },
};

/**
 * Hook personalizado para validación de formularios (opcional)
 * Puedes usarlo si quieres validación en tiempo real
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, ValidationRule[]>
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const validateSingleField = (fieldName: keyof T, value: any) => {
    const rules = validationRules[fieldName];
    if (!rules) return { isValid: true };
    
    return validateField(value, rules);
  };

  const handleChange = (fieldName: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Validar solo si el campo ya fue tocado
    if (touched[fieldName]) {
      const result = validateSingleField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: result.error,
      }));
    }
  };

  const handleBlur = (fieldName: keyof T) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const result = validateSingleField(fieldName, values[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.error,
    }));
  };

  const validateAll = (): boolean => {
    const fields: Record<string, FieldValidation> = {};
    
    for (const [key, rules] of Object.entries(validationRules)) {
      fields[key] = {
        value: values[key as keyof T],
        rules: rules as ValidationRule[],
      };
    }

    const { isValid, errors: newErrors } = validateFields(fields);
    setErrors(newErrors as any);
    
    // Marcar todos como tocados
    const allTouched: any = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
  };
}

// Necesitamos importar React para el hook
import React from 'react';
