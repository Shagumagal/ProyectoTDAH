# Cómo conectar el proyecto a la base de datos

Guía para no depender del video. Sirve para montar el proyecto en otra computadora.

## Cómo está armado

```
Frontend (React, puerto 5173)  ──►  Backend Express (puerto 4000)  ──►  PostgreSQL
        VITE_API_URL                     backend/.env (PG*)              Supabase o local
```

- El **backend** se conecta a Postgres con la librería `pg` (archivo `backend/db.js`).
  Lee la conexión de las variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` de `backend/.env`.
- Si `PGHOST` es `localhost` usa conexión sin SSL; si es Supabase activa SSL automáticamente.
- **PostgREST no lo usa la app.** El archivo `postgrest.conf` es de una prueba anterior;
  el frontend habla solo con el backend en el puerto 4000. Las tablas viven en el esquema `app`.

## Opción A: conectarse a Supabase (producción)

1. Entrar a Supabase → proyecto `tdah-project` → botón **Connect** (arriba).
2. Elegir **Session pooler** (funciona en redes IPv4, la conexión "Direct" muchas veces no).
3. Copiar los datos al `backend/.env`:

   ```env
   PGHOST=aws-1-us-east-1.pooler.supabase.com
   PGPORT=5432
   PGDATABASE=postgres
   PGUSER=postgres.<id-del-proyecto>
   PGPASSWORD=<contraseña de la base>
   ```

   - El usuario del pooler **incluye el id del proyecto** (`postgres.xxxx`), no es solo `postgres`.
   - Si no recordás la contraseña: Supabase → Project Settings → Database → *Reset database password*
     (ojo: cambia también la que usa Render).

## Opción B: base local (PostgreSQL + pgAdmin)

1. Instalar PostgreSQL (incluye pgAdmin). Anotar la contraseña del usuario `postgres`.
2. En pgAdmin: crear la base (ej. `tdah`) y restaurar el backup / ejecutar el script del esquema.
3. En `backend/.env`:

   ```env
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=tdah
   PGUSER=postgres
   PGPASSWORD=<tu contraseña local>
   ```

> El `.env` tiene un bloque comentado (`#PGHOST=...`) y uno activo. Para cambiar entre local y
> Supabase, comentá uno y descomentá el otro. Solo puede quedar **uno** activo.

## Levantar todo

```bash
cd backend
npm install
npm run dev        # debe mostrar "PG config: { host: ..., database: ... }"
```

En otra terminal, en la raíz del proyecto:

```bash
npm install
npm run dev
```

El frontend usa `VITE_API_URL` (en `.env.local`); si no está, usa `http://localhost:4000`.

## Comprobar que conecta

Desde la carpeta `backend` (solo lee, no modifica nada):

```bash
node -e "require('dotenv').config();const{pool}=require('./db');pool.query('select count(*) from app.usuarios').then(r=>console.log('CONEXION OK',r.rows[0])).catch(e=>console.error('ERROR',e.message)).finally(()=>pool.end())"
```

Si imprime `CONEXION OK { count: '...' }`, la conexión funciona.

## Errores típicos al cambiar de computadora

| Error | Causa probable |
|---|---|
| `password authentication failed` | contraseña mal copiada, o usuario sin el `.id-del-proyecto` en Supabase |
| `ENOTFOUND` / `getaddrinfo` | `PGHOST` mal escrito, o usaste la conexión Direct (IPv6) en vez del pooler |
| `self signed certificate` / SSL | `PGHOST` no es localhost pero el servidor no tiene SSL (o al revés) |
| `relation "app.usuarios" does not exist` | conectado a otra base, o la base local no tiene el esquema restaurado |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL local no está iniciado |
| El frontend no trae datos | backend no está corriendo en el 4000, o `VITE_API_URL` apunta a otro lado |

**Importante:** `backend/.env` tiene contraseñas. No lo subas a git ni lo compartas; para llevarlo a
otra computadora copiálo a mano (USB, gestor de contraseñas).
