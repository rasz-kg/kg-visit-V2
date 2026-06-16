# 05 — Modelo de datos (V1, derivado de GraphQL)

> Obtenido por **introspección de GraphQL** del backend de producción
> (`administracion.visitapp.io/api/v1`). Tipos escalares originales: la mayoría de fechas y
> números vienen como `String`; en V2 se tipan correctamente (timestamptz, int, numeric, bool).

## Entidades núcleo y relaciones

```
Residential (tenant) 1───* House 1───* VisitorHouse *───1 Visitor
     │                  │                              
     ├──* Rol           ├──* User (residentes/admin/guardia)   
     ├──* SecurityBooth │                                       
     ├──* Service       ├──* Employee 1───* EmployeeSchedule    
     ├──* Transport     ├──* HousePlate *───1 Plate            
     ├──* Space 1──* Reservation                                
     ├──* Camera                                                
     └──* Notice / PanicAlert / Insident / Ticket               

Visit  *───1 House, Visitor|Employee|Service|Provider, Plate, SecurityBooth, User(acceso)
Event  1───* EventVisitor,  *───1 House, Space
Plate  ───* HousePlate / EmployeePlate / VisitorPlate   (placas con blacklist/graylist)
```

## Diccionario de entidades (campos principales)

### Residential (configuración del tenant)
Más de 130 *feature flags* y parámetros. Grupos:
- **Acceso/QR**: `qr`, `qrVisitors`, `qrEmployees`, `qrNumeric`, `walkingQr`, `secretCode`,
  `visitorExpiration(+Time)`, `confirmationWaitTime`, `frequentlyByPlate`.
- **Facial / hardware**: `alocity`, `facialHikvision`, `facialZkteco`, `visitorFacial`,
  `employeeFacial`, `residentFacial`, `facialBlacklist`, `lpr`, `repuve`.
- **Reservaciones/amenidades**: `reservations`, `amenityGuests*`, `reservationFacialAuth`.
- **Empresa (modo corporativo)**: `company`, `companyInput*` (campos del formulario de visita),
  `companyAutoAutorize`, `companyStaffQr`.
- **Residentes/app**: `residentApp`, `residentVisits`, `residentUpdateVisitors`, `accessChat`.
- **Operación**: `loginFails`, `loginTimeout`, `timezoneHours`, `guardTimelineDays`, `logo`, `name`.

### House (domicilio / unidad)
`address, phone, publicPhone, cluster` · tipo: `land`/`construction`/`build`/`inhabited`/`rent` ·
`paid, paidStartDate, paidLimitTime, defaulter, defaulterAuthorizeVisit` (cobranza/morosidad) ·
límites: `residentLimit, visitorLimit, employeeLimit, frequentlyLimit` ·
`blockQrCasual/Employee/Visitor, print, validated, status, deleted`.

### User (admin / guardia / residente — distinguidos por `rol`)
`name, username, email, phone, avatar, qrCode` · `rol: Rol` · `house: House` ·
`representative, super, status, validated, emailActivation` · IDs de integración:
`hikvisionId, zkId, axisId, alocityUserId, faceId` · staff: `staffSchedule*`.

### Visitor / VisitorHouse
`Visitor`: `name, phone, company, curp, avatar, credential, notes, rol` (puede ser amenity).
`VisitorHouse` (relación visitante↔casa): `house, visitor, qrCode, frecuently, frecuentlyCode,
unexpected, faceId, facialVerificationStatus, status`.

### Visit (visita / acceso) — entidad central
`kind` (visitor/employee/service/resident), `status`, `accessKind` · fechas:
`arriveDate, enterDate, leaveDate, dueDate, lobby*, mainAccessEnterDate, intermediate*` ·
relaciones: `house, visitor, employee, service, provider, plate, transport, tag, event,
securityBooth, user, accessUser, leaveUser, mobileAuthorized` · `folio, subject, details,
reason, notes, photos[], plate1..4, quick, private, guardReport, inventory*, permanence, validity`.

### Employee / EmployeeSchedule
`Employee`: `name, credential, folio, avatar, house, days, timeStart, timeEnd, faceId, schedules[]`.
`EmployeeSchedule`: `day, timeStart, timeEnd`.

### Plate (placa vehicular) + relaciones
`number, state, brand, model, year, color, classType, kind` ·
listas: `blacklist, graylist, report, recuperate, resident`.
Asociaciones: `HousePlate`, `EmployeePlate`, `VisitorPlate`.

### Event (evento) + EventVisitor
`name, folio, dueDate, finishDate, open, qrUrl, cars, house, space, visitors[], visits[]`.

### Space + Reservation (amenidades)
`Space`: `name, price, deposit, pay, guestsLimit, reservationLimit, reservationFutureLimit,
qrAccess, facialAccess, accessLevel*`.
`Reservation`: `space, user, startDate, endDate, startHour, endHour, day/month/year, status,
price, paid, paymentVoucher, denyReason, qrCode, authorizationUser`.

### SecurityBooth (caseta) · Camera · Lpr
`SecurityBooth`: `name, channel, color, main, doubleCheck, printer, status`.
`Camera`: `name, kind, cameraType, url, reference, automatic, supportToken, securityBooth`.
`Lpr`: `plate1..4, visit` (resultado de lectura de placas).

### Notice (aviso) · PanicAlert · Insident (incidente)
`Notice`: `kind, description, file, house, user, status`.
`PanicAlert`: `kind, house, user, lat, lng, saw, status`.
`Insident`: `reason, blacklist, visit, user` (registro/lista negra de incidentes).

### Soporte: Ticket · TicketCategory · TicketResponse
`Ticket`: `subject, description, status, ticketCategory, user`. Respuestas en `TicketResponse`.

### Catálogos: Rol · Service · Transport · Tag · Provider · Notification
`Rol(name,status)` · `Service(name,hasDetails,status)` · `Transport(name,plates,status)` ·
`Tag(tagNumber,car,plates,kind,user,status)` (TAGs vehiculares) · `Provider(name,logo)` ·
`Notification(message,viewed)`.

### Multi-tenant / operación: Instance · InstanceLog · Login
`Instance(name,token,port,online,status)` · `InstanceLog(kind,message,status,activeTime...)` ·
`Login(token,authToken,rol,name,super,representative,construction,channel)` — respuesta de `login`.
