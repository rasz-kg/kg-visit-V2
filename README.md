# KG-Visit V2

Modernización de **KG-Visit**, sistema de control de acceso y gestión de visitantes
para fraccionamientos / comunidades residenciales de **Kauil Group**.

Este repositorio contiene el análisis del sistema actual (V1), la auditoría de
seguridad, y el diseño + implementación de la nueva versión modernizada (V2).

## Contexto

KG-Visit está actualmente desplegado como un *white-label* sobre la plataforma
**VisitApp** (`visitapp.io`). No existe código fuente propio en control de versiones;
el sistema V1 vive únicamente como:

- **Portal web de administración** — `https://admin.kg-visit.com` (Laravel, server-rendered)
- **App de residentes (colonos)** — `com.kgvisit.app` v1.1 (React Native)
- **App de caseta / guardia** — `com.kgvisit.guard` v1.0.0 (React Native)
- **App EVR** — `com.kauilgroup.evr` v1.0 (Capacitor/Ionic) — producto relacionado
- **Backend / API** — `administracion.visitapp.io`, `tablets.visitapp.io` (VisitApp)
- **Almacenamiento** — `mega-visitapp.s3.amazonaws.com` (AWS S3)

El objetivo de V2 es **recrear el sistema de forma independiente y moderna**, dejando
de depender de la plataforma VisitApp y corrigiendo las deficiencias detectadas.

## Estructura del repositorio

| Documento | Contenido |
|-----------|-----------|
| [docs/01-sistema-actual.md](docs/01-sistema-actual.md) | Funcionalidad y módulos del sistema V1 |
| [docs/02-arquitectura.md](docs/02-arquitectura.md) | Arquitectura técnica actual (apps, backend, infra) |
| [docs/03-auditoria-seguridad.md](docs/03-auditoria-seguridad.md) | Hallazgos de seguridad y vulnerabilidades |
| [docs/04-plan-modernizacion.md](docs/04-plan-modernizacion.md) | Plan, tabla de stacks y arquitectura propuesta para V2 |
| [docs/05-modelo-datos.md](docs/05-modelo-datos.md) | Modelo de datos completo (derivado de GraphQL) |
| [docs/06-api-graphql.md](docs/06-api-graphql.md) | Catálogo de la API GraphQL del sistema V1 |
| [docs/07-cobertura-modulos.md](docs/07-cobertura-modulos.md) | Cobertura módulo-por-módulo y botón-por-botón (V1→V2) |
| [supabase/](supabase/) | Esquema SQL + RLS + datos demo para arrancar la V2 |
| [apps/admin-web/](apps/admin-web/) | **Panel de administración V2** (Next.js 15 + Tailwind v4) |

## Estado

✅ **Fase 1 — Análisis y auditoría** (completa)

- Inventario de apps y backend · mapa del portal · auditoría de seguridad activa (no destructiva)
- **Modelo de datos completo** recuperado por introspección de GraphQL
- Esquema Postgres/Supabase + datos demo (`supabase/`)
- Validación funcional de apps residente y caseta en MuMuPlayer

🟡 **Fase 2 — Construcción** (en curso)

- ✅ Stack: **Supabase + Next.js 15 + Tailwind v4** (web), Expo (apps) — ver `docs/04`
- ✅ Panel de administración (`apps/admin-web`): shell responsivo + 13 módulos, build OK
- ✅ Cobertura módulos/botones documentada (`docs/07`) — enfoque residencial + corporativo/industrial
- ⬜ Conectar Supabase (auth + RLS) sustituyendo datos mock
- ⬜ Apps móviles `apps/guard` y `apps/resident` (Expo)

> Análisis generado mediante inspección de las APKs instaladas (MuMuPlayer) y revisión
> del portal de administración en vivo. Ver historial de commits para el detalle.
