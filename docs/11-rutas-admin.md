# 11 — Mapa exhaustivo de rutas del panel de administración

Mapa ruta por ruta del panel admin (clon de **admin.kg-visit.com** / VisitApp), cruzando:
las rutas reales del portal V1, el catálogo GraphQL (`06-api-graphql.md`), la cobertura
(`07-cobertura-modulos.md`) y los tipos `*Params` del esquema (`/tmp/kgvisit_schema.json`).

**Leyenda de estado (V2 web admin, en `apps/admin-web/src/app/(app)`):**
- ✅ construido (página existe con UI + datos reales o demo)
- 🟡 construido como vista plana; faltan sub-rutas `/new`, `/:id`, `/:id/edit`
- ⬜ pendiente (no existe ninguna ruta en V2)
- 📱 corresponde a app móvil / caseta (fuera del admin web)

**Nota de slugs:** el portal V1 usa rutas en inglés (`/admin/...`). V2 ya creó un set en
español (`/dashboard`, `/usuarios`, etc.). La columna "Ruta V2 actual" refleja lo que existe
hoy; "Ruta V1 (portal real)" es el origen a clonar. Las sub-rutas marcadas ⬜ aún **no tienen
archivo** en `app/(app)` (hoy todo es página plana, salvo `usuarios/[seccion]`).

---

## 0. Autenticación (fuera del shell `(app)`)

| Ruta V2 | V1 | Propósito | Campos | Acciones → mutation/query |
|---------|----|-----------|--------|---------------------------|
| `/login` ✅ | `/` login | Inicio de sesión | username, password (channel/idDevice implícitos) | Entrar → `login(username,password,channel,idDevice)` · Recuperar → `recoveryPassword(email,channel,hash)` |
| `/` ✅ | — | Redirección a `/dashboard` o `/login` | — | — |
| (perfil, en header) | — | Sesión actual | password (cambio) | Cerrar sesión → `logout()` · Cambiar mi contraseña → `updateMyPassword(password)` |

---

## 1. Dashboard — ✅

- **Ruta V2:** `/dashboard` · **V1:** `/admin/dashboard`
- **Propósito:** KPIs globales y gráficos del tenant.
- **Sub-rutas:** ninguna.
- **Campos/filtros:** rango de fechas (dateStart, dateEnd).
- **Datos (queries):** `totalHousesByKind`, `usersForAdmin`/`usersByRolForAdmin`, `visitsToday`,
  `adminVisits`, `platesForAdmin`, `servicesForAdmin`. KPIs: visitas, domicilios, servicios,
  visitantes, colonos activados/app; horas pico; tipos de visita; últimas placas.
- **Acciones:** sólo lectura / cambio de rango de fechas.

---

## 2. Usuarios (hub de personas) — ✅✅ profundo

- **Ruta V2:** `/usuarios` (hub) → `/usuarios/[seccion]` · **V1:** `/admin/users-dashboard` → 5 sub-secciones
- **Propósito:** gestión de los 5 tipos de persona. CRUD real contra Supabase ya implementado.
- **Sub-secciones (V2 `[seccion]` ya construido):**

| V2 | V1 | source / rol | query lista | Mutation alta |
|----|----|--------------|-------------|---------------|
| `/usuarios/admins` | `/admin/admins` | users, rol `admin` | `usersByRolForAdmin(rol:"admin")` | `createAdminForAdmin(user:UserRolParams)` |
| `/usuarios/supervisores` | `/admin/visit-supervisors` | users, rol `supervisor` | `usersByRolForAdmin(rol:"supervisor")` | `createAdminForAdmin` (rol supervisor) |
| `/usuarios/colaboradores` | `/admin/residents` | users, rol `resident` | `usersByRolForAdmin(rol:"resident")` / `residents()` | `createResidentForAdmin(user:UserResidentParams)` |
| `/usuarios/guardias` | `/admin/guards` | users, rol `guard` | `usersByRolForAdmin(rol:"guard")` | `createGuardForAdmin(user:UserRolParams)` |
| `/usuarios/visitantes` | `/admin/visitors` | visitors | `visitorsForAdmin` / `visitorsByName` | `createVisitor(visitor:VisitorParams)` |

- **Sub-rutas de formulario (V1 tiene `/new` y `/:id/edit` por sección) — ⬜ pendientes en V2** (hoy se hace inline/modal):
  - `/usuarios/[seccion]/new`, `/usuarios/[seccion]/[id]/edit`, `/usuarios/[seccion]/[id]/status`

- **Campos del formulario por tipo (`*Params`):**
  - **Admin / Supervisor / Guardia — `UserRolParams`:** `name*`, `username*`, `email`, `passwordField*`, `avatar`
  - **Colaborador (residente) — `UserResidentParams`:** `name*`, `username*`, `email`, `passwordField*`, `houseId*`, `avatar`
  - **Editar usuario (admin/guard/supervisor) — `UserUpdateParams`:** `name*`, `username`, `email`, `avatar`
  - **Editar residente — `ResidentUpdateParams`:** `name*`, `houseId*`, `username`, `email`, `status`, `avatar`
  - **Visitante alta — `VisitorParams`:** `name*`, `username`, `curp`, `avatar`, `unexpected`
  - **Visitante editar — `VisitorUpdateParams`:** `name*`, `status`, `avatar`

- **Acciones por tarjeta (V1) → mutation:**
  - Editar → `updateUserForAdmin` / `updateResidentForAdmin` / `updateVisitor`
  - Cambiar password → `passwordUserForAdmin(id, password)`
  - Limitar a reportes (rol) → `updateUserForAdmin` (cambio de rol vía `createRol`/`updateRol` + `UserRolParams`)
  - Activar/Desactivar (`/:id/status`) → `updateResidentForAdmin(status)` / `updateVisitor(status)` / `updateUserForAdmin`
  - Eliminar → `deleteUserForAdmin(id)`
  - (visitante) Renovar credencial → `updateVisitorCredential(id)` · Asignar a casa → `asignVisitorHouse(house,visitor)`

---

## 3. Departamentos / Domicilios — ✅✅ profundo

- **Ruta V2:** `/departamentos` · **V1:** `/admin/houses`
- **Propósito:** unidades/domicilios del tenant; control de morosidad y tipo.
- **Sub-rutas V1:** `/admin/houses/new`, `/admin/houses/:id` (detalle), `/admin/houses/:id/edit`,
  `/admin/root/houses/:id/defaulter` (marcar/quitar moroso) — **⬜ pendientes como archivos en V2** (hoy CRUD inline contra Supabase).
- **Campos — `HouseParams`:** `address*`, `phone`, `publicPhone`, `inhabited*` (bool), `build*` (bool),
  `construction*` (bool), `land*` (bool), `restingTime*` (bool, "no molestar").
  *(El flag de moroso/cobranza es estado derivado en V2/Supabase, no campo de `HouseParams`.)*
- **Datos:** `housesForAdmin(page,search)`, `houseForAdmin(id)`, `totalHousesByKind`, `housesPlateForAdmin`.
- **Acciones → mutation:** Nuevo → `createHouseForAdmin(house:HouseParams)` · Editar → `updateHouseForAdmin(id,house)` ·
  Eliminar → `deleteHouseForAdmin(id)` · Marcar/quitar moroso → (Supabase / flag de cobranza) ·
  Ver empleados de la casa → `employeesHouseForAdmin(house)` · Ver visitantes → `visitorsHouseForAdmin(house)`.

---

## 4. Visitas / Accesos — ✅ (UI; lógica → backend)

- **Ruta V2:** `/visitas` · **V1:** pantalla principal de accesos (paridad con app de caseta)
- **Propósito:** registro y control de accesos en tiempo real.
- **Sub-rutas V1 (acciones, no rutas separadas):** Nueva visita, QR Auto, QR Caminando, detalle de visita.
  - Sugeridas en V2: `/visitas/new`, `/visitas/[id]` ⬜.
- **Filtros:** tipo (`kind`), estatus (`status`), caseta (`securityBooth`), búsqueda, rango fechas.
- **Datos:** `visitsToday(kind,status,search,page)`, `adminVisits`, `adminVisitorVisits`,
  `adminHouseVisits`, `adminGuardVisits`, `adminUserVisits`, `adminSecurityBoothVisits`, `visit(id)`.
- **Campos de "Nueva visita" según tipo (`*Params`):**
  - **Visitante — `VisitVisitorParams`:** `visitorId*`, `houseId*`, `kind*`, `subject*`, `dueDate*`,
    `quick*`, `details`, `notes`, `private`, `plateId`, `transportId`, `securityBoothId`
  - **Servicio — `VisitServiceParams`:** `serviceId*`, `houseId*`, `kind*`, `subject*`, `dueDate*`,
    `quick*`, `details`, `notes`, `private`, `plateId`, `transportId`, `securityBoothId`
  - **Empleado — `VisitEmployeeParams`:** `employeeId*`, `houseId*`, `kind*`, `subject*`, `dueDate*`,
    `quick*`, `details`, `notes`, `private`, `plateId`, `transportId`, `securityBoothId`
- **Acciones/botones → mutation:**
  - Nueva visita (visitante/servicio/empleado) → `createVisitorVisit(id,visit)` / `createServiceVisit(id,visit)` / `createEmployeeVisit(id,visit)`
  - Autorizar / Dar acceso / Salida → `statusVisit(id, securityBooth, status)`
  - Reportar → `createInsident(insident:InsidentParams)` (reason, visitId) ; ver `residentReportVisit` (móvil)
  - Notificar paquetería → `statusVisit` (status paquetería) / notificación
  - QR Auto / QR Caminando (escaneo) → `visitWithQrCode(folio,visit)` / `visitorWithQrCode(code,visit)` / `visitorWithSecretCode` / `leaveVisitWithQrCode`
  - Tomar/actualizar foto → `imageVisit(id,kind,type)` / `updateImageEmployee`

---

## 5. Autos y placas — ✅

- **Ruta V2:** `/autos` · **V1:** `/admin/cars`
- **Propósito:** registro de placas/vehículos, LPR, lista negra/gris, REPUVE, asignaciones.
- **Sub-rutas V1:** alta/edición de placa (inline). Sugeridas: `/autos/new`, `/autos/[id]/edit` ⬜.
- **Campos — `PlateParams`:** `number*`, `brand`, `model`, `year`, `classType`, `kind`, `blacklist`.
- **Datos:** `platesForAdmin(page,search)`, `platesByHouseForAdmin`, `platesByVisitorForAdmin`,
  `repuve(plate,visit)`, `lpr(accessKind,securityBooth)`.
- **Acciones → mutation:** Nueva placa → `createPlate(plate)` · Editar → `updatePlate(id,plate)` ·
  Lista negra/gris → `blacklistPlate(id)` · REPUVE (consulta) → `repuve(plate,visit)` ·
  Leer placa (LPR) → `lpr(accessKind,securityBooth)` ·
  Asignar a casa → `asignHousePlate(house,plate)` · a visitante → `asignVisitorPlate(plate,visitor)` ·
  a empleado → `asignEmployeePlate(employee,plate)`.

---

## 6. Lista negra — ✅

- **Ruta V2:** `/lista-negra` · **V1:** `/admin/insidents` (incidentes/vetados)
- **Propósito:** placas y visitantes vetados o en lista gris, con motivo.
- **Datos:** `listInsidents(dateStart,dateEnd,search,page)`, `platesForAdmin` (blacklist=true).
- **Campos — `InsidentParams`:** `reason*`, `visitId*`.
- **Acciones → mutation:** Vetar placa → `blacklistPlate(id)` · Vetar por incidente → `blacklistInsident(insident)` ·
  Registrar incidente → `createInsident(insident:InsidentParams)`.

---

## 7. Avisos — ✅

- **Ruta V2:** `/avisos` · **V1:** `/notices` (alias `/notces`)
- **Propósito:** comunicados a toda la empresa o a un domicilio.
- **Sub-rutas V1:** nuevo aviso (modal). Sugerida: `/avisos/new` ⬜.
- **Campos — `NoticeParams`:** `description*`, `kind*` (general/cobranza/emergencia), `houseId` (opcional → si va a un depto).
- **Datos:** `notices()`, `houseNotices(house)`.
- **Acciones → mutation:** Nuevo aviso → `createNotice(notice:NoticeParams)` ·
  Cambiar estatus (activo/inactivo) → `updateNotice(id, notice:NoticeUpdateParams{status})`.

---

## 8. Sugerencias y quejas (tickets) — ✅

- **Ruta V2:** `/sugerencias` · **V1:** módulo de tickets/soporte
- **Propósito:** tickets de la comunidad (queja/sugerencia), con categorías y respuestas.
- **Sub-rutas sugeridas:** `/sugerencias/[id]` (hilo de respuestas), `/sugerencias/categorias` ⬜.
- **Campos — `TicketParams`:** `subject*`, `description*`, `ticketCategoryId*`.
- **Datos:** `ticketsForAdmin(page,search,status)`, `ticketCategoriesForAdmin`, `listTicketResponses(ticket,page,search)`, `activeTicketCategories`.
- **Acciones → mutation:** Crear ticket → `createTicket(ticket:TicketParams)` · Responder → `createTicketResponse(ticketId,message)` ·
  Editar respuesta → `updateTicketResponse(id,message)` · Cambiar estatus → `statusTicket(id,status)` ·
  Categorías: `createTicketCategory(name)`, `updateTicketCategory(id,name)`, `statusTicketCategory(id)`, `deleteTicketCategory(id)`.

---

## 9. Reportes (hub) — ✅ catálogo plano; ⬜ falta replicar como hub con 14+ sub-reportes

- **Ruta V2 actual:** `/reportes` (catálogo de 15 tarjetas) · **V1:** `/admin/reports-dashboard` (hub)
- **Propósito:** reportes operativos, de seguridad, cobranza y comunidad, con descarga.
- **Filtros comunes:** rango de fechas (dateStart, dateEnd), paginación, búsqueda.
- **Sub-rutas V1 (cada una ⬜ como ruta propia en V2):**

| Sub-reporte V1 | Ruta V1 | Query fuente |
|----------------|---------|--------------|
| Por guardia | `/admin/reports/by-guard` | `adminGuardVisits(userId,kind,...)` |
| Visitas por domicilio | `/admin/reports/house-visits` | `adminHouseVisits(houseId,kind,...)` |
| Visitas dentro | `/admin/reports/visits-inside` | `visitsToday(status:"inside")` / `adminVisits` |
| Por placa | `/admin/reports/by-plate` | `adminVisits(plate)` |
| Visitas con QR | `/admin/reports/qr-visits` | `adminVisitorVisits` (filtrado QR) |
| Total de QRs | `/admin/reports/total-qrs` | agregación de visitas QR |
| Visitas de evento | `/admin/reports/event-visits` | `eventsForAdmin` + `residentEventVisits`/`visitorsEventForAdmin` |
| Autos | `/admin/reports/autos` | `platesForAdmin` / `adminVisits(plate)` |
| Avisos | `/admin/reports/notices` | `notices()` |
| Incidentes | `/admin/insidents` | `listInsidents` |
| Uso de la aplicación | `/admin/reports-application-use` | `instances` / `instanceLogs` |
| Usuarios activos | `/admin/reports/active-users` | `usersForAdmin` (status activo) |
| Usuarios eliminados | `/admin/reports/deleted-users` | `usersForAdmin` (eliminados) |
| Paquetería / envíos | `/admin/reports/shipping` | `adminVisits` (kind paquetería) |

- **Acciones:** filtrar por rango/caseta/guardia/depto; **Exportar/Descargar** (CSV/PDF → backend).

---

## 10. Configuración (hub) — ✅ feature flags; ⬜ falta agrupar como hub con 5 secciones

- **Ruta V2 actual:** `/configuracion` (flags) · **V1:** `/admin/configuration-dashboard` (hub)
- **Propósito:** configuración del tenant y catálogos de operación.
- **Sub-secciones V1 (cada una su propia ruta):**

### 10.1 Configurar residencial — V1 `/residentials/configuration` · V2 ✅ (en `/configuracion`)
- **Propósito:** modo (residencial/corporativo/industrial) + feature flags.
- **Datos:** `myResidential()`.
- **Acciones (toggles, mutations sin params salvo tiempo):**
  - Tiempo de confirmación → `updateResidentialConfirmationTime(time:Int)`
  - Chat de acceso → `updateResidentialAccessChat()`
  - Frecuentes por placa → `updateResidentialFrequentlyByPlate()`
  - QR on/off → `updateQrStatus()`
  - Código secreto on/off → `updateSecretCodeStatus()`
  - (flags facial/LPR/REPUVE/reservaciones/paquetería: estado de `Residential`)

### 10.2 Casetas / Cámaras IP — V1 `/admin/security-booths` · V2 ✅ `/casetas`
- **Campos caseta — `SecurityBoothParams`:** `name*`, `channel*`, `main`, `doubleCheck`, `printer`, `status`.
- **Campos cámara — `CameraParams`:** `name*`, `cameraType*`, `kind*`, `reference*`, `url*`, `securityBoothId*`, `status`.
- **Datos:** `securityBoothsForAdmin`, `securityBoothForAdmin(id)`, `camerasBySecurityBooth(securityBooth)`.
- **Sub-rutas sugeridas:** `/casetas/new`, `/casetas/[id]`, `/casetas/[id]/edit`, `/casetas/[id]/camaras` ⬜.
- **Acciones → mutation:** Nueva caseta → `createSecurityBooth(securityBooth,tenant)` · Editar → `updateSecurityBooth(id,...)` ·
  Nueva cámara → `createCamera(camera,tenant)` · Editar cámara → `updateCamera(id,...)` · Cámara automática → `updateAutomaticCamera(id)`.

### 10.3 Servicios — V1 `/admin/services` · V2 ✅ `/servicios`
- **Campos — `ServiceParams`:** `name*`, `status*` (incluye "pide detalles" como flag de servicio).
- **Datos:** `servicesForAdmin(search)`.
- **Acciones → mutation:** Nuevo → `createServiceForAdmin(service)` · Editar → `updateServiceForAdmin(id,service)` · Eliminar → `deleteServiceForAdmin(id)`.

### 10.4 Proveedores / Transportes — V1 `/providers` · ⬜ no existe en V2
- **Campos — `TransportParams`:** `name*`, `plates*` (bool, ¿pide placas?).
- **Datos:** `transportsForAdmin`, `transportByName(name)`.
- **Acciones → mutation:** Nuevo → `createTransportForAdmin(transport)` · Editar → `updateTransportForAdmin(id,transport)`.
- **Ruta sugerida V2:** `/proveedores` ⬜.

### 10.5 Sucursales / Sedes — V1 `/admin/branches` · V2 ✅ `/sedes`
- **Propósito:** operación multi-sede (corporativo/industrial): cada sede agrupa casetas y unidades.
- **Datos:** `securityBoothsForAdmin` por sede; `securityBooths(tenant)`.
- **Acciones:** alta/edición de sede (modelo de tenant; mutation dedicada no expuesta en V1 — gestionar vía Supabase).

---

## 11. Sedes — ✅ (también listada como sub-config 10.5)

- **Ruta V2:** `/sedes` · **V1:** `/admin/branches` — ver 10.5.

---

## Módulos del esquema SIN ruta en V2 (backlog admin)

| Módulo | Ruta sugerida V2 | Params / queries | Mutations | Estado |
|--------|------------------|------------------|-----------|--------|
| Eventos | `/eventos` (+`/new`,`/[id]`) | `EventParams`{name*,dueDate*,open*,houseId,cars,deleted}; `eventsForAdmin`,`eventForAdmin`,`eventsTodayForAdmin` | `createEvent`,`updateEvent`,`asignEventVisitor(event,visitor)` | ⬜ 🔭 |
| Reservaciones / Amenidades | `/reservaciones`, `/espacios` | `ReservationParams`{spaceId*,reason*,startDate*,endDate*,denyReason}; `reservationsForAdmin`,`spacesForAdmin`,`activeReservations` | `createReservation`,`updateReservation`,`statusReservation(id,status,denyReason)`,`deleteReservation`; espacios: `createSpace(name)`,`updateSpace`,`statusSpace`,`deleteSpace` | ⬜ 🟡 (modelo listo) |
| Empleados domésticos (admin) | (dentro de depto / `/empleados`) | `EmployeeParams`{name*,houseId*,days*,timeStart*,timeEnd*,folio,credential,reference,avatar}; `employeesForAdmin`,`employeesHouseForAdmin` | `createEmployee`,`updateEmployee`,`deleteEmployee`,`updateImageEmployee` | ⬜ |
| Alertas de pánico | `/panico` | `panicAlerts(dateStart,dateEnd,search,page)`,`housePanicAlerts` | `seePanicAlert(id)`,`updatePanicAlert(id,PanicAlertUpdateParams{status})` | ⬜ 🔭 |
| Etiquetas TAG (telepeaje) | `/etiquetas` | `TagParams`{tagNumber*,kind*,userId*,car,plates}; `tagsForAdmin` | `createTag`,`updateTag`,`statusTag`,`deleteTag` | ⬜ |
| Capacitación (videos) | `/capacitacion` | `VideoParams`{videoId*,user*,body*}; `getVideoLarning`,`videoCommentsByVideo`,`solutionsByProblem` | `createVideo`,`voteSolutionLike`,`voteSolutionDislikes` | ⬜ 🔭 |
| Roles | (dentro de Usuarios) | `RolParams`{name*}; `rolsPublic` | `createRol(rol,tenant)`,`updateRol(id,rol,tenant)` | ⬜ |
| Notificaciones | (header/realtime) | `notifications(tennant,user)` | `notificationUpdate(id,tennant)` | ⬜ 🔭 |
| Instancias / Logs (uso de app) | `/reportes/uso-app` | `instances(instance)`,`instanceLogs(instance,tennant)` | `createInstanceLog`,`createInstanceLogDevice` | ⬜ |

---

## Resumen de conteo

### Rutas del panel admin (clon de V1)

Conteo de **rutas/sub-rutas de admin** identificadas como objetivo del clon (excluye apps móviles
de residente y caseta, que son `📱`):

| Categoría | Rutas |
|-----------|------:|
| Auth (`/login`, `/`) | 2 |
| Dashboard | 1 |
| Usuarios: hub `/usuarios` + 5 secciones | 6 |
| Usuarios: sub-rutas form (`/new`, `/:id/edit`, `/:id/status` × 5) | 15 |
| Departamentos: lista + `/new` + `/:id` + `/:id/edit` + `/:id/defaulter` | 5 |
| Visitas: lista + `/new` + `/:id` | 3 |
| Autos: lista + `/new` + `/:id/edit` | 3 |
| Lista negra / incidentes | 1 |
| Avisos: lista + `/new` | 2 |
| Sugerencias: lista + `/:id` + `/categorias` | 3 |
| Reportes: hub + 14 sub-reportes | 15 |
| Configuración: hub + 5 secciones (residencial, casetas, servicios, proveedores, sedes) | 6 |
| Casetas: `/new` + `/:id` + `/:id/edit` + `/:id/camaras` | 4 |
| Servicios: `/new` (inline ok) | 1 |
| Proveedores (módulo nuevo) | 1 |
| Sedes (detalle/edición) | 2 |
| Backlog del esquema (eventos, reservaciones, espacios, empleados, pánico, etiquetas, capacitación, instancias) | 16 |
| **TOTAL rutas/sub-rutas admin** | **86** |

### Estado de construcción (archivos en `apps/admin-web/src/app/(app)`)

**Ya construido (✅, archivo existe):** 16 páginas/rutas
- `/dashboard`, `/visitas`, `/departamentos`, `/autos`, `/usuarios` (hub),
  `/usuarios/[seccion]` (cubre las 5 secciones: admins, supervisores, colaboradores, guardias, visitantes),
  `/lista-negra`, `/avisos`, `/sugerencias`, `/reportes` (catálogo plano),
  `/sedes`, `/casetas`, `/servicios`, `/configuracion`, más `/login` y `/` (raíz).

**Pendientes (⬜) — aprox. 70 sub-rutas/rutas:**
- **Sub-rutas de formulario/detalle** que en V1 son páginas propias y en V2 aún no existen como archivo
  (hoy inline/modal o sin implementar): ~`/new`, `/[id]`, `/[id]/edit`, `/[id]/status`, `/[id]/defaulter`
  para usuarios, departamentos, visitas, autos, avisos, casetas, sugerencias. (~40 rutas)
- **Reportes como hub** con 14 sub-reportes navegables. (14 rutas)
- **Configuración como hub** con sus 5 secciones separadas + Proveedores nuevo. (~6 rutas)
- **Módulos de backlog** sin ruta alguna: eventos, reservaciones, espacios, empleados domésticos,
  alertas de pánico, etiquetas TAG, capacitación, instancias/logs, roles. (~16 rutas)

### Conteo final
- **Rutas/sub-rutas admin totales a clonar:** **86**
- **Construidas (página existe):** **16** (de ellas 2 son profundas con CRUD real: Usuarios y Departamentos)
- **Pendientes por construir:** **~70**

> Las pantallas de **app móvil** (residente `apps/resident`, caseta `apps/guard`) NO se cuentan aquí;
> están detalladas en `07-cobertura-modulos.md` secciones B y C y mapeadas a las mutations `resident*`,
> `visitWithQrCode`, `statusVisit`, etc.
