-- Deshace 01_claves_relaciones.sql (deja la base como estaba). No borra datos.
BEGIN;
ALTER TABLE app.usuarios_password_log DROP CONSTRAINT IF EXISTS password_log_realizado_fk;
ALTER TABLE app.usuarios_password_log DROP CONSTRAINT IF EXISTS password_log_usuario_fk;
ALTER TABLE app.usuarios_estado_log   DROP CONSTRAINT IF EXISTS estado_log_cambiado_por_fk;
ALTER TABLE app.usuarios_estado_log   DROP CONSTRAINT IF EXISTS estado_log_usuario_fk;
ALTER TABLE app.game_sessions         DROP CONSTRAINT IF EXISTS game_sessions_user_fk;
ALTER TABLE app.sesion_metricas       DROP CONSTRAINT IF EXISTS sesion_metricas_sesion_fk;
ALTER TABLE app.nn_predicciones       DROP CONSTRAINT IF EXISTS nn_predicciones_sesion_fk;
ALTER TABLE app.nn_predicciones       DROP CONSTRAINT IF EXISTS nn_predicciones_alumno_fk;
ALTER TABLE app.resultados            DROP CONSTRAINT IF EXISTS resultados_prediccion_fk;
ALTER TABLE app.resultados            DROP CONSTRAINT IF EXISTS resultados_sesion_fk;
ALTER TABLE app.resultados            DROP CONSTRAINT IF EXISTS resultados_prueba_fk;
ALTER TABLE app.resultados            DROP CONSTRAINT IF EXISTS resultados_alumno_fk;
ALTER TABLE app.sesiones              DROP CONSTRAINT IF EXISTS sesiones_prueba_fk;
ALTER TABLE app.sesiones              DROP CONSTRAINT IF EXISTS sesiones_alumno_fk;
ALTER TABLE app.usuarios              DROP CONSTRAINT IF EXISTS usuarios_rol_fk;

ALTER TABLE app.usuarios_password_log DROP CONSTRAINT IF EXISTS usuarios_password_log_pkey;
ALTER TABLE app.usuarios_estado_log   DROP CONSTRAINT IF EXISTS usuarios_estado_log_pkey;
ALTER TABLE app.sesion_metricas       DROP CONSTRAINT IF EXISTS sesion_metricas_pkey;
ALTER TABLE app.nn_predicciones       DROP CONSTRAINT IF EXISTS nn_predicciones_pkey;
ALTER TABLE app.sesiones              DROP CONSTRAINT IF EXISTS sesiones_pkey;
ALTER TABLE app.pruebas               DROP CONSTRAINT IF EXISTS pruebas_pkey;
ALTER TABLE app.roles                 DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE app.usuarios              DROP CONSTRAINT IF EXISTS usuarios_pkey;
COMMIT;
