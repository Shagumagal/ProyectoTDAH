// src/lib/http.ts
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/** Devuelve headers seguros para fetch con Authorization si hay token */
export function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = localStorage.getItem("auth_token");
  const base: Record<string, string> = { ...extra };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

/** Helpers JSON (opcionales, por si quieres usarlos en más servicios) */
export async function jget<T = any>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, { ...init, method: "GET", headers: authHeaders(init?.headers as any) });
  const t = await r.text();
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  return t ? JSON.parse(t) : ({} as T);
}
export async function jpost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", ...(init?.headers as any) }),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  return t ? JSON.parse(t) : ({} as T);
}
export async function jput<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json", ...(init?.headers as any) }),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  return t ? JSON.parse(t) : ({} as T);
}
export async function jpatch<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json", ...(init?.headers as any) }),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  return t ? JSON.parse(t) : ({} as T);
}
