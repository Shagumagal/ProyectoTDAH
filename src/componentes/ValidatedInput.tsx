// src/componentes/ValidatedInput.tsx
import React from 'react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
  helpText?: string;
  required?: boolean;
  showValidIcon?: boolean;
}

/**
 * Input con validación visual integrada
 */
export default function ValidatedInput({
  label,
  error,
  touched = false,
  helpText,
  required = false,
  showValidIcon = true,
  className = '',
  ...inputProps
}: ValidatedInputProps) {
  const hasError = touched && error;
  const isValid = touched && !error && inputProps.value;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          {...inputProps}
          className={`
            w-full rounded-xl border px-4 py-3 text-base
            transition-all duration-200
            ${hasError
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10 text-rose-900 dark:text-rose-100 focus:ring-rose-500'
              : isValid && showValidIcon
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100 focus:ring-emerald-500'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        />
        
        {/* Icono de validación */}
        {showValidIcon && touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError ? (
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : isValid ? (
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : null}
          </div>
        )}
      </div>

      {/* Mensaje de error o ayuda */}
      {hasError ? (
        <p className="text-sm text-rose-600 dark:text-rose-400 flex items-start gap-1">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      ) : helpText ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{helpText}</p>
      ) : null}
    </div>
  );
}
