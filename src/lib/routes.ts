export const ROUTES = {
  login: "/login",
  app: "/app",
  usuarios: "/app/usuarios",
  videojuego: "/app/videojuego",
  resultados: "/app/resultados",
  resultadosJuego: "/app/resultados-juego", // NUEVA RUTA
  resultadoById: "/app/resultados/:id",
  authCode: "/auth/code",
  alumnos: "/app/alumnos",
  forgot: "/auth/forgot",
  reset: "/auth/reset",
  perfil: "/app/perfil",
  captcha: "/app/captcha",
  analisisIA: "/app/analisis-ia"
} as const;