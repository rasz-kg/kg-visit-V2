# 06 — Catálogo de API GraphQL (V1)

Endpoint: `POST https://administracion.visitapp.io/api/v1` (Absinthe/Phoenix).
`RootQueryType` (~90 queries) · `RootMutationType` (~110 mutations).

> ⚠️ La **introspección está habilitada en producción** (ver `03-auditoria-seguridad.md`, V-08).
> Este catálogo se obtuvo de ahí. En V2 la introspección debe deshabilitarse en producción.

## Autenticación
- `login(username, password, channel, idDevice) -> Login{ token, authToken, rol, super, ... }`
- `logout()`, `recoveryPassword(email, channel, hash)`, `updateMyPassword`, `residentPassword`,
  `passwordUserForAdmin(id, password)`.

## Admin — gestión
- **Usuarios**: `usersForAdmin`, `usersByRolForAdmin`, `usersByHouseForAdmin`,
  `createAdminForAdmin`, `createGuardForAdmin`, `createResidentForAdmin`,
  `updateResidentForAdmin`, `updateUserForAdmin`, `deleteUserForAdmin`.
- **Domicilios**: `housesForAdmin(page,search)`, `houseForAdmin(id)`, `totalHousesByKind`,
  `housesPlateForAdmin`, `createHouseForAdmin`, `updateHouseForAdmin`, `deleteHouseForAdmin`.
- **Empleados**: `employeesForAdmin`, `employeesHouseForAdmin`, `createEmployee`,
  `updateEmployee`, `deleteEmployee`, `imageVisit`/`updateImageEmployee`.
- **Placas**: `platesForAdmin`, `platesByHouseForAdmin`, `platesByVisitorForAdmin`,
  `createPlate`, `updatePlate`, `blacklistPlate`, `asignHousePlate`, `asignEmployeePlate`,
  `asignVisitorPlate`, `repuve(plate, visit)`.
- **Visitantes**: `visitorsForAdmin`, `visitorForAdmin`, `visitorsByName(+Plate)`,
  `visitorsHouseForAdmin`, `createVisitor`, `updateVisitor`, `asignVisitorHouse`,
  `updateVisitorCredential`.
- **Visitas/Accesos**: `adminVisits`, `adminVisitorVisits`, `adminHouseVisits`,
  `adminGuardVisits`, `adminUserVisits`, `adminSecurityBoothVisits`, `visitsToday`, `visit(id)`,
  `createVisitorVisit`, `createServiceVisit`, `createEmployeeVisit`, `statusVisit`.
- **Eventos**: `eventsForAdmin`, `eventsTodayForAdmin`, `eventForAdmin`, `createEvent`,
  `updateEvent`, `asignEventVisitor`.
- **Reservaciones/Espacios**: `reservationsForAdmin`, `spacesForAdmin`, `createSpace`,
  `updateSpace`, `statusSpace`, `deleteSpace`, `createReservation`, `statusReservation`.
- **Casetas/Cámaras**: `securityBoothsForAdmin`, `securityBoothForAdmin`, `createSecurityBooth`,
  `updateSecurityBooth`, `camerasBySecurityBooth`, `createCamera`, `updateCamera`,
  `updateAutomaticCamera`, `lpr(accessKind, securityBooth)`.
- **Avisos/Pánico/Incidentes**: `notices`, `createNotice`, `updateNotice`; `panicAlerts`,
  `seePanicAlert`; `listInsidents`, `createInsident`, `blacklistInsident`.
- **Soporte (tickets)**: `ticketsForAdmin`, `ticketCategoriesForAdmin`, `createTicket`,
  `createTicketResponse`, `statusTicket`, `createTicketCategory`.
- **Catálogos**: `servicesForAdmin`, `transportsForAdmin`, `tagsForAdmin`, `rolsPublic`,
  `createServiceForAdmin`, `createTransportForAdmin`, `createTag`, `createRol`.
- **Configuración del tenant**: `myResidential`, `updateResidentialConfirmationTime`,
  `updateResidentialAccessChat`, `updateResidentialFrequentlyByPlate`, `updateQrStatus`,
  `updateSecretCodeStatus`.

## Residente (app móvil)
- `myProfile`, `residentRestingHouse`, `residentVisitors`, `residentVisitor(id)`,
  `residentPrivateVisits`, `residentShowVisit`, `residentCanceledVisits`.
- `residentCreateVisitorVisit`, `residentCreateServiceVisit`, `residentCreateEmployeeVisit`,
  `residentDeleteVisit`, `residentStatusVisit`, `residentReportVisit`.
- `residentCreateEmployee`/`Update`/`Delete`, `residentUpdateEmployeeQr`.
- `residentCreateResident`/`Update`/`Delete` (familiares), `residentAssignPlate`,
  `residentAssignVehicle`, `residentUpdateVisitorQrCode`/`Code`/`Credential`.
- `residentEvents`, `residentEventVisits`, `residentVisitorsByEvent`, `residentNotices`,
  `residentPanicAlerts`, `reservationsForResident`, `spacesForResident`, `myTickets`.

## Caseta / Guardia (app de caseta)
- `visitWithQrCode(folio, visit)`, `visitorWithQrCode(code, visit)`,
  `visitorWithSecretCode(code, visit)`, `leaveVisitWithQrCode(folio, securityBooth)`,
  `employeeVisitByFolio(folio, securityBooth)`.
- `statusVisit(id, securityBooth, status)`, `createVisitorUnexpected`, `imageVisit`,
  `securityBoothVisits`, `visitsToday`, `camerasPublic`, `housesPublic`, `employeesPublic`,
  `servicesPublic`, `transportsPublic`.

## Capacitación (videos)
- `getVideoLarning`, `videoCommentsByVideo`, `createVideo`, `voteSolutionLike/Dislike`,
  `solutionsByProblem`.

## Notificaciones / Instancias
- `notifications(tennant, user)`, `notificationUpdate`; `instances`, `instanceLogs`,
  `createInstanceLog`, `createInstanceLogDevice`.
