# 04 — Plan de modernización (V2)

> Documento vivo. La selección final de stack y alcance está **pendiente de decisión**
> del propietario (ver sección "Decisiones abiertas").

## Objetivos de V2
1. **Soberanía de datos**: backend, base de datos y almacenamiento propios (sin VisitApp.io).
2. **Seguridad por diseño**: TLS en todo, authZ por objeto, secretos fuera del cliente,
   almacenamiento privado con URLs firmadas, MFA para administradores.
3. **Paridad funcional** con V1 (ver `01-sistema-actual.md`) y mejor UX.
4. **Mantenibilidad**: monorepo versionado, IaC, CI/CD, observabilidad.

## Arquitectura propuesta (recomendación inicial)

```
Monorepo (este repo)
├── apps/
│   ├── admin-web/     → Next.js (portal de administración)
│   ├── resident/      → Expo / React Native (app de residentes)
│   └── guard/         → Expo / React Native (app de caseta)
├── packages/
│   ├── ui/            → componentes compartidos
│   ├── api-client/    → SDK tipado del backend
│   └── types/         → modelos compartidos (zod/TS)
└── supabase/          → esquema, RLS, migraciones, edge functions
```

- **Backend/DB/Auth/Storage**: **Supabase** (Postgres + RLS + Auth + Storage privado).
  Aprovecha integración ya disponible; RLS resuelve el riesgo de IDOR (V-02) de raíz.
- **Web admin**: **Next.js** desplegado en **Vercel** (integración disponible).
- **Móvil**: **Expo (React Native)** para residentes y caseta — reutiliza conocimiento de V1.
- **Seguridad**: `network_security_config` sin cleartext, certificate pinning, URLs firmadas
  S3/Storage, expiración de sesión, MFA admin.

> Stacks alternativos posibles: mantener Laravel para el backend, o backend Node (NestJS).
> Ver "Decisiones abiertas".

## Fases

- **Fase 1 — Análisis y auditoría** *(en curso)*
  - [x] Inventario de apps y backend
  - [x] Mapa de módulos/rutas del portal
  - [x] Auditoría de seguridad estática
  - [ ] Crawl detallado de cada módulo → modelo de datos completo
  - [ ] Captura de flujos de las apps (residente y caseta) vía MuMuPlayer
- **Fase 2 — Diseño** — modelo de datos, contratos de API, esquema Supabase + RLS, diseño UI.
- **Fase 3 — Backend** — esquema, auth, RLS, storage, edge functions, migración de datos.
- **Fase 4 — Portal admin** — paridad funcional con `admin.kg-visit.com`.
- **Fase 5 — Apps móviles** — residente y caseta.
- **Fase 6 — Hardening + pruebas** — pentest autorizado, QA, observabilidad.
- **Fase 7 — Migración y corte** — migración de datos desde VisitApp, go-live.

## Decisiones abiertas (pendientes del propietario)
1. **Stack del backend**: Supabase (recomendado) vs. Laravel propio vs. Node/NestJS.
2. **Alcance de la fase intrusiva** de seguridad: ¿solo análisis pasivo, o pentest activo
   contra producción / staging?
3. **Origen de los datos**: ¿hay acceso a la base de datos de VisitApp para migración, o se
   reconstruye desde cero?
4. **Prioridad**: ¿empezar por el portal admin o por las apps móviles?
