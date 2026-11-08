-- =====================================================================
-- Esquema DEMO "app_modelo": copia SOLO de la estructura de app (sin datos)
-- con todas las claves primarias y foráneas, para mostrar el modelo relacional.
-- No toca el esquema app: la aplicación sigue igual.
-- Para borrarlo: DROP SCHEMA app_modelo CASCADE;
-- =====================================================================
BEGIN;

CREATE SCHEMA app_modelo;

-- Copia de columnas y tipos (sin datos, sin defaults para no usar las secuencias reales)
CREATE TABLE app_modelo.roles                 (LIKE app.roles                 INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.pruebas               (LIKE app.pruebas               INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.usuarios              (LIKE app.usuarios              INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.sesiones              (LIKE app.sesiones              INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.nn_predicciones       (LIKE app.nn_predicciones       INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.resultados            (LIKE app.resultados            INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.metricas_hiperactividad (LIKE app.metricas_hiperactividad INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.sesion_metricas       (LIKE app.sesion_metricas       INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.game_sessions         (LIKE app.game_sessions         INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.usuarios_estado_log   (LIKE app.usuarios_estado_log   INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE app_modelo.usuarios_password_log (LIKE app.usuarios_password_log INCLUDING ALL EXCLUDING DEFAULTS);

-- Claves primarias (las que ya existían en app se copiaron con INCLUDING ALL)
ALTER TABLE app_modelo.roles                 ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.pruebas               ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.usuarios              ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.sesiones              ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.nn_predicciones       ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.sesion_metricas       ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.usuarios_estado_log   ADD PRIMARY KEY (id);
ALTER TABLE app_modelo.usuarios_password_log ADD PRIMARY KEY (id);

-- Claves foráneas
ALTER TABLE app_modelo.usuarios        ADD FOREIGN KEY (rol_id)        REFERENCES app_modelo.roles(id);
ALTER TABLE app_modelo.sesiones        ADD FOREIGN KEY (alumno_id)     REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.sesiones        ADD FOREIGN KEY (prueba_id)     REFERENCES app_modelo.pruebas(id);
ALTER TABLE app_modelo.resultados      ADD FOREIGN KEY (alumno_id)     REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.resultados      ADD FOREIGN KEY (prueba_id)     REFERENCES app_modelo.pruebas(id);
ALTER TABLE app_modelo.resultados      ADD FOREIGN KEY (sesion_id)     REFERENCES app_modelo.sesiones(id);
ALTER TABLE app_modelo.resultados      ADD FOREIGN KEY (prediccion_id) REFERENCES app_modelo.nn_predicciones(id);
ALTER TABLE app_modelo.metricas_hiperactividad ADD FOREIGN KEY (resultado_id) REFERENCES app_modelo.resultados(id);
ALTER TABLE app_modelo.nn_predicciones ADD FOREIGN KEY (alumno_id)     REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.nn_predicciones ADD FOREIGN KEY (sesion_id)     REFERENCES app_modelo.sesiones(id);
ALTER TABLE app_modelo.sesion_metricas ADD FOREIGN KEY (sesion_id)     REFERENCES app_modelo.sesiones(id);
ALTER TABLE app_modelo.game_sessions   ADD FOREIGN KEY (user_id)       REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.usuarios_estado_log   ADD FOREIGN KEY (usuario_id)    REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.usuarios_estado_log   ADD FOREIGN KEY (cambiado_por)  REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.usuarios_password_log ADD FOREIGN KEY (usuario_id)    REFERENCES app_modelo.usuarios(id);
ALTER TABLE app_modelo.usuarios_password_log ADD FOREIGN KEY (realizado_por) REFERENCES app_modelo.usuarios(id);

COMMIT;
