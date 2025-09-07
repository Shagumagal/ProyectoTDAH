// src/features/users/services/users.service.ts
import type { Usuario } from "../../../lib/types";  // ⬅️ FALTABA

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type RoleDb = "estudiante" | "profesor" | "psicologo" | "admin";

export interface CreateUserPayload {
  nombres: string;
  apellidos: string;
  rol: RoleDb;        // valores exactos del backend
  email?: string;
  username?: string;
  password?: string;  // opcional
}

export interface CreateUserResp {
  id: string;
  login_code?: string | null;
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResp> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Error al crear usuario");
  return text ? (JSON.parse(text) as CreateUserResp) : { id: "" };
}

export async function getUsers(): Promise<Usuario[]> {
  const res = await fetch(`${API_URL}/users`);
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "Error cargando usuarios");
  return txt ? (JSON.parse(txt) as Usuario[]) : [];
}

//Actualizar usuario
export async function updateUser(id: string, payload: {
  nombres?: string; apellidos?: string; rol?: string; email?: string | null; username?: string | null; must_change_password?: boolean;
}) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setUserActive(id: string, is_active: boolean) {
  const res = await fetch(`${API_URL}/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}