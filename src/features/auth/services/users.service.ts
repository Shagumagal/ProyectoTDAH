const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type CreateUserPayload = {
  nombres: string;
  apellidos: string;
  rol: "estudiante" | "profesor" | "psicologo" | "admin";
  email?: string;
  username?: string;
  password?: string; // opcional
};

export async function createUser(payload: CreateUserPayload): Promise<{ id: string; login_code?: string | null }> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || "Error al crear usuario");
  return txt ? JSON.parse(txt) : { id: "" };
}
