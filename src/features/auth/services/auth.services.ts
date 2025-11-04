// src/features/auth/services/auth.services.ts
import { API_URL } from "../../../lib/http";

/* ===================== Tipos de respuesta del backend ===================== */
type Role = "admin" | "profesor" | "psicologo" | "estudiante";

type ApiOk = {
  status: "OK";
  token: string;
  user?: { id: string; role: Role; must_change?: boolean };
};

type Api2FA = {
  status: "2FA_REQUIRED";
  user_id: string;
  email?: string;
  expires_in?: number;
};

type ApiErr = { error?: string; message?: string };

type LoginPasswordResp = ApiOk | Api2FA | ApiErr;
type Verify2FAResp = ApiOk | ApiErr;
type LoginCodeResp = ApiOk | ApiErr;

/* ===================== Helpers de storage ===================== */
function saveToken(token?: string) {
  if (token) localStorage.setItem("auth_token", token);
}
function setPending2FA(data: { user_id: string; email?: string; expires_in?: number }) {
  sessionStorage.setItem("pending2fa", JSON.stringify(data));
}
function getPending2FA(): { user_id: string; email?: string; expires_in?: number } | null {
  const s = sessionStorage.getItem("pending2fa");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
export function logout() {
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("pending2fa");
}

/* ===================== Type guards para evitar TS2339 ===================== */
function hasStatus(x: unknown): x is { status: string } {
  return typeof x === "object" && x !== null && "status" in (x as any);
}
function isOk(x: unknown): x is ApiOk {
  return hasStatus(x) && (x as any).status === "OK";
}
function is2FA(x: unknown): x is Api2FA {
  return hasStatus(x) && (x as any).status === "2FA_REQUIRED";
}
function parseJSON<T = unknown>(txt: string): T | unknown {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return {};
  }
}
function extractError(data: any, fallback: string, res: Response) {
  return new Error(data?.error || data?.message || fallback || `HTTP ${res.status}`);
}

/* ===================== Servicios ===================== */

/** Login con contraseña (email/usuario + password) */
export async function loginPassword(identifier: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const txt = await res.text();
  const data: LoginPasswordResp | unknown = parseJSON<LoginPasswordResp>(txt);

  if (!res.ok) throw extractError(data, txt, res);

  if (is2FA(data)) {
    setPending2FA({
      user_id: data.user_id,
      email: data.email,
      expires_in: data.expires_in,
    });
    return { twofa: true as const };
  }

  if (isOk(data)) {
    saveToken(data.token);
    sessionStorage.removeItem("pending2fa");
    return { twofa: false as const };
  }

  throw new Error("Respuesta inesperada del servidor");
}

/** Login con código temporal (alumnos sin email) */
export async function loginWithCode(username: string, code: string) {
  const res = await fetch(`${API_URL}/auth/login-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, code }),
  });

  const txt = await res.text();
  const data: LoginCodeResp | unknown = parseJSON<LoginCodeResp>(txt);

  if (!res.ok) throw extractError(data, txt, res);

  if (isOk(data)) {
    saveToken(data.token);
    sessionStorage.removeItem("pending2fa");
    return { ok: true as const };
  }

  throw new Error("Código inválido o expirado");
}

/** Verificación del código 2FA */
export async function verify2FA(code6: string) {
  const p = getPending2FA();
  if (!p?.user_id) throw new Error("Sesión 2FA no encontrada");

  const res = await fetch(`${API_URL}/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: p.user_id, code: code6 }),
  });

  const txt = await res.text();
  const data: Verify2FAResp | unknown = parseJSON<Verify2FAResp>(txt);

  if (!res.ok) throw extractError(data, txt, res);

  if (isOk(data)) {
    saveToken(data.token);
    sessionStorage.removeItem("pending2fa");
    return { ok: true as const };
  }

  throw new Error("Código inválido o expirado");
}

/** Reenviar código 2FA */
export async function resend2FA() {
  const p = getPending2FA();
  if (!p?.user_id) throw new Error("Sesión 2FA no encontrada");

  const res = await fetch(`${API_URL}/auth/resend-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: p.user_id }),
  });

  const txt = await res.text();
  const data: any = parseJSON(txt);

  if (!res.ok) throw extractError(data, txt, res);
  return data;
}
