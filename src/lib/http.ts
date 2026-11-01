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
export async function jget<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "GET",
    headers: authHeaders((init?.headers as Record<string, string>) || {}),
  });
  const t = await r.text();
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    throw new Error(t || `HTTP ${r.status}`);
  }
  return t ? JSON.parse(t) : ({} as T);
}
export async function jpost<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    }),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    throw new Error(t || `HTTP ${r.status}`);
  }
  return t ? JSON.parse(t) : ({} as T);
}
export async function jput<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    }),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    throw new Error(t || `HTTP ${r.status}`);
  }
  return t ? JSON.parse(t) : ({} as T);
}
export async function jpatch<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    method: "PATCH",
    headers: authHeaders({
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    }),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    throw new Error(t || `HTTP ${r.status}`);
  }
  return t ? JSON.parse(t) : ({} as T);
}
