// src/lib/http.ts
/**
 * Devuelve headers seguros para fetch.
 * Nunca incluye Authorization si no hay token (evita 'undefined').
 */
export function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = localStorage.getItem("auth_token");
  const base: Record<string, string> = { ...extra };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}
