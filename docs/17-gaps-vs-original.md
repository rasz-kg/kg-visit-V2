# 17 — Gaps de KG-Visit V2 vs. portal administrador ORIGINAL (VisitApp)

> **Auditoría de cobertura.** Objetivo: verificar que NO falte nada en el portal admin V2
> respecto al portal administrador ORIGINAL (`administracion.visitapp.io` / `admin.kg-visit.com`).
>
> **Fuentes de la verdad (original):**
> - `docs/11-rutas-admin.md` — 86 rutas/sub-rutas del original con campos y mutations.
> - `docs/06-api-graphql.md` — ~90 queries + ~110 mutations (toda la capacidad del original).
> - `docs/10-cobertura-datos.md` — 42 entidades almacenables.
> - `docs/15-hibrido-configurable.md` — apps (residente/caseta) configurables por flags.
>
> **Lo construido en V2 (leído directamente del código, no de los docs):**
> - `apps/admin-web/src/lib/nav.ts` — navegación real del shell.
> - `apps/admin-web/src/lib/entities.ts` — 9 entidades del motor declarativo `/m/[entity]`.
> - `apps/admin-web/src/lib/sections.ts` — 5 secciones de personas.
> - `apps/admin-web/src/app/(app)/reportes/catalog.ts` + `queries.ts` — 14 sub-reportes (todos con query real).
> - Árbol `apps/admin-web/src/app/(app)` (rutas físicas existentes).
> - `supabase/migrations/*` + `database.types.ts` — 31 tablas en Supabase.
>
> **Fecha de auditoría:** 2026-06-16.

---

## 0. Estado real de V2 (inventario verificado en código)

**Rutas físicas que existen en `app/(app)`** (page.tsx presente):
`/dashboard`, `/visitas`, `/departamentos`, `/autos`, `/usuarios` (hub) + `/usuarios/[seccion]`
(cubre admins, supervisores, colaboradores, guardias, visitantes), `/lista-negra`, `/avisos`,
`/sugerencias`, `/sedes`, `/reportes` (hub) + `/reportes/[slug]` (14 sub-reportes),
`/configuracion` + `/configuracion/campos`, y el **motor declarativo `/m/[entity]`** que sirve
9 catálogos: `servicios`, `transportes`, `proveedores`, `espacios` (amenidades), `casetas`,
`camaras`, `etiquetas` (TAGs), `categorias-ticket`, `incidentes`. Más `/login` y `/` (raíz).

**Hallazgo importante:** el código de V2 está **más avanzado que la foto del `docs/11`**. Doc 11
reportaba Proveedores, Transportes, Etiquetas, Cámaras, Amenidades como faltantes; hoy **todos
existen** vía el motor `/m/[entity]`. La matriz de abajo refleja el **código real**, no el doc 11.

**CRUD/acciones reales verificadas (server actions):**
- Personas: `createPerson`, `updatePerson`, `togglePerson`, `deletePerson`.
- Departamentos: `createHouse`, `updateHouse`, `toggleDefaulter`, `deleteHouse`.
- Visitas: `authorizeVisit`, `denyVisit`, `giveAccess`, `markLeave`, `reportVisit`, `notifyPackage`.
- Motor declarativo: `saveEntity`, `toggleEntity`, `deleteEntity` (alta/edición/baja/estatus genérico).
- Configuración: `saveConfig` (flags tipados + `settings jsonb`), `saveField`/`toggleField`/`deleteField` (campos dinámicos de visita).
- Reportes: 14 funciones `report*` con query real a Supabase.

**Tablas en Supabase (31):** cameras, employee_plates, employee_schedules, **employees**, event_visitors,
**events**, house_plates, houses, incidents, notices, **notifications**, **panic_alerts**, plates,
providers, **reservations**, residentials, rols, security_booths, services, **spaces**, tags,
ticket_categories, ticket_responses, tickets, transports, users, visit_photos, visitor_houses,
visitor_plates, visitors, visits.
> Es decir: el **modelo de datos** de eventos, reservaciones, empleados, pánico y notificaciones
> ya existe; lo que falta es la **UI/acciones** que lo explote.

---

## 1. Matriz de cobertura (módulo del original → estado en V2)

Leyenda: ✅ construido (UI + datos/acciones) · 🟡 parcial (lista/lectura pero sin CRUD completo,
o flags base sin promover) · 🔴 faltante (sin ruta ni UI).

| # | Módulo / ruta ORIGINAL | V1 | Estado V2 | Ruta V2 equivalente | Nota |
|---|------------------------|----|:---------:|---------------------|------|
| 1 | Login / recuperar contraseña | `/` | ✅ | `/login` | `login`, `recoveryPassword` |
| 2 | Perfil / logout / cambiar mi pass | header | 🟡 | header | falta UI de `updateMyPassword`, `logout` UI |
| 3 | Dashboard / KPIs | `/admin/dashboard` | ✅ | `/dashboard` | KPIs por count; faltan gráficos de horas pico / tipos |
| 4 | Usuarios (hub) | `/admin/users-dashboard` | ✅ | `/usuarios` | |
| 5 | Admins | `/admin/admins` | ✅ | `/usuarios/admins` | CRUD real |
| 6 | Supervisores | `/admin/visit-supervisors` | ✅ | `/usuarios/supervisores` | CRUD real |
| 7 | Colaboradores/residentes | `/admin/residents` | ✅ | `/usuarios/colaboradores` | CRUD real |
| 8 | Guardias | `/admin/guards` | ✅ | `/usuarios/guardias` | CRUD real |
| 9 | Visitantes | `/admin/visitors` | 🟡 | `/usuarios/visitantes` | falta renovar credencial, asignar a casa |
| 10 | Departamentos/domicilios | `/admin/houses` | ✅ | `/departamentos` | CRUD + moroso |
| 11 | Empleados de la casa (admin) | dentro de house | 🔴 | — | tabla `employees` existe; sin UI |
| 12 | Visitas / accesos | accesos | ✅ | `/visitas` | autorizar, denegar, acceso, salida, reportar, paquetería |
| 13 | Nueva visita (visitante/servicio/empleado) | acción | 🟡 | `/visitas` | acciones de flujo sí; alta manual completa parcial |
| 14 | Autos y placas | `/admin/cars` | 🟡 | `/autos` | lista; falta asignar casa/visitante/empleado, REPUVE, LPR UI |
| 15 | Lista negra / incidentes | `/admin/insidents` | ✅ | `/lista-negra` + `/m/incidentes` | |
| 16 | Avisos | `/notices` | ✅ | `/avisos` | crear/estatus |
| 17 | Sugerencias y quejas (tickets) | tickets | 🟡 | `/sugerencias` | lista; falta hilo de respuestas `/[id]` |
| 18 | Categorías de tickets | sub-config | ✅ | `/m/categorias-ticket` | |
| 19 | Reportes (hub) | `/admin/reports-dashboard` | ✅ | `/reportes` + `/reportes/[slug]` | 14 sub-reportes con query |
| 20 | Configuración / residencial | `/residentials/configuration` | 🟡 | `/configuracion` | 7 flags tipados + resto en `settings jsonb`; 139 flags no promovidos a columnas |
| 21 | Campos dinámicos de visita | — (mejora V2) | ✅ | `/configuracion/campos` | superior al original |
| 22 | Casetas | `/admin/security-booths` | ✅ | `/m/casetas` | |
| 23 | Cámaras IP | sub de casetas | 🟡 | `/m/camaras` | CRUD básico; falta `camerasBySecurityBooth`, automática |
| 24 | Servicios | `/admin/services` | ✅ | `/m/servicios` | |
| 25 | Proveedores | `/providers` | ✅ | `/m/proveedores` | |
| 26 | Transportes | sub-config | ✅ | `/m/transportes` | |
| 27 | Sedes / sucursales | `/admin/branches` | 🟡 | `/sedes` | listado; sin alta/edición dedicada |
| 28 | Amenidades / espacios | espacios | 🟡 | `/m/espacios` | CRUD de espacio; sin flujo de reservación |
| 29 | Etiquetas TAG (telepeaje) | tags | ✅ | `/m/etiquetas` | |
| 30 | **Eventos** | `/eventos` | 🔴 | — | tablas `events`/`event_visitors` existen; sin UI |
| 31 | **Reservaciones** | reservaciones | 🔴 | — | tabla `reservations` existe; sin UI |
| 32 | **Alertas de pánico** | pánico | 🔴 | — | tabla `panic_alerts` existe; sin UI |
| 33 | **Roles** | dentro de usuarios | 🔴 | — | tabla `rols` existe; sin pantalla de gestión |
| 34 | **Capacitación (videos)** | capacitación | 🔴 | — | sin tabla ni UI (videos, comments, solutions) |
| 35 | **Instancias / logs (uso app on-prem)** | uso de app | 🔴 | parcial | reporte "Uso de la aplicación" existe; sin gestión de instancias |
| 36 | **Notificaciones (centro/realtime)** | header | 🔴 | — | tabla `notifications` existe; sin UI |
| 37 | **Chat (acceso / colono-guardia)** | realtime | 🔴 | — | sin UI ni realtime (es app móvil + admin) |
| 38 | **Paquetería (gestión avanzada)** | dentro de visitas | 🟡 | acción en `/visitas` | `notifyPackage` existe; sin módulo/reporte dedicado más allá del sub-reporte |
| 39 | Encuestas / Wallets / Documentos | premium | 🔴 | — | módulos premium del superset, sin UI |

### Conteo de módulos

| Estado | Cantidad |
|--------|---------:|
| ✅ construido | **18** |
| 🟡 parcial | **10** |
| 🔴 faltante | **11** |
| **Total módulos auditados** | **39** |

---

## 2. Faltantes priorizados (módulos sin UI en V2) con sus mutations de respaldo

Ordenados por valor operativo / frecuencia de uso en la operación de residenciales y corporativos.

1. **Eventos** — `/eventos` (+`/new`, `/[id]`). Modelo listo (`events`, `event_visitors`).
   Mutations: `createEvent`, `updateEvent`, `asignEventVisitor(event,visitor)`. Queries: `eventsForAdmin`, `eventForAdmin`, `eventsTodayForAdmin`, `visitorsEventForAdmin`.
2. **Reservaciones de amenidades** — `/reservaciones`. Modelo listo (`reservations`, `spaces`).
   Mutations: `createReservation`, `updateReservation`, `statusReservation(id,status,denyReason)`, `deleteReservation`. Queries: `reservationsForAdmin`, `activeReservations`.
3. **Empleados domésticos (admin)** — `/empleados` o dentro del depto. Modelo listo (`employees`, `employee_schedules`, `employee_plates`).
   Mutations: `createEmployee`, `updateEmployee`, `deleteEmployee`, `updateImageEmployee`. Queries: `employeesForAdmin`, `employeesHouseForAdmin`.
4. **Gestión avanzada de placas** — completar `/autos`. Acciones del original aún sin UI.
   Mutations: `asignHousePlate`, `asignVisitorPlate`, `asignEmployeePlate`, `createPlate`, `updatePlate`, `blacklistPlate`, `repuve(plate,visit)`, `lpr(accessKind,securityBooth)`.
5. **Alertas de pánico** — `/panico`. Modelo listo (`panic_alerts`).
   Mutations: `seePanicAlert(id)`, `updatePanicAlert(id, status)`. Queries: `panicAlerts(dateStart,dateEnd,search,page)`, `housePanicAlerts`.
6. **Roles** — dentro de Usuarios o `/roles`. Modelo listo (`rols`).
   Mutations: `createRol(rol,tenant)`, `updateRol(id,rol,tenant)`. Query: `rolsPublic`.
7. **Hilo de respuestas de tickets** — `/sugerencias/[id]`. Lista existe; falta el detalle.
   Mutations: `createTicketResponse(ticketId,message)`, `updateTicketResponse(id,message)`, `statusTicket(id,status)`. Query: `listTicketResponses`.
8. **Visitantes: acciones finas** — completar `/usuarios/visitantes`.
   Mutations: `updateVisitorCredential(id)` (renovar credencial), `asignVisitorHouse(house,visitor)` (asignar a casa).
9. **Notificaciones (centro de actividad)** — header/realtime. Modelo listo (`notifications`).
   Mutations: `notificationUpdate(id,tennant)`. Query: `notifications(tennant,user)`.
10. **Capacitación / Videos** — `/capacitacion`. **Sin tablas** (requiere `videos`, `video_comments`, `solutions` del DDL de `docs/10`).
    Mutations: `createVideo`, `voteSolutionLike`, `voteSolutionDislikes`. Queries: `getVideoLarning`, `videoCommentsByVideo`, `solutionsByProblem`.
11. **Instancias / logs (uso de app on-premise)** — `/configuracion/instancias`. **Sin tablas** (requiere `instances`, `instance_logs`).
    Mutations: `createInstanceLog`, `createInstanceLogDevice`. Queries: `instances(instance)`, `instanceLogs(instance,tennant)`.
12. **Sedes: alta/edición dedicada** — `/sedes/new`, `/sedes/[id]`. Hoy sólo listado.
13. **Cámaras por caseta / automática** — completar `/m/camaras`.
    Mutations: `updateAutomaticCamera(id)`. Query: `camerasBySecurityBooth(securityBooth)`.
14. **Chat de acceso (realtime)** — `accessChat`, `userWithUserChat` (mayormente app móvil; el admin necesitaría consola de chat).

---

## 3. Operaciones GraphQL (~110 mutations) sin UI/acción en V2

Cruzando `docs/06` con las server actions verificadas. ✅ = tiene pantalla/acción; 🔴 = sin UI.

### Con UI/acción en V2 (✅)
- **Auth:** `login`, `recoveryPassword`. (parcial: `logout`/`updateMyPassword` sin botón UI)
- **Usuarios:** `createAdminForAdmin`, `createGuardForAdmin`, `createResidentForAdmin`, `updateUserForAdmin`, `updateResidentForAdmin`, `deleteUserForAdmin`, `createVisitor`, `updateVisitor` (vía `createPerson`/`updatePerson`/`togglePerson`/`deletePerson`). `passwordUserForAdmin` (cambio de pass) — parcial.
- **Domicilios:** `createHouseForAdmin`, `updateHouseForAdmin`, `deleteHouseForAdmin` (+ moroso vía `toggleDefaulter`).
- **Visitas:** `statusVisit` (autorizar/acceso/salida/denegar), `createInsident` (reportar), notificación de paquetería.
- **Catálogos (motor `/m/[entity]`):** `createServiceForAdmin`/`updateServiceForAdmin`/`deleteServiceForAdmin`, `createTransportForAdmin`/`updateTransportForAdmin`, `createTag`/`updateTag`/`statusTag`/`deleteTag`, `createCamera`/`updateCamera`, `createSecurityBooth`/`updateSecurityBooth`, `createTicketCategory`/`updateTicketCategory`/`statusTicketCategory`/`deleteTicketCategory`, `createSpace`/`updateSpace`/`statusSpace`/`deleteSpace`, providers (CRUD genérico).
- **Avisos:** `createNotice`, `updateNotice`.
- **Tenant:** `updateResidentialConfirmationTime`, `updateQrStatus`, `updateSecretCodeStatus`, `updateResidentialAccessChat`, `updateResidentialFrequentlyByPlate` (vía `saveConfig`; algunos sólo como flag jsonb).

### SIN UI/acción en V2 (🔴) — backlog de mutations
- **Placas:** `createPlate`, `updatePlate`, `blacklistPlate`, `asignHousePlate`, `asignVisitorPlate`, `asignEmployeePlate`, `repuve`.
- **Visitantes:** `updateVisitorCredential`, `asignVisitorHouse`.
- **Empleados:** `createEmployee`, `updateEmployee`, `deleteEmployee`, `updateImageEmployee`.
- **Eventos:** `createEvent`, `updateEvent`, `asignEventVisitor`.
- **Reservaciones:** `createReservation`, `updateReservation`, `statusReservation`, `deleteReservation`.
- **Pánico:** `seePanicAlert`, `updatePanicAlert`.
- **Roles:** `createRol`, `updateRol`.
- **Tickets (hilo):** `createTicketResponse`, `updateTicketResponse`, `statusTicket`.
- **Cámaras:** `updateAutomaticCamera`.
- **Notificaciones:** `notificationUpdate`.
- **Capacitación:** `createVideo`, `voteSolutionLike`, `voteSolutionDislikes`.
- **Instancias:** `createInstanceLog`, `createInstanceLogDevice`.
- **Visita — alta manual completa:** `createVisitorVisit`, `createServiceVisit`, `createEmployeeVisit` (las acciones de estatus existen; el alta manual desde admin es parcial).
- **Foto de visita:** `imageVisit`, `updateImageEmployee`.
- **Caseta/QR (mayormente app):** `visitWithQrCode`, `visitorWithQrCode`, `visitorWithSecretCode`, `leaveVisitWithQrCode`, `employeeVisitByFolio`, `createVisitorUnexpected` — pertenecen a la app de caseta, no al admin web.
- **Residente (app):** todo el bloque `resident*` — pertenece a la app móvil, no al admin web.

> **Resumen:** de ~110 mutations, **~40 están respaldadas por UI/acción en el admin web V2**;
> el resto se reparte entre (a) backlog de admin sin UI (~35) y (b) mutations propias de las
> **apps móviles** residente/caseta (~35) que no corresponden al portal admin.

---

## 4. Lo que V2 hace MEJOR que el original

1. **Motor declarativo (`/m/[entity]`).** Una sola ruta dinámica + `entities.ts` genera lista,
   alta, edición, baja y toggle de estatus para 9 catálogos. En el original cada uno era una
   pantalla codeada a mano. Agregar un catálogo nuevo = 1 objeto en `entities.ts`.
2. **Configuración por tenant tipada + `settings jsonb` + campos dinámicos.** `/configuracion/campos`
   (tabla `visit_field_configs`) permite definir campos del formulario de visita por tenant
   (etiqueta, tipo, requerido, orden, visible, aplica_a). El original tenía ~147 flags rígidos
   esparcidos; V2 los unifica y los hace extensibles sin redeploy.
3. **Arquitectura híbrida / superset configurable** (`docs/15`): una sola base de código que enciende/
   apaga módulos por flags del tenant, en vez de mantener un white-label separado por cliente.
4. **RLS multi-tenant en Supabase** (aislamiento por `residential_id` a nivel de base de datos),
   en vez de filtrado sólo en capa de aplicación. *Secure by default.*
5. **Tipos correctos en el modelo de datos.** El original mandaba casi todo como `String` (fechas,
   números, booleans). V2 usa `timestamptz`, `int`, `numeric`, `boolean`, enums.
6. **Introspección GraphQL deshabilitada en prod** (vulnerabilidad V-08 del original corregida).
7. **Degradación elegante a datos demo** (capa `data.ts` null-safe: nunca lanza, cae a mock ante
   error de red/permiso) — el original no tenía este fallback.
8. **Deploy continuo** (Next.js + Supabase) frente al stack Phoenix/Absinthe on-premise por instancia.
9. **Hub de reportes con 14 sub-reportes** ya implementados con query real, agrupados (Accesos,
   Seguridad, Operación, Comunidad), navegables por slug.

---

## 5. % de cobertura estimado

Cálculo ponderado (módulos del admin web; se excluyen las pantallas propias de las apps móviles
residente/caseta, que se auditan en `docs/12`/`docs/13`).

| Dimensión | Cobertura |
|-----------|----------:|
| Módulos admin (✅=1, 🟡=0.5, 🔴=0 sobre 39) → (18 + 5) / 39 | **≈ 59%** |
| Mutations del admin (UI real ~40 de ~75 aplicables al admin, excluyendo ~35 de app móvil) | **≈ 53%** |
| Modelo de datos (entidades almacenables) — 34/42 con tabla; resto con DDL propuesto | **≈ 81%** |
| Catálogos de operación (servicios, transportes, proveedores, casetas, cámaras, tags, espacios, categorías) | **≈ 95%** |

> **% de cobertura global estimado del portal admin original por parte de V2: ≈ 60%.**
>
> Interpretación: la **base operativa diaria** (usuarios, domicilios, visitas/accesos, lista negra,
> avisos, catálogos, configuración, reportes) está **construida y funcional**. El 40% restante son
> **módulos de valor añadido** (eventos, reservaciones, empleados, pánico, roles, capacitación,
> notificaciones/chat) y **acciones finas** (asignaciones de placas, REPUVE/LPR, hilo de tickets,
> alta manual completa de visitas) — en su mayoría con el **modelo de datos ya listo** en Supabase,
> por lo que el esfuerzo restante es predominantemente de **UI + server actions**, no de backend.

---

## Resumen para el solicitante

- **% de cobertura global estimado:** **≈ 60%** del portal admin original.
- **Módulos:** **18 ✅** · **10 🟡** · **11 🔴** (39 auditados).
- **Top 10 faltantes más importantes:**
  1. Eventos (`createEvent`, `updateEvent`, `asignEventVisitor`)
  2. Reservaciones de amenidades (`createReservation`, `statusReservation`, `deleteReservation`)
  3. Empleados domésticos (`createEmployee`, `updateEmployee`, `deleteEmployee`)
  4. Gestión avanzada de placas (`asignHousePlate`/`asignVisitorPlate`/`asignEmployeePlate`, `repuve`, `lpr`, `blacklistPlate`)
  5. Alertas de pánico (`seePanicAlert`, `updatePanicAlert`)
  6. Roles (`createRol`, `updateRol`)
  7. Hilo de respuestas de tickets (`createTicketResponse`, `statusTicket`)
  8. Visitantes: renovar credencial / asignar a casa (`updateVisitorCredential`, `asignVisitorHouse`)
  9. Notificaciones / centro de actividad (`notificationUpdate`)
  10. Capacitación / Videos (`createVideo`, `voteSolutionLike/Dislike`) — requiere crear tablas primero
