// src/features/students/servicces/students.services.ts
import type { Usuario } from "../../../lib/types";
import {
  createUser as createUserBase,
  updateUser as updateUserBase,
  setUserActive as setUserActiveBase,
} from "../../users/services/users.services";
import { authHeaders } from "../../../lib/http";            // ⬅️ IMPORTA EL HELPER

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function listStudents(q = ""): Promise<Usuario[]> {
  const url = new URL(`${API_URL}/users`);
  url.searchParams.set("role", "estudiante");
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), {
    headers: authHeaders(),                                   // ⬅️ AQUÍ
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "Error cargando alumnos");
  return txt ? (JSON.parse(txt) as Usuario[]) : [];
}

export async function createStudent(payload: {
  nombres: string;
  apellidos: string;
  email?: string;
  username?: string;
  password?: string; // opcional
}) {
  return createUserBase({ ...payload, rol: "estudiante" });
}

export async function updateStudent(id: string, payload: {
  nombres?: string;
  apellidos?: string;
  email?: string | null;
  username?: string | null;
}) {
  return updateUserBase(id, payload);
}

export async function setStudentActive(id: string, is_active: boolean) {
  return setUserActiveBase(id, is_active);
}
