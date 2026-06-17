# 12 — Spec exhaustivo: App de RESIDENTE (`com.kgvisit.app` → Expo `apps/resident`)

Spec pantalla por pantalla para **clonar la app de residente tal cual** en Expo (React Native),
consumiendo el backend Supabase. Cada pantalla documenta: **propósito · campos visibles/editables ·
acciones/botones · query/mutation GraphQL equivalente** (V1, endpoint `POST https://administracion.visitapp.io/api/v1`,
Absinthe/Phoenix).

Fuentes: `09-apps-moviles.md` (flujos en vivo en MuMu), `06-api-graphql.md` (catálogo), `07-cobertura-modulos.md`
(botón por botón), y el esquema GraphQL introspectado (`/tmp/kgvisit_schema.json`) parseado para los `*Params`
y tipos de retorno exactos.

> **Feature flags por tenant.** La query `myResidential` devuelve `Residential` con `residentApp: ResidentApp`
> y `configuration: ResidentialModules`. Los flags `residentApp.hide*` (hideEvent, hideNotice, hideVisitor,
> hideEmployee, hideResident, hideNewVisit, hideQuickVisit, hideAirbnb, hideAmenity, hideCommunity, hideCompany,
> hideSurvey, hideVisitList, hideNotification, hideCloseEvent, hideWalkingTransport, hideNotLeaveVisits) ocultan
> secciones/botones, y `residentApp.visitDetailsHide*` ocultan campos del detalle de visita. Toggles de tenant
> relevantes: `qr/qrVisitors/qrEmployees/walkingQr/qrNumeric`, `secretCode`, `frequentlyByPlate`, `accessChat`,
> `reservations`, `suggestions/residentSuggestions`, `residentUpdateVisitors`, `residentFacial`, `visitorExpiration(+Time)`,
> `showQrFolioToResidents`. La app debe leer estos flags al iniciar sesión y renderizar condicionalmente.

---

## 0. Autenticación (previa al tab bar)

### 0.1 Login
- **Propósito:** iniciar sesión del residente.
- **Campos editables:** `username`, `password`, `residencial/channel` (selector de tenant).
- **Acciones:** **Iniciar sesión**, **¿Olvidaste tu contraseña?**
- **GraphQL:**
  - `login(username: String!, password: String!, channel: String!, idDevice: String!) -> Login { token, authToken, rol, super, ... }`
  - `recoveryPassword(email: String!, channel: String!, hash: String!) -> User`
- Al autenticar se registra el dispositivo: `createInstanceLogDevice(instanceLog: InstanceLogDeviceParams)` /
  `createInstanceLog(instanceLog: InstanceLogParams)` (push token expo-notifications).

---

## 1. Inicio / Dashboard

- **Propósito:** hub de acceso rápido. Navegación inferior global: **Inicio · Visitas · Pánico · Perfil**.
- **Campos visibles:** nombre del residente y domicilio (de `myProfile.name` / `myProfile.house`),
  logo del residencial (`myResidential.logo`), badge de no leídos en Avisos/Notificaciones.
- **Tarjetas / accesos (cada una navega a su pantalla):**
  - **Notificaciones** (centro de actividad) → §8
  - **Visitantes** (frecuentes) → §3
  - **Avisos** (comunicados, con badge de no leídos) → §7
  - **Staff / Empleados domésticos** → §4
  - **Visitas** (acceso directo, también en tab) → §2
  - **Eventos** → §6 (si `!residentApp.hideEvent`)
  - **Reservaciones** → §11 (si `myResidential.reservations`)
- **GraphQL (carga inicial):**
  - `myProfile -> User`
  - `myResidential -> Residential` (flags) ; `residentRestingHouse -> House`
  - `notifications(tennant: String!, user: ID!) -> [Notification]` (para badge)
  - `residentNotices -> [Notice]` (para badge de avisos)

---

## 2. Visitas

### 2.1 Listado de visitas
- **Propósito:** ver y gestionar las visitas creadas por el residente.
- **Campos por fila (de `Visit`):** `subject`, `status` (estatus: Autorizada…), `folio`, `transport.name`
  (transporte), `kind`, `dueDate`/`arriveDate`, `visitor.name`/`service.name`/`employee.name` según tipo.
- **Acciones:** **Buscar** (texto), **Filtro**, botón **QR** por visita (abre el pase → §2.4), **Nueva visita** (FAB → §2.2),
  abrir **detalle** de visita (§2.3).
- **GraphQL (listados):**
  - `residentsVisits(dateStart: String!, dateEnd: String!, page: Int!, search: String!) -> VisitWithPage { visits: [Visit], total }`
  - `residentPrivateVisits(dateStart: String!, dateEnd: String!, page: Int!) -> VisitWithPage` (visitas privadas)
  - `residentCanceledVisits -> [Visit]` (canceladas)
  - `residentShowVisit(id: ID!) -> Visit` (detalle)

### 2.2 Nueva visita — asistente por pasos
- **Propósito:** crear una visita y generar QR/pase. Oculto si `residentApp.hideNewVisit`.
- **Pasos (wizard):**
  1. **Fecha y hora** — cuándo estará disponible → `dueDate`.
  2. **Vigencia** — horas de validez (p.ej. 24h) → `validity` (la usa el backend; expira con `visitorExpiration*`).
  3. **Transporte** — auto / peatonal → `transportId` (catálogo `Transport`; "peatonal" oculto si `hideWalkingTransport`).
     Si transporte con placas → captura/selección de placa → `plateId`.
  4. **Tipo + datos del visitante** — elige una de tres ramas:
     - **Visitante** (conocido / familia): `visitorId` + `subject`, `details`, `private`, `kind`.
     - **Servicio / proveedor**: `serviceId` (+ `details` si el servicio "pide detalles") + `subject`, `private`, `kind`.
     - **Empleado** (doméstico ya dado de alta): `employeeId` + `subject`, `private`, `kind`.
  - → **genera QR / pase** (§2.4).
- **Campos editables (exactos, de los `*Params`):**
  - **`ResidentVisitVisitorParams`** (`residentCreateVisitorVisit`): `visitorId: ID!`, `subject: String!`,
    `dueDate: String!`, `kind: String!`, `private: Boolean!`, `transportId: ID!`, `plateId: ID`, `details: String`.
  - **`ResidentVisitServiceParams`** (`residentCreateServiceVisit`): `serviceId: ID!`, `subject: String!`,
    `dueDate: String!`, `kind: String!`, `private: Boolean!`, `transportId: ID!`, `plateId: ID`, `details: String`.
  - **`ResidentVisitEmployeeParams`** (`residentCreateEmployeeVisit`): `employeeId: ID!`, `plateId: ID!`,
    `subject: String!`, `dueDate: String!`, `kind: String!`, `private: Boolean!`, `transportId: ID`, `details: String`.
- **GraphQL (mutations de creación):**
  - `residentCreateVisitorVisit(visit: ResidentVisitVisitorParams) -> Visit`
  - `residentCreateServiceVisit(visit: ResidentVisitServiceParams) -> Visit`
  - `residentCreateEmployeeVisit(visit: ResidentVisitEmployeeParams) -> Visit`
- **Catálogos para el wizard:** `Transport` (vía `transportsForAdmin`/`transportsPublic`), `Service`
  (`servicesForAdmin`/`servicesPublic`), visitantes (`residentVisitors`), empleados (`residentEmployees`),
  placas del visitante (`residentVisitorsByPlate(plate)`).

### 2.3 Detalle de visita
- **Propósito:** ver el estado completo de una visita y actuar sobre ella.
- **Campos visibles (de `Visit`; cada uno ocultable con su `residentApp.visitDetailsHide*`):**
  `folio`, `subject`, `kind`, `status`, `accessKind`, `dueDate`, `arriveDate`, `enterDate`, `leaveDate`,
  `mainAccessEnterDate`, `permanence`, `details`, `reportDetails`/`residentReport`, creado por (`user`/`accessUser`),
  `transport.name`, `plate.number`, `visitor`/`service`/`employee`, `photos`, `securityBooth`, `validity`,
  `autoCardNumber` (si `visitAutoCard`). El QR/folio sólo si `showQrFolioToResidents`.
- **Acciones:** **Ver QR** (§2.4), **Cancelar/Eliminar visita**, **Reportar visita**, **Cambiar estatus** (cancelar).
- **GraphQL:**
  - `residentShowVisit(id: ID!) -> Visit`
  - `residentDeleteVisit(id: ID!) -> Visit`
  - `residentStatusVisit(id: ID!, status: String!) -> Visit`
  - `residentReportVisit(id: ID!) -> Visit`

### 2.4 Pase / QR de la visita (flujo QR)
- **Propósito:** mostrar el código que el guardia escanea para dar acceso.
- **Campos visibles:** QR (codifica `folio` de la visita), `folio` (si `showQrFolioToResidents`),
  logo en el QR (`configuration.residentAppQrLogo`, tamaño `residentAppQrSize`), mensaje custom
  (`residentApp.customMessageQr`), dirección en el QR (`residentApp.addressOnQr`), `secretCode` numérico si aplica.
- **Acciones:** Compartir QR (imagen/link), regenerar/actualizar código.
- **Flujo QR (lado caseta — referencia para clon):** el guardia escanea con `visitWithQrCode(folio, visit)`
  (QR Auto / QR Caminando) → valida → `statusVisit(id, securityBooth, status)` para **dar acceso**, y
  `leaveVisitWithQrCode(folio, securityBooth)` a la **salida**. (Estos son del lado guardia; el residente sólo
  presenta el QR.)

> **Estados de una visita (`Visit.status`, string).** Mapa de estados observados en el flujo: pre-autorizada →
> **Autorizada** (lista para acceso) → **Acceso/Dentro** (registró `enterDate`/`mainAccessEnterDate`) →
> **Salida/Finalizada** (registró `leaveDate`). Estados adicionales: **Cancelada** (vía `residentStatusVisit`/
> `residentDeleteVisit`), **Reportada** (`residentReport=true` vía `residentReportVisit`), **Privada** (`private=true`).
> El estatus se muestra como etiqueta en el listado (§2.1) y en el detalle (§2.3); el backend lo transiciona con
> `statusVisit`/`visitWithQrCode` desde caseta. `accessKind` indica Auto vs Caminando; `fails` cuenta intentos fallidos de QR.

---

## 3. Visitantes frecuentes

### 3.1 Listado
- **Propósito:** administrar visitantes recurrentes (relación visitante↔casa = `VisitorHouse`).
- **Campos por fila:** `visitor.name`, `visitor.avatar`, `frecuently` (es frecuente), `frecuentlyCode`,
  `qrCode`, `status`, `unexpected`. Límite por `house.frequentlyLimit`.
- **Acciones:** **Buscar**, **Nuevo visitante**, abrir detalle, **QR / código** por visitante.
- **GraphQL:**
  - `residentVisitors(page: Int!, search: String!) -> VisitorWithPage { visitors: [Visitor], total }`
  - `residentVisitor(id: ID!) -> VisitorHouse`
  - `residentVisitorsByPlate(plate: String!) -> [Visitor]` (búsqueda por placa si `frequentlyByPlate`)

### 3.2 Alta / edición de visitante frecuente
- **Campos editables (alta de `Visitor` — `VisitorParams`):** `name: String!`, `username: String`,
  `curp: String`, `avatar: String`, `unexpected: Boolean`.
- **Campos editables (relación — `ResidentVisitorUpdateParams`):** `frecuently: Boolean`, `status: Boolean`, `unexpected: Boolean`.
- **Acciones:** Guardar, **Generar/actualizar QR**, **Actualizar código**, **Actualizar credencial**, **Asignar vehículo/placa**.
- **GraphQL:**
  - `residentUpdateVisitor(id: ID!, visitor: ResidentVisitorUpdateParams) -> VisitorHouse`
  - `residentUpdateVisitorQrCode(id: ID!) -> VisitorHouse`
  - `residentUpdateVisitorCode(id: ID!) -> VisitorHouse`
  - `residentAssignVehicle(visitor: ID!, plate: ID!) -> Plate` ; `residentAssignPlate(plate: ID!) -> HousePlate`
  - `updateVisitorCredential(...) -> Visitor` (credencial)
  - *(Nota: la creación de visitante usa `createVisitor`/`asignVisitorHouse` del catálogo general; sólo `residentUpdateVisitors` permite que el residente edite.)*

---

## 4. Empleados domésticos / Staff

### 4.1 Listado
- **Propósito:** administrar el personal doméstico de la casa (servicio, niñera, etc.). Oculto si `residentApp.hideEmployee`.
- **Campos por fila (de `Employee`):** `name`, `avatar`, `reference`, `folio`, `credential`, `days` (días),
  `timeStart`/`timeEnd` (horario), `schedules: [EmployeeSchedule {day, timeStart, timeEnd}]`, `status`.
  Límite por `house.employeeLimit`.
- **Acciones:** **Nuevo empleado**, editar, **eliminar**, **QR**, **actualizar folio**.
- **GraphQL:** `residentEmployees -> [Employee]`

### 4.2 Alta / edición de empleado
- **Campos editables (`ResidentEmployeeParams`):** `name: String!`, `days: String!`, `timeStart: String!`,
  `timeEnd: String!`, `avatar: String`, `credential: String`, `folio: String`, `reference: String`.
- **Acciones:** Guardar, **Generar/actualizar QR**, **Actualizar folio**, foto facial, **Eliminar**.
- **GraphQL:**
  - `residentCreateEmployee(employee: ResidentEmployeeParams) -> Employee`
  - `residentUpdateEmployee(id: ID!, employee: ResidentEmployeeParams) -> Employee`
  - `residentDeleteEmployee(id: ID!) -> Employee`
  - `residentUpdateEmployeeQr(id: ID!) -> Employee`
  - `residentUpdateEmployeeFolio(id: ID!) -> Employee`
  - `residentImageEmployee(id: ID!, kind: String!) -> Request` (subida de foto/credencial facial)

### 4.3 Gestión de departamento / familiares (sub-sección)
- **Propósito:** administrar residentes/familiares de la casa. Oculto si `residentApp.hideResident`.
- **Campos editables (alta — `ResidentParams`):** `name: String!`, `username: String!`, `passwordField: String!`,
  `representative: Boolean!`, `email: String`, `avatar: String`.
- **Campos editables (edición — `UpdateResidentParams`):** `name: String!`, `representative: Boolean!`,
  `email: String`, `avatar: String`, `status: Boolean`.
- **GraphQL:**
  - `residents -> [User]` (listado de familiares de la casa)
  - `residentCreateResident(user: ResidentParams) -> User`
  - `residentUpdateResident(id: ID!, user: UpdateResidentParams) -> User`
  - `residentDeleteResident(id: ID!) -> User`

---

## 5. (reservado — incluido en §11 Reservaciones)

---

## 6. Eventos

### 6.1 Listado de eventos
- **Propósito:** crear eventos (fiestas/reuniones) con invitados y QR de evento. Oculto si `residentApp.hideEvent`.
  Sujeto a `myResidential.openEvents/closeEvents/openEventQr/closeEventQr`.
- **Campos por fila (de `Event`):** `name`, `dueDate`, `finishDate`, `folio`, `open` (abierto/cerrado),
  `cars` (cupo de autos), `space`, `qrUrl`, `visitors: [EventVisitor]`, `visits: [VisitSmall]`.
- **Acciones:** **Nuevo evento**, abrir detalle, ver **QR de evento**, gestionar invitados.
- **GraphQL:**
  - `residentEvents -> [Event]`
  - `residentEventVisits(id: ID!) -> [Visit]` (visitas/accesos del evento)
  - `residentVisitorsByEvent(event: ID!) -> [VisitorEvent]` (invitados)
  - `residentEventUnexpectedVisitors(event: ID!) -> [VisitorEvent]` (invitados no esperados)

### 6.2 Alta de evento
- **Campos editables (`EventParams`):** `name: String!`, `dueDate: String!`, `open: Boolean!`,
  `cars: Int`, `houseId: ID`, `deleted: Boolean`.
- **Acciones:** Guardar (genera `folio`/`qrUrl`), añadir invitados, cerrar evento.
- **GraphQL:** `createEvent(event: EventParams) -> Event` (+ asignación de invitados vía catálogo `asignEventVisitor`).

---

## 7. Avisos (comunicados del residencial)

- **Propósito:** leer comunicados de la administración (general / cobranza / emergencia). Oculto si `residentApp.hideNotice`.
- **Campos por fila (de `Notice`):** `kind` (tipo: general/cobranza/emergencia), `description`, `file` (adjunto),
  `status`, `insertedAt`, `user` (autor). Badge de no leídos en Inicio.
- **Acciones:** abrir aviso, ver/descargar adjunto. (Lectura; el residente normalmente no crea avisos —
  `createNotice(notice: NoticeParams)` existe pero es de administración.)
- **GraphQL:** `residentNotices -> [Notice]`

---

## 8. Notificaciones (centro de actividad)

- **Propósito:** feed en tiempo real de eventos (accesos, autorizaciones, alertas). Oculto si `residentApp.hideNotification`.
- **Campos por fila (de `Notification`):** `message`, `viewed` (leído/no leído), `insertedAt`.
- **Acciones:** abrir/marcar como leída (al abrir), pull-to-refresh. Badge de no leídos en Inicio.
- **GraphQL:**
  - `notifications(tennant: String!, user: ID!) -> [Notification]`
  - `notificationUpdate(id: ID!, tennant: String!) -> Notification` (marcar vista)
- Push: registro de dispositivo vía `createInstanceLogDevice` (expo-notifications).

---

## 9. Pánico

- **Propósito:** disparar una alerta de emergencia geolocalizada a la caseta.
- **Campos:** ubicación automática (`lat`, `lng` del dispositivo). Tab inferior dedicado.
- **Acciones:** **Botón de pánico** (mantener/confirmar) → envía alerta; ver historial de alertas propias.
- **GraphQL:**
  - `createPanicAlert(panicAlert: PanicAlertParams { lat: Float, lng: Float }) -> PanicAlert`
  - `residentPanicAlerts -> [PanicAlert]` (historial; campos `kind`, `status`, `saw`, `guard`, `house`, `insertedAt`)

---

## 10. Perfil

### 10.1 Pantalla de perfil (menú)
- **Propósito:** datos del usuario y accesos a ajustes/legal/soporte.
- **Campos visibles/editables (de `myProfile -> User`):** `name`, `username`, `email`, `phone`, `avatar`,
  `house` (domicilio), `rol`, `notificationSound`, `qrCode`, `representative`, `validated`/`status`.
- **Opciones del menú (cada una navega):**
  - **Actualizar perfil** (editar nombre/email/avatar/teléfono)
  - **Cambiar contraseña** (§10.2)
  - **Sonido de notificaciones** (`notificationSound`)
  - **Avisos** (atajo a §7)
  - **Aviso de privacidad** (vista estática/web)
  - **Sugerencias / quejas** (§10.3)
  - **Chat de soporte** (bot IA — backlog 🔭)
  - **Borrar cuenta** (eliminación de cuenta)
  - **Cerrar sesión** → `logout()`
- **GraphQL:** `myProfile -> User` (la edición de perfil del residente se realiza vía `residentUpdateResident`
  sobre el propio id, o `updateUserForAdmin` lado backend; el avatar/datos personales se guardan con
  `UpdateResidentParams`).

### 10.2 Cambiar contraseña
- **Campos editables:** nueva contraseña (+ confirmación).
- **GraphQL:**
  - `updateMyPassword(password: String!) -> User`  *(también disponible `residentPassword(password: String!) -> User`)*

### 10.3 Sugerencias / quejas (tickets)
- **Propósito:** levantar tickets de queja o sugerencia. Disponible si `myResidential.suggestions` /
  `residentSuggestions`. Categorías/estatus configurables en `suggestionsCategories/suggestionsKinds/suggestionsStatus`.
- **Campos editables (`TicketParams`):** `subject: String!`, `description: String!` (comentario),
  `ticketCategoryId: ID!` (concepto/categoría). Adjuntar imagen (avatar/archivo).
- **Acciones:** **Nueva sugerencia/queja**, ver listado, abrir detalle, **responder** (chat del ticket).
- **GraphQL:**
  - `myTickets(page: Int!, search: String!, status: String!) -> TicketWithPage { tickets: [Ticket], total }`
  - `createTicket(ticket: TicketParams) -> Ticket`
  - `createTicketResponse(ticketId: ID!, message: String!) -> TicketResponse`
  - Campos de `Ticket`: `subject`, `description`, `status`, `ticketCategory`, `user`, `insertedAt`.

---

## 11. Reservaciones (amenidades)

### 11.1 Listado de reservaciones
- **Propósito:** reservar espacios/amenidades del residencial. Disponible si `myResidential.reservations`. Oculto si `residentApp.hideAmenity`.
- **Campos por fila (de `Reservation`):** `space.name`, `startDate`/`endDate` (`startHour`/`endHour`, `day`/`month`/`year`),
  `reason`, `status`, `denyReason`, `price`/`paid`/`paymentVoucher`, `qrCode`, `authorizationUser`.
- **Acciones:** **Nueva reservación**, ver detalle, subir comprobante de pago (si `space.uploadPaymentReceipt`),
  ver **QR** de acceso a la amenidad, cancelar.
- **GraphQL:**
  - `spacesForResident -> [Space]` (catálogo de amenidades: `name`, `guestsLimit`, `price`, `deposit`, `pay`,
    `qrAccess`, `facialAccess`, `reservationLimit`, `reservationFutureLimit`, `uploadPaymentReceipt`, `status`)
  - `reservationsForResident(spaceId: String!, dateStart: String!, dateEnd: String!, page: Int!, status: String!) -> ReservationWithPage { reservations: [Reservation], total }`

### 11.2 Alta de reservación
- **Campos editables (`ReservationParams`):** `spaceId: ID!`, `startDate: String!`, `endDate: String!`,
  `reason: String!`, `denyReason: String`.
- **GraphQL:** `createReservation(reservation: ReservationParams) -> Reservation`
  *(actualización: `ReservationUpdateParams { spaceId, startDate, endDate, reason }`)*

---

## Apéndice A — Tipos de retorno clave (campos a renderizar)

- **Visit:** id, folio, subject, kind, status, accessKind, private, validity, dueDate, arriveDate, enterDate,
  leaveDate, mainAccessEnterDate, permanence, details, reportDetails, residentReport, fails, autoCardNumber,
  visitor, service, employee, transport, plate, photos[], house, securityBooth, user, accessUser, leaveUser, event, complement.
- **VisitorHouse:** id, frecuently, frecuentlyCode, qrCode, status, unexpected, visitor, house, faceId, facialVerificationStatus.
- **Visitor:** id, name, username, curp, avatar, phone, company, credential, status, visitorHouses[].
- **Employee:** id, name, avatar, reference, folio, credential, days, timeStart, timeEnd, schedules[], status, faceId.
- **Event:** id, name, dueDate, finishDate, folio, open, cars, qrUrl, space, visitors[], visits[].
- **Notice:** id, kind, description, file, status, insertedAt, user, house.
- **Notification:** id, message, viewed, insertedAt.
- **PanicAlert:** id, lat, lng, kind, status, saw, guard, house, user, insertedAt.
- **Reservation:** id, space, startDate, endDate, startHour, endHour, reason, status, denyReason, price, paid,
  paymentVoucher, qrCode, authorizationUser.
- **Ticket:** id, subject, description, status, ticketCategory, user, insertedAt.
- **User (myProfile):** id, name, username, email, phone, avatar, house, rol, notificationSound, qrCode,
  representative, status, validated.

## Apéndice B — Estados de visita (resumen)

`Visit.status` (string libre, transicionado por backend/caseta):
1. **Pre-registrada / Autorizada** — creada por el residente, lista para acceso (QR válido).
2. **Acceso / Dentro** — guardia validó el QR (`visitWithQrCode`) y dio acceso (`enterDate`, `mainAccessEnterDate`).
3. **Salida / Finalizada** — registró `leaveDate` (`leaveVisitWithQrCode`).
4. **Cancelada** — `residentStatusVisit(status:"cancel")` o `residentDeleteVisit`.
5. **Reportada** — `residentReportVisit` (`residentReport=true`, motivo en `reportDetails`).
- Modificadores: `private` (visita privada), `quick` (rápida), `accessKind` (Auto/Caminando), `fails` (intentos QR fallidos).

---

## Conteo (app de residente)

**Pantallas: 22**
1. Login · 2. Recuperar contraseña · 3. Inicio/Dashboard · 4. Visitas (listado) · 5. Nueva visita (wizard) ·
6. Detalle de visita · 7. Pase/QR de visita · 8. Visitantes frecuentes (listado) · 9. Alta/edición visitante ·
10. Empleados domésticos (listado) · 11. Alta/edición empleado · 12. Familiares/departamento · 13. Eventos (listado) ·
14. Alta de evento · 15. Avisos · 16. Notificaciones · 17. Pánico · 18. Perfil (menú) · 19. Cambiar contraseña ·
20. Sugerencias/quejas · 21. Reservaciones (listado) · 22. Alta de reservación.
*(Aviso de privacidad y Chat de soporte son vistas auxiliares/backlog, no contadas como pantallas funcionales.)*

**Operaciones GraphQL del residente: 41**

Queries (21): `myProfile`, `myResidential`, `residentRestingHouse`, `residents`, `residentsVisits`,
`residentPrivateVisits`, `residentCanceledVisits`, `residentShowVisit`, `residentVisitors`, `residentVisitor`,
`residentVisitorsByPlate`, `residentEmployees`, `residentEvents`, `residentEventVisits`, `residentVisitorsByEvent`,
`residentEventUnexpectedVisitors`, `residentNotices`, `residentPanicAlerts`, `notifications`, `myTickets`,
`reservationsForResident`, `spacesForResident` *(22 si se cuenta `spacesForResident` aparte — ver lista)*.

Mutations (20): `login`, `logout`, `recoveryPassword`, `updateMyPassword`/`residentPassword`,
`residentCreateVisitorVisit`, `residentCreateServiceVisit`, `residentCreateEmployeeVisit`, `residentDeleteVisit`,
`residentStatusVisit`, `residentReportVisit`, `residentCreateEmployee`, `residentUpdateEmployee`,
`residentDeleteEmployee`, `residentUpdateEmployeeQr`, `residentUpdateEmployeeFolio`, `residentImageEmployee`,
`residentCreateResident`, `residentUpdateResident`, `residentDeleteResident`, `residentUpdateVisitor`,
`residentUpdateVisitorQrCode`, `residentUpdateVisitorCode`, `residentAssignPlate`, `residentAssignVehicle`,
`updateVisitorCredential`, `createPanicAlert`, `createEvent`, `createTicket`, `createTicketResponse`,
`createReservation`, `notificationUpdate`, `createInstanceLog`, `createInstanceLogDevice`.

> Conteo conservador: **22 pantallas** y **~41 operaciones GraphQL distintas** (22 queries + ~33 mutations
> listadas arriba; el total exacto depende de cuáles toggles de tenant estén activos). Las mutations
> `createNotice` y `asignEventVisitor` existen en el esquema pero son de administración / catálogo.
