const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Resp = { user_id: string; role: "admin" | "profesor" | "psicologo" | "estudiante"; must_change: boolean };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const txt = await res.text();
  if (!res.ok) {
    let msg = "Error de servidor";
    try { msg = (JSON.parse(txt)?.error) || msg; } catch {}
    throw new Error(msg);
  }
  return txt ? (JSON.parse(txt) as T) : ({} as T);
}

export async function loginPassword(identifier: string, password: string): Promise<Resp> {
  return post<Resp>("/auth/login-password", { identifier, password });
}

export async function loginWithCode(username: string, code: string): Promise<Resp> {
  return post<Resp>("/auth/login-code", { username, code });
}
