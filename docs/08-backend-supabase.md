# 08 — Backend Supabase (en vivo)

Proyecto **kg-visit-V2** conectado y operativo.

| Dato | Valor |
|------|-------|
| Project ref | `ljzzuwltgezvwpelavdz` |
| URL | `https://ljzzuwltgezvwpelavdz.supabase.co` |
| Región | us-east-2 · Postgres 17 |
| Estado | ACTIVE_HEALTHY |

## Migraciones aplicadas
1. `0001_schema_inicial` — 31 tablas, enums, índices, triggers `updated_at`, **RLS activado** en todas.
2. `0002_rls_policies` — helpers `current_residential_id()` / `current_is_admin()` (security definer) +
   políticas por tenant (lectura para `authenticated` del tenant; escritura para admin/supervisor).
3. `0003_harden_functions` — `search_path` fijo en `set_updated_at`; `revoke execute` a `anon` en los helpers.

Datos demo cargados (1 fraccionamiento, 3 roles, 5 domicilios, 3 usuarios, 2 visitantes, 7 servicios,
2 visitas, placas, reservación, ticket, avisos).

## Autenticación
- **Supabase Auth (email/password)**. Sesión por cookies vía `@supabase/ssr`.
- Cada `auth.users` se enlaza a `public.users.auth_user_id`; el rol vive en `public.rols`.
- **RLS** aísla por `residential_id` (multi-tenant) y restringe escritura a admin/supervisor.

### Usuario demo
- **admin@kg-demo.mx** / `KgVisit2026!` (rol admin). ⚠️ Cambiar/eliminar antes de producción.

## Seguridad (advisors)
Sin issues de nivel **ERROR**. WARNs restantes (no bloqueantes), a resolver para producción:
- `citext` instalada en schema `public` (mover a `extensions`).
- Helpers `SECURITY DEFINER` ejecutables por `authenticated` vía RPC (necesario para RLS; aceptable).
- **Leaked password protection** deshabilitada → activar en Auth (HaveIBeenPwned).
- Recomendado: MFA para administradores, expiración de sesión, rotación de llaves.

## Conexión desde la app
`apps/admin-web/.env.local` (no versionado):
```
NEXT_PUBLIC_SUPABASE_URL=https://ljzzuwltgezvwpelavdz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
La capa `src/lib/data.ts` lee vía el cliente SSR (RLS por sesión) y **degrada a datos demo** si faltan envs
o hay error — la app nunca se rompe.
