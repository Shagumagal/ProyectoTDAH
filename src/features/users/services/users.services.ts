// src/features/users/services/users.services.ts
import type { Usuario } from "../../../lib/types";
import { authHeaders } from "../../../lib/http";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type RoleDb = "estudiante" | "profesor" | "psicologo" | "admin";

export interface CreateUserPayload {
  nombres: string;
  apellidos: string;
  rol: RoleDb;
  email?: string;
  username?: string;
  password?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
}

export interface CreateUserResp {
  id: string;
  login_code?: string | null;
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResp> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      rol: payload.rol,
      email: payload.email ?? "",
      username: payload.username ?? "",
      password: payload.password ?? "",
      fecha_nacimiento: payload.fecha_nacimiento ?? "", // 👈 AHORA SE ENVÍA
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Error al crear usuario");
  return text ? (JSON.parse(text) as CreateUserResp) : { id: "" };
}

export async function getUsers(): Promise<Usuario[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: authHeaders(),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "Error cargando usuarios");
  return txt ? (JSON.parse(txt) as Usuario[]) : [];
}

export async function updateUser(
  id: string,
  payload: {
    nombres?: string;
    apellidos?: string;
    rol?: RoleDb;
    email?: string | null;
    username?: string | null;
    fecha_nacimiento?: string | null; // 👈 AHORA SOPORTADO
    must_change_password?: boolean;
  }
) {
  // Construimos body explícito para controlar NULL/"" y evitar mandar undefined
  const body: any = {};
  if (payload.nombres !== undefined) body.nombres = payload.nombres;
  if (payload.apellidos !== undefined) body.apellidos = payload.apellidos;
  if (payload.rol !== undefined) body.rol = payload.rol;
  if (payload.email !== undefined) body.email = payload.email ?? "";
  if (payload.username !== undefined) body.username = payload.username ?? "";
  if (payload.fecha_nacimiento !== undefined) {
    body.fecha_nacimiento = payload.fecha_nacimiento ?? ""; // "" -> NULL en el back
  }
  if (payload.must_change_password !== undefined) {
    body.must_change_password = payload.must_change_password;
  }

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "Error actualizando usuario");
  return txt ? JSON.parse(txt) : {};
}

export async function setUserActive(id: string, is_active: boolean) {
  const res = await fetch(`${API_URL}/users/${id}/status`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
