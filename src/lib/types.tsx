// src/lib/types.ts
export type RolUI = "Alumno" | "Docente" | "Psicólogo" | "Admin";
export type Estado = "Activo" | "Inactivo";

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo?: string;          // opcional en UI
  rol: RolUI;               // incluye Admin
  estado: Estado;
  username?: string;        // algunos alumnos sin correo
   fecha_nacimiento?: string | null;
     genero?: string | null;  
}
