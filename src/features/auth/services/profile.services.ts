// src/features/auth/services/profile.services.ts
import { authHeaders } from "../../../lib/http";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/** Valores permitidos por el backend (o null) */
export type Gender =
  | "masculino"
  | "femenino"
  | null;

export interface MeData {
  id: number;
  nombres: string;
  apellidos: string;
  email: string | null;
  username: string | null;
  rol: string;
  activo: boolean;
  /** "YYYY-MM-DD" o null */
  fecha_nacimiento: string | null;
  /** uno de los permitidos o null */
  /** uno de los permitidos o null */
  genero: Gender;
  must_change_password?: boolean;
}

/** Obtener mi perfil */
export async function getMe(): Promise<MeData> {
  const res = await fetch(`${API_URL}/me`, { headers: authHeaders() });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "No se pudo cargar el perfil");
  return JSON.parse(txt) as MeData;
}

/** Actualizar mi perfil (cualquiera de los campos es opcional) */
export async function updateMe(payload: {
  nombres?: string;
  apellidos?: string;
  email?: string | null | "";
  username?: string | null | "";
  /** "YYYY-MM-DD" o null o "" para limpiar */
  fecha_nacimiento?: string | null | "";
  /** permitido o null/"" para limpiar */
  genero?: Gender | "";
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

/** Cambiar mi contraseña */
export async function changeMyPassword(
  current_password: string,
  new_password: string
) {
  const res = await fetch(`${API_URL}/me/password`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ current_password, new_password }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "No se pudo cambiar la contraseña");
  return JSON.parse(txt);
}

/** Útil para combos en el UI */
export const GENDERS: Exclude<Gender, null>[] = [
  "masculino",
  "femenino",
];
