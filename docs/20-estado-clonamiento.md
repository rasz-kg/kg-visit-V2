# 20 — ESTADO COMPLETO DEL CLONAMIENTO (apps móviles vs. Portal Admin)

Fecha: 2026-06-16. Verificado en vivo: emulador MuMu Player Pro (apps reales) + Supabase
(ref `ljzzuwltgezvwpelavdz`, esquema/enums/RLS). Léelo junto con `docs/12` (residente),
`docs/13` (caseta) y `docs/19` (auditoría del portal).

---
## 1. Resumen ejecutivo

El proyecto V2 reconstruye sobre **Supabase + Expo** tres piezas que en producción (V1) ya existen como
clones white-label de **VisitApp**:

| Pieza | V1 (producción, sobre GraphQL VisitApp) | V2 (este repo, sobre Supabase) | % clonado |
|-------|------------------------------------------|--------------------------------|-----------|
| **Portal Admin** | web VisitApp admin | `apps/admin-web` (Next.js) | **~62%** funcional, en vivo |
| **App Residente** | `com.kgvisit.app` v1.1 (instalada, operativa) | `apps/resident` (Expo) | **slice funcional**: login, tabs, visitas (lectura real), **Nueva visita (wizard)**, Avisos, Pánico |
| **App Caseta** | `com.kgvisit.guard` v1.0.0 (instalada, operativa) | `apps/guard` (Expo) | **slice funcional**: login, selección de caseta, listado del día, acciones de estatus |

> **Backend desbloqueado (✅ aplicado y verificado en vivo):** migración `0006` aplicada; cuentas de auth
> demo creadas para residente (`jperez@kg-demo.mx`) y guardia (`guardia@kg-demo.mx`), password `KgVisit2026!`.
> Verificado: login OK por API; el residente solo ve las visitas de SU casa (1 de 2); el admin sigue
> viendo todas (sin regresión).

> **Conclusión:** el clon del **portal admin** va adelantado y en vivo; las **apps móviles** están
> documentadas exhaustivamente pero **sin código aún**. El backend Supabase ya cubre la mayor parte del
> modelo de datos que las apps necesitan (porque lo construimos para el portal), **pero la capa de
> auth/permisos está hecha solo para el admin** — ese es el bloqueante #1 para las apps (ver §4).

---
## 2. Inventario de apps en el emulador (MuMu, verificado en vivo)

| Paquete | Rol | Versión | Branding | Nota |
|---------|-----|---------|----------|------|
| `com.visitappmega` | Residente (original) | 5.0.0 | VisitApp (azul) | producto fuente |
| `com.visitappguardtablet` | Caseta (original) | 1.6.0 | VisitApp (azul) | producto fuente |
| `com.kgvisit.app` | **Residente (clon KG)** | 1.1 | KG-Visit (naranja) | wizard "Nueva visita" por pasos |
| `com.kgvisit.guard` | **Caseta (clon KG)** | 1.0.0 | KG-Visit (naranja) | listado + filtros + QR Auto/Caminando |
| `com.kauilgroup.evr` | EVR | — | Kauil | **descartado en V2** |

El `/emulador` del portal admin ya reproduce ambos flujos (residente y caseta) como maqueta — es la
referencia visual fiel de a dónde deben llegar las apps Expo.

---
## 3. Estado por app

### 3.1 App Residente (`apps/resident`)
- **Spec:** `docs/12` — **22 pantallas**, ~41 operaciones (login, dashboard, visitas + wizard de alta,
  visitantes frecuentes, empleados domésticos, familiares, eventos, avisos, notificaciones, pánico,
  perfil, contraseña, sugerencias, reservaciones).
- **Backend V2:** tablas presentes para casi todo: `visits`, `visitors`, `visitor_houses`, `employees`,
  `employee_schedules`, `events`, `event_visitors`, `notices`, `notifications`, `panic_alerts`,
  `tickets`, `reservations`, `spaces`, `houses`, `users`, `plates`. **Falta** soporte de `qr_code`/
  `secret_code` por visita/visitante, fotos (`visit_photos` existe), y flags `resident_app.hide*`
  (hoy los flags viven en `residentials.settings` jsonb — hay que formalizarlos).
- **Estado:** 0% código; scaffold Expo inicial creado en esta sesión (estructura + cliente Supabase +
  login + tabs).

### 3.2 App Caseta (`apps/guard`)
- **Spec:** `docs/13` — **16 pantallas**, ~26 operaciones (login, selección de caseta, listado del día,
  acciones por fila, detalle, wizard de alta con LPR/REPUVE/foto, QR Auto/Caminando, pánico, chat, menú).
- **Backend V2:** `visits`, `security_booths`, `houses`, `services`, `employees`, `transports`,
  `plates`, `incidents`, `cameras`, `panic_alerts` presentes. **Falta** LPR/REPUVE (servicios externos),
  chat realtime, y flags `guard*` (en `residentials.settings`).
- **Estado:** 0% código.

---
## 4. ✅ RESUELTO — Auth y RLS por rol (era el bloqueante #1)

> **Estado:** la migración `0006_app_roles_rls.sql` se **aplicó a producción** y se crearon las cuentas de
> auth demo (residente/guardia). Verificado: login por API + RLS (residente acotado a su casa, admin sin
> regresión). Lo de abajo documenta el problema original y la solución.

El backend autenticaba y autorizaba pensado **únicamente para el portal admin**. Verificado en vivo:

```sql
current_residential_id() -- residential del usuario con auth_user_id = auth.uid()  (sirve a cualquier rol)
current_is_admin()        -- true SOLO si rol ∈ ('admin','supervisor')
```
- **Lectura:** todas las tablas → `residential_id = current_residential_id()` ⇒ *cualquier* usuario
  logueado del tenant puede leer **todo** (demasiado amplio para un residente).
- **Escritura:** todas las tablas → `... AND current_is_admin()` ⇒ **solo admin/supervisor escriben**.
  Un residente o guardia **no puede** crear visitas, visitantes, pánico, tickets, ni cambiar estatus.
- **Cuentas:** de 4 usuarios, **solo el admin tiene `auth_user_id`** (puede loguearse). El residente
  (`Juan Pérez`) y el guardia (`Guardia Caseta`) existen como filas pero **no tienen cuenta de auth**.

**Implicación:** las apps Expo no pueden funcionar contra Supabase hasta que se agregue:
1. **Cuentas de auth** para usuarios residente y guardia (Supabase Auth) ligadas vía `auth_user_id`.
2. **Políticas RLS por rol**:
   - **Residente:** leer/escribir solo lo de *su* casa (sus visitas, visitantes, empleados, eventos,
     reservaciones, tickets, pánico). No ver visitas de otras casas.
   - **Guardia:** leer visitas del tenant; crear visitas, cambiar `status`, crear incidentes/pánico,
     subir fotos, registrar entrada/salida — **acotado a su caseta/tenant** sin ser admin.
3. **Helpers**: `current_user_id()`, `current_house_id()`, `current_is_guard()` para esas políticas.

> Esta migración es el primer paso real de las apps. En esta sesión se dejó **redactada como archivo
> versionado** en `supabase/migrations/` (sin aplicar a producción todavía, pendiente de tu visto bueno).

---
## 5. Mapa "app ↔ Supabase" (empate con el portal admin)

El portal admin y las apps **comparten el mismo backend Supabase**; el empate de datos es directo porque
ambos usan las mismas tablas. Diferencia clave: **el portal escribe como admin; las apps escribirán como
residente/guardia** (de ahí §4).

| Flujo de app | Tabla(s) Supabase | ¿Existe? | Ya lo usa el portal |
|--------------|-------------------|----------|---------------------|
| Login / sesión | `auth.users` + `users.auth_user_id` | ✅ (solo admin) | ✅ |
| Visitas (listar/crear/estatus) | `visits` (+ `visitors`,`services`,`employees`,`transports`,`plates`,`security_booths`) | ✅ | ✅ (Visitas, Nueva visita, Denegar) |
| Visitantes frecuentes | `visitors`, `visitor_houses`, `visitor_plates` | ✅ | parcial (Usuarios→visitantes) |
| Empleados domésticos | `employees`, `employee_schedules`, `employee_plates` | ✅ | ❌ (no en portal aún) |
| Eventos | `events`, `event_visitors` | ✅ | ❌ (solo reporte) |
| Avisos | `notices` | ✅ | ✅ (Avisos, esta semana) |
| Notificaciones | `notifications` | ✅ | parcial (paquetería) |
| Pánico | `panic_alerts` | ✅ | ❌ (solo reporte) |
| Sugerencias/tickets | `tickets`, `ticket_categories`, `ticket_responses` | ✅ | ✅ (Sugerencias) |
| Reservaciones | `reservations`, `spaces` | ✅ | parcial (amenidades) |
| Caseta/casetas | `security_booths`, `cameras` | ✅ | ✅ (motor `/m/casetas`,`/m/camaras`) |
| Lista negra/placas | `plates`, `incidents` | ✅ | ✅ (Autos, Lista negra) |
| LPR / REPUVE | — (servicios externos) | ❌ | n/a |
| Chat colono↔caseta | — (Realtime) | ❌ | n/a |
| Flags por tenant (`hide*`,`guard*`) | `residentials.settings` jsonb | ⚠️ informal | parcial (`/configuracion`) |

**Veredicto del empate:** ~**85%** del modelo de datos que las apps necesitan **ya está** en Supabase y
**ya es escrito por el portal admin** con éxito. Lo que falta es: (a) auth/RLS por rol (§4), (b) flags
formalizados, (c) integraciones externas (LPR/REPUVE) y realtime (chat), (d) DDL menor de gaps (`docs/10`:
p.ej. `sites`, columnas qr/secret).

---
## 6. Plan de construcción de las apps (orden propuesto)

1. **Migración auth+RLS por rol** (§4) — desbloquea todo. + crear cuentas demo residente/guardia.
2. **Monorepo Expo + `apps/resident`** (vertical slice): login → dashboard → visitas (listar) →
   nueva visita (wizard) → pase QR. Cliente Supabase compartido + tema KG-Visit.
3. **`apps/resident` resto**: visitantes, empleados, avisos, notificaciones, pánico, perfil, tickets,
   reservaciones (condicionados por flags).
4. **`apps/guard`**: login → selección caseta → listado del día → acciones (estatus/dar acceso/salida/
   reportar) → nueva visita → QR Auto/Caminando → pánico.
5. **Integraciones**: push (`expo-notifications`), Realtime (chat), y stubs honestos LPR/REPUVE.
6. **Verificación cruzada en MuMu**: instalar los builds Expo y validar que escriben/leen **las mismas
   filas** que ve el portal admin (objetivo declarado del proyecto).

---
## 7. Riesgos / decisiones abiertas

- **Granularidad RLS del residente:** ¿ve solo su casa o toda su "cuenta" (multi-casa)? Propuesto: por casa.
- **Cuentas de auth masivas:** alta de residentes/guardias debería emitir invitación/credencial desde el
  portal admin (crear `auth.users` + ligar `auth_user_id`). Hoy no existe ese flujo en el portal.
- **Flags por tenant:** formalizar `residentials.settings` → columnas tipadas o tabla `feature_flags`.
- **LPR/REPUVE/chat:** dependen de servicios externos; en V2 se entregan como stubs etiquetados primero.
- **EAS/build:** definir pipeline de build Expo (EAS) y firma para instalar en MuMu/dispositivos.
