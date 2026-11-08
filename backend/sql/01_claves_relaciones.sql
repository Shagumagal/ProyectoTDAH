-- =====================================================================
-- Claves primarias y foráneas del esquema app (Supabase)
-- Diagnóstico previo (2026-11-08): 0 ids duplicados, 0 filas huérfanas.
-- Ejecutar completo en Supabase > SQL Editor (o pgAdmin > Query Tool).
-- Va dentro de una transacción: si algo falla, NO se aplica nada.
-- Para deshacer: 02_deshacer_claves.sql
-- =====================================================================
BEGIN;

-- ---------- 1) Claves primarias que faltan ----------
ALTER TABLE app.usuarios               ADD CONSTRAINT usuarios_pkey               PRIMARY KEY (id);
ALTER TABLE app.roles                  ADD CONSTRAINT roles_pkey                  PRIMARY KEY (id);
ALTER TABLE app.pruebas                ADD CONSTRAINT pruebas_pkey                PRIMARY KEY (id);
ALTER TABLE app.sesiones               ADD CONSTRAINT sesiones_pkey               PRIMARY KEY (id);
ALTER TABLE app.nn_predicciones        ADD CONSTRAINT nn_predicciones_pkey        PRIMARY KEY (id);
ALTER TABLE app.sesion_metricas        ADD CONSTRAINT sesion_metricas_pkey        PRIMARY KEY (id);
ALTER TABLE app.usuarios_estado_log    ADD CONSTRAINT usuarios_estado_log_pkey    PRIMARY KEY (id);
ALTER TABLE app.usuarios_password_log  ADD CONSTRAINT usuarios_password_log_pkey  PRIMARY KEY (id);

-- ---------- 2) Claves foráneas ----------
-- Sin ON DELETE CASCADE a propósito: nunca se borran datos en cadena.
ALTER TABLE app.usuarios        ADD CONSTRAINT usuarios_rol_fk            FOREIGN KEY (rol_id)        REFERENCES app.roles(id);

ALTER TABLE app.sesiones        ADD CONSTRAINT sesiones_alumno_fk         FOREIGN KEY (alumno_id)     REFERENCES app.usuarios(id);
ALTER TABLE app.sesiones        ADD CONSTRAINT sesiones_prueba_fk         FOREIGN KEY (prueba_id)     REFERENCES app.pruebas(id);

ALTER TABLE app.resultados      ADD CONSTRAINT resultados_alumno_fk       FOREIGN KEY (alumno_id)     REFERENCES app.usuarios(id);
ALTER TABLE app.resultados      ADD CONSTRAINT resultados_prueba_fk       FOREIGN KEY (prueba_id)     REFERENCES app.pruebas(id);
ALTER TABLE app.resultados      ADD CONSTRAINT resultados_sesion_fk       FOREIGN KEY (sesion_id)     REFERENCES app.sesiones(id);
ALTER TABLE app.resultados      ADD CONSTRAINT resultados_prediccion_fk   FOREIGN KEY (prediccion_id) REFERENCES app.nn_predicciones(id);

ALTER TABLE app.nn_predicciones ADD CONSTRAINT nn_predicciones_alumno_fk  FOREIGN KEY (alumno_id)     REFERENCES app.usuarios(id);
ALTER TABLE app.nn_predicciones ADD CONSTRAINT nn_predicciones_sesion_fk  FOREIGN KEY (sesion_id)     REFERENCES app.sesiones(id);

ALTER TABLE app.sesion_metricas ADD CONSTRAINT sesion_metricas_sesion_fk  FOREIGN KEY (sesion_id)     REFERENCES app.sesiones(id);

ALTER TABLE app.game_sessions   ADD CONSTRAINT game_sessions_user_fk      FOREIGN KEY (user_id)       REFERENCES app.usuarios(id);

ALTER TABLE app.usuarios_estado_log   ADD CONSTRAINT estado_log_usuario_fk      FOREIGN KEY (usuario_id)    REFERENCES app.usuarios(id);
ALTER TABLE app.usuarios_estado_log   ADD CONSTRAINT estado_log_cambiado_por_fk FOREIGN KEY (cambiado_por)  REFERENCES app.usuarios(id);
ALTER TABLE app.usuarios_password_log ADD CONSTRAINT password_log_usuario_fk    FOREIGN KEY (usuario_id)    REFERENCES app.usuarios(id);
ALTER TABLE app.usuarios_password_log ADD CONSTRAINT password_log_realizado_fk  FOREIGN KEY (realizado_por) REFERENCES app.usuarios(id);

-- Nota: app.resultados_api.user_id es bigint y usuarios.id es uuid -> no se puede relacionar
-- (tabla heredada de una versión anterior; se deja como está).

COMMIT;
