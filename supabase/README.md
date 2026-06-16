# Base de datos KG-Visit V2 (Supabase / PostgreSQL)

Estructura inicial + datos demo para empezar a poblar el sistema.

## Archivos
- `migrations/0001_schema_inicial.sql` — esquema completo (tablas, enums, índices, RLS on).
- `policies.sql` — políticas RLS de arranque (aislamiento por tenant + escritura admin).
- `seed.sql` — datos demo funcionales (1 fraccionamiento, roles, casas, usuarios, visitas…).

## Cómo cargarlo

### Opción A — Supabase Cloud (rápido)
1. Crea un proyecto en https://supabase.com.
2. SQL Editor → pega y ejecuta, **en este orden**:
   `0001_schema_inicial.sql` → `policies.sql` → `seed.sql`.
3. El seed se inserta con `service_role` (omite RLS), así que carga sin fricción.

### Opción B — Supabase CLI (local)
```bash
supabase init
# coloca 0001_schema_inicial.sql en supabase/migrations/
supabase start
supabase db reset            # aplica migración + seed.sql automáticamente
```

## Credenciales demo (orientativas)
El seed crea usuarios de ejemplo (sin contraseña real; el login se hará vía Supabase Auth):
- **Admin** — `admin@kg-demo.mx` (rol admin)
- **Guardia** — `guardia@kg-demo.mx` (rol guardia)
- **Residente** — `jperez@kg-demo.mx` (rol residente, casa "Cobra 101")

> Para activar el login real: crea estos usuarios en **Supabase Auth** y enlaza
> `users.auth_user_id = auth.users.id`. Hasta entonces, RLS sólo deja pasar al
> `service_role`. Ver `policies.sql` para el modelo de permisos.

## Notas de diseño
- **UUID** en vez de IDs enteros secuenciales (elimina el IDOR del sistema V1).
- **Multi-tenant** por `residential_id` + RLS activado por defecto.
- `residentials.settings (jsonb)` guarda la cola larga de *feature flags* (V1 tenía 130+).
- Tipos correctos (timestamptz, numeric, boolean) en vez de String como en V1.
