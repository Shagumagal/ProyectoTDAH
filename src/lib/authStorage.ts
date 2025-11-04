// src/lib/authStorage.ts
const TOKEN_KEY = "auth_token";
const P2FA_KEY = "pending2fa"; // si recibes 2FA_REQUIRED, guardamos el user_id temporal

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setPending2FA(data: { user_id: string; email?: string; expires_in?: number }) {
  sessionStorage.setItem(P2FA_KEY, JSON.stringify(data));
}
export function getPending2FA(): { user_id: string; email?: string; expires_in?: number } | null {
  const s = sessionStorage.getItem(P2FA_KEY);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
export function clearPending2FA() {
  sessionStorage.removeItem(P2FA_KEY);
}
