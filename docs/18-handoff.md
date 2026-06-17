# 18 — HANDOFF (para continuar en otra conversación)

Documento de traspaso del proyecto **KG-Visit V2**. Estado real, honesto y verificado en vivo.
Léelo primero al retomar.

---
## 1. Accesos
| Recurso | Valor |
|---|---|
| **Emulador / portal en vivo** | https://admin-web-lac-six.vercel.app |
| **Login demo** | `admin@kg-demo.mx` / `KgVisit2026!` (cambiar antes de prod) |
| **GitHub** | `git@github.com:rasz-kg/kg-visit-V2.git` (rama `main`) |
| **Supabase** | proyecto `kg-visit-V2`, ref `ljzzuwltgezvwpelavdz`, us-east-2 |
| **Stack** | Next.js 16 + React 19 + Tailwind v4 + @supabase/ssr · Vercel |
| **Redeploy** | `cd apps/admin-web && vercel deploy --prod --yes --build-env NEXT_PUBLIC_SUPABASE_URL=… --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY=…` |

---
## 2. Auditoría REAL por ruta (corregida, probada en vivo)
> Nota de honestidad: una auditoría previa sobrevaloró la completitud. Esto es lo verificado clic-a-clic.

| Ruta | ¿Carga? | ¿Crear/editar? | Estado | Problema |
|------|--------|----------------|--------|----------|
| `/dashboard` | ✅ | n/a | 🟡 | KPIs y visitas recientes reales; **gráficas (horas pico, tipos) hardcodeadas** |
| `/visitas` | ✅ | acciones ✅ | 🟡 | Autorizar/Dar acceso/Salida/Reportar/Paquetería **funcionan**; faltan botón **Denegar** y cablear header (Nueva visita, QR Auto/Caminando son decorativos) |
| `/departamentos` | ✅ | ✅ CRUD real | ✅ | — (sin vista de detalle) |
| `/usuarios` + `/usuarios/[seccion]` | ✅ | ✅ CRUD real | ✅ | crear admin/guardia/etc. persiste (verificado) |
| `/m/[entity]` (9 módulos) | ✅ | ✅ CRUD real | ✅ | servicios, transportes, proveedores, amenidades, casetas, cámaras, etiquetas, categorías, incidentes — **verificado: alta persiste** |
| `/configuracion` + `/configuracion/campos` | ✅ | ✅ | ✅ | flags del tenant + editor de campos de visita |
| `/reportes` + `/reportes/[slug]` (14) | ✅ | n/a | ✅ | datos reales + rango de fechas |
| `/autos` | ✅ | ❌ | 🔴 | lee real pero **"Nueva placa" y "Leer placa (LPR)" sin handler** |
| `/avisos` | ✅ | ❌ | 🔴 | **datos demo + "Nuevo aviso" muerto** (verificado en vivo) |
| `/sugerencias` | ✅ | ❌ | 🔴 | datos demo, sin acciones |
| `/lista-negra` | ✅ | ❌ | 🔴 | datos demo, botones muertos |
| `/sedes` | ✅ | ❌ | 🔴 | datos demo, **"Nueva sede" muerto** |
| `/emulador` | ✅ | n/a | ✅ | **NUEVO** — simulador de las 2 apps (ver §4) |

**Problemas transversales confirmados (lo que reportó el usuario):**
1. **Botones "Nuevo" muertos** en Avisos, Sedes, Autos, Lista negra → "no me deja agregar".
2. **No hay vistas de detalle / drill-in** en ningún módulo → "no hay rutas más allá" (clic en una fila/tarjeta no abre detalle).
3. **Páginas con datos demo** (Avisos, Sugerencias, Lista negra, Sedes) → "se ve mal / no carga datos reales".
4. **Buscador global** del topbar es decorativo (sin handler).
5. **Gráficas del Dashboard** son constantes, no datos.

**Lo que SÍ funciona de verdad (verificado en vivo):** motor `/m/[entity]` (alta persiste), Usuarios (alta admin persiste), Departamentos (CRUD), Configuración + campos, Reportes (datos reales), Visitas (acciones de estatus).

---
## 3. Cobertura vs original
≈**60%** del admin original (ver `docs/17`). Datos 81% · catálogos 95% · módulos 59% · mutations 53%.
**Faltan 11 módulos** (la mayoría YA con tabla en Supabase → solo UI+acciones): Eventos, Reservaciones,
Empleados domésticos, placas avanzadas (asignación/LPR/REPUVE/blacklist), Alertas de pánico, Roles,
respuestas de tickets, credencial/asignar visitante, notificaciones, capacitación/videos, instancias.

---
## 4. Emulador de apps (NUEVO) — `/emulador`
Simulador de teléfono **dentro del portal** con conmutador **Residente / Caseta**:
- **Residente:** Home (6 tarjetas), Visitas (lista + QR), **Nueva visita con formulario dinámico que se arma con los campos configurables del admin**, Pánico, Perfil.
- **Caseta:** selección de caseta → principal (buscador, filtros, QR Auto/Caminando, lista con acciones) → Nueva visita (tipos).
Es una **maqueta interactiva** (no consume backend salvo los campos configurables). Próximo paso: conectarlo a datos reales o reemplazar por las apps Expo.

---
## 5. Plan priorizado para llegar al 100% (orden sugerido)
1. **Arreglar lo roto (alta prioridad, bajo costo):** migrar Avisos, Sugerencias, Lista negra, Sedes a datos reales + acciones (Avisos/Sedes vía el **motor** `/m/[entity]`: solo registrar la entidad en `lib/entities.ts`). Cablear "Nueva placa" en Autos y "Denegar" en Visitas.
2. **Vistas de detalle / drill-in:** añadir `/.../[id]` en el motor y en Departamentos/Visitas/Usuarios (detalle con relaciones: residentes, placas, empleados, fotos).
3. **Módulos faltantes** (§3): Eventos, Reservaciones, Empleados — requieren soporte de **campos relación (FK)** en el motor (selector de domicilio/espacio). Es la mejora clave del engine.
4. **Dashboard real:** gráficas desde Supabase (agregaciones por hora/tipo). Buscador global funcional.
5. **Aplicar DDL de gaps** (`docs/10`: 8 tablas + columnas) para cobertura 100% de lo almacenable.
6. **Apps móviles Expo** (residente + caseta) — specs en `docs/12, 13, 15`; consumen los mismos flags/campos.
7. **Hardening:** MFA admin, expiración de sesión, pentest autorizado, observabilidad.

---
## 6. Cómo trabajar el repo (arquitectura)
- **Motor declarativo** (lo más importante): para un módulo CRUD nuevo, basta agregar una entrada en
  `src/lib/entities.ts` (tabla, columnas, campos) → aparece en `/m/<key>` con lista+alta+edición+baja.
  Falta: soporte de campos **relación (FK)** y **vista de detalle**.
- **Patrón de página bespoke:** server `page.tsx` (fetch en `src/lib/data.ts`) → client `*Client.tsx`
  (useTransition + modal) → `actions.ts` (`"use server"`, casts `as never/any`, RLS por `current_is_admin()`).
- **Datos:** `src/lib/data.ts` (lectura) + `src/lib/crud.ts` (genérico). Todo degrada a demo si no hay sesión/Supabase.
- **Auth/RLS:** `@supabase/ssr` + `src/middleware.ts`. Políticas en `supabase/migrations/0002`/`policies.sql`.
- **Índice docs:** 01–17 (análisis, modelo, API, auditorías, personalización, apps).

---
## 7. Deuda técnica / notas
- `database.types.ts` no incluye `visit_field_configs` (tabla 0005) → sus accesos usan `as any`. Regenerar tipos.
- Casts `as never/any` en writes por la inferencia de supabase-js (aceptable, contenido en server actions).
- Datos demo (`src/lib/mock.ts`) aún referenciados por las 4 páginas rotas; eliminar al migrarlas.
- Migración 0005 aplicada en Supabase y versionada; el resto del DDL de gaps (`docs/10`) **no** aplicado aún.
