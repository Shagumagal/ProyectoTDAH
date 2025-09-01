export type Rol = "Alumno" | "Docente" | "Psicólogo" | "Administrador";


export type Usuario = {
id: string;
nombre: string;
apellido: string;
correo?: string;
rol: Rol;
estado: "Activo" | "Inactivo";
};