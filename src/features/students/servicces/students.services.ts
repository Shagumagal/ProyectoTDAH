import type { Usuario } from "../../../lib/types";
import {
  createUser as createUserBase,
  updateUser as updateUserBase,
  setUserActive as setUserActiveBase,
} from "../../users/services/users.services";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function listStudents(q = ""): Promise<Usuario[]> {
  const url = new URL(`${API_URL}/users`);
  url.searchParams.set("role", "estudiante");
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString());
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "Error cargando alumnos");
  return txt ? (JSON.parse(txt) as Usuario[]) : [];
}

export async function createStudent(payload: {
  nombres: string;
  apellidos: string;
  email?: string;
  username?: string;
  password?: string; // opcional; si no mandas y no hay email se generará código temporal
}) {
  return createUserBase({ ...payload, rol: "estudiante" });
}

export async function updateStudent(id: string, payload: {
  nombres?: string;
  apellidos?: string;
  email?: string | null;
  username?: string | null;
}) {
  // Nota: el rol no se cambia aquí; alumnos permanecen como 'estudiante'
  return updateUserBase(id, payload);
}

export async function setStudentActive(id: string, is_active: boolean) {
  return setUserActiveBase(id, is_active);
}
