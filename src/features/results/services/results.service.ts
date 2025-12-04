import { API_URL } from "../../../lib/http";
import type { ResultadosAlumno } from "../types";

export async function getStudentResults(studentId?: string): Promise<ResultadosAlumno> {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No token found");

  // If no studentId is provided, we assume the user wants their own results.
  // However, the backend endpoint /resultados/alumno/:id requires an ID.
  // We need to extract the ID from the token if not provided.
  let targetId = studentId;
  if (!targetId) {
    try {
      const base64 = token.split(".")[1];
      const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(decodeURIComponent(escape(json)));
      console.log("Token payload:", payload); // Debug log
      targetId = payload.id || payload.user_id || payload.sub; // Try common claims
    } catch (e) {
      console.error("Token parsing error:", e);
      throw new Error("Invalid token");
    }
  }

  if (!targetId) throw new Error("No student ID available");

  const res = await fetch(`${API_URL}/resultados/alumno/${targetId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error fetching results: ${res.statusText}`);
  }

  return res.json();
}
