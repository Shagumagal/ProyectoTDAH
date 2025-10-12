import { authHeaders } from "../../../lib/http";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface MeData {
  id: number;
  nombres: string;
  apellidos: string;
  email: string | null;
  username: string | null;
  rol: string;
  activo: boolean;
}

export async function getMe(): Promise<MeData> {
  const res = await fetch(`${API_URL}/me`, { headers: authHeaders() });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "No se pudo cargar el perfil");
  return JSON.parse(txt) as MeData;
}

export async function updateMe(payload: {
  nombres?: string;
  apellidos?: string;
  email?: string | null | "";
  username?: string | null | "";
}) {
  const res = await fetch(`${API_URL}/me`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "No se pudo actualizar el perfil");
  return JSON.parse(txt);
}

export async function changeMyPassword(current_password: string, new_password: string) {
  const res = await fetch(`${API_URL}/me/password`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ current_password, new_password }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "No se pudo cambiar la contraseña");
  return JSON.parse(txt);
}
