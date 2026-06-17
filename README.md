# KG-Visit V2

Reconstrucción **moderna, propia y configurable** de **KG-Visit** — sistema de control de
acceso y gestión de visitantes para comunidades residenciales, corporativas e industriales
de **Kauil Group**. Clona y **supera** a la plataforma original (white-label de *VisitApp*),
dejando de depender de infraestructura de terceros.

## 🌐 En vivo (emulador para revisar cambios)
- **Panel de administración:** https://admin-web-lac-six.vercel.app
- **Acceso demo:** `admin@kg-demo.mx` / `KgVisit2026!` *(cambiar antes de producción)*
- **Backend:** Supabase `kg-visit-V2` (Postgres 17 + Auth + RLS) — ver `docs/08`.

> Cada push se redespliega y puede revisarse en el emulador.

## Arquitectura V2
- **Stack:** Next.js 16 (App Router, RSC) + React 19 + Tailwind v4 + @supabase/ssr · Vercel.
- **Backend:** Supabase (Postgres, Auth email/password, **RLS multi-tenant** por `residential_id`).
- **Seguridad:** UUID (anti-IDOR), RLS por fila, middleware de sesión, HTTPS; Next 16 (parchea CVE-2025-29927).
- **Motor declarativo:** cada entidad se define una vez (`lib/entities.ts`) y la ruta genérica
  `/m/[entity]` renderiza lista + alta/edición/baja/estatus. DRY y mantenible (mejor que las
  páginas hechas a mano del original).
- **Personalización por administrador:** cada tenant configura módulos (147 flags) y los **campos
  del formulario de visita** (`visit_field_configs`: qué campos, tipo, requerido, visible, nº de fotos).

## Estado por módulo (admin)
| Módulo | Estado |
|--------|--------|
| Dashboard (KPIs, horas pico, tipos de visita) | ✅ datos reales |
| Visitas (filtros + acciones: autorizar/dar acceso/salida/reportar/paquetería) | ✅ funcional |
| Departamentos (CRUD: alta/edición/moroso/eliminar) | ✅ funcional |
| Usuarios (hub + 5 secciones, CRUD real) | ✅ funcional |
| Autos y placas | ✅ datos reales |
| Motor `/m/[entity]` — servicios, transportes, proveedores, amenidades, casetas, cámaras, etiquetas, categorías, incidentes | ✅ CRUD |
| Reportes (hub + 14 sub-reportes con datos reales y rango de fechas) | ✅ funcional |
| Configuración (56 flags + modo) + editor de **campos de visita** | ✅ funcional |
| Avisos · Sugerencias · Lista negra · Sedes | 🟡 UI (datos por conectar) |

## Documentación (`docs/`)
| # | Documento |
|---|-----------|
| 01 | Sistema actual (V1) |
| 02 | Arquitectura técnica V1 (Phoenix/Elixir + Absinthe GraphQL) |
| 03 | Auditoría de seguridad (pentest no destructivo) |
| 04 | Plan de modernización + tabla de stacks |
| 05 | Modelo de datos completo (introspección GraphQL) |
| 06 | Catálogo de API GraphQL (90 queries / 110 mutations) |
| 07 | Cobertura de módulos y botones |
| 08 | Backend Supabase (en vivo) |
| 09 | Blueprint de apps móviles (probadas en MuMu) |
| 10 | Cobertura de datos (42 entidades, gaps + DDL) |
| 11 | Rutas del admin original (86 rutas) |
| 12 | App residente (22 pantallas) |
| 13 | App caseta (16 pantallas) |
| 14 | Personalización por admin (147 opciones + DDL) |
| 15 | Híbrido configurable (apps) |
| 16 | Auditoría de salud de rutas V2 |
| 17 | Gaps vs portal original |

## Estructura del repo
```
apps/admin-web/        Panel de administración (Next.js 16)
  src/app/(app)/       Rutas con shell (sidebar + topbar)
  src/app/(app)/m/[entity]/   Motor declarativo de CRUD
  src/lib/             entities, crud, data, supabase, types, nav, sections
supabase/
  migrations/          0001 esquema · 0002 RLS · 0003 hardening · 0004 roles · 0005 campos config
  seed.sql · policies.sql
docs/                  01–17 (análisis, auditorías, specs)
```

## Correr en local
```bash
cd apps/admin-web
cp .env.example .env.local   # añade URL + anon key de Supabase
npm install
npm run dev                  # http://localhost:3000  (login requerido)
```

## Roadmap (hacia el clon completo + "mejor que el original")
1. **Apps móviles Expo** — residente (21 pantallas) + caseta (16), superset configurable que consume los flags del tenant.
2. **Entidades con relaciones** en el motor — Eventos, Reservaciones, Empleados domésticos (selectores FK).
3. Conectar Avisos / Lista negra / Sugerencias a datos reales + acciones.
4. Aplicar DDL de gaps (`docs/10`) para cobertura 100% de lo almacenable.
5. Endurecimiento final + pentest autorizado + observabilidad.

---
*Construido con Claude Code. Análisis, esquema, motor y despliegue documentados en `docs/` y en el historial de commits.*
