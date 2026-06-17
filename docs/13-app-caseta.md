# 13 — Spec exhaustivo: App de Caseta / Guardia (`com.kgvisit.guard`)

Especificación **pantalla por pantalla y botón por botón** de la app de caseta, para clonarla tal
cual en **Expo (React Native)** consumiendo el mismo backend (GraphQL V1 hoy; Supabase en V2).

- **Fuentes:** `docs/09-apps-moviles.md` (flujos capturados en vivo en MuMuPlayer),
  `docs/06-api-graphql.md` (catálogo de operaciones), esquema GraphQL introspectado
  (`/tmp/kgvisit_schema.json`).
- **Endpoint V1:** `POST https://administracion.visitapp.io/api/v1` (Absinthe/Phoenix).
- **Header de tenant:** las operaciones `*Public`, `securityBooths` y `login` usan `channel`/`tenant`
  (el residencial seleccionado). Tras login se envía el `token`/`authToken` en `Authorization`.
- **Convención de tipos:** `!` = no-nulo. IDs son `ID` (string). Las operaciones marcadas como
  Query no mutan estado; las Mutation sí.

> Nota sobre nombres de campos: el backend trae faltas ortográficas heredadas (`insident`,
> `asign`, `frecuently`, `recuperate`). Se documentan **tal cual existen en el esquema** porque la
> app las consume literalmente. En V2 se pueden renombrar en una capa de mapeo, pero los nombres GraphQL
> V1 son los de abajo.

---

## Índice de pantallas

| # | Pantalla | Operaciones GraphQL principales |
|---|----------|--------------------------------|
| 1 | Login (usuario / contraseña / residencial) | `login` |
| 2 | Selección de caseta | `securityBooths` |
| 3 | Pantalla principal (listado de visitas + barra superior + filtros) | `visitsToday`, `securityBoothVisits` |
| 4 | Acciones por fila de visita | `statusVisit`, `leaveVisitWithQrCode`, `imageVisit`, `createInsident`, `blacklistInsident`, `createPanicAlert` (paquetería vía notificación) |
| 5 | Detalle de visita | `statusVisit`, `imageVisit`, `camerasBySecurityBooth` |
| 6 | "+ Nueva visita" — paso 1: tipo de ingreso | (router local; lee `myResidential`) |
| 7 | Nueva visita — paso 2: domicilio | `housesPublic` |
| 8 | Nueva visita — paso 3: tipo de visita (Servicio/Conocido-Familia/Empleado) | `servicesPublic`, `employeesPublic`, `transportsPublic` |
| 9 | Nueva visita — paso 4: verificar placas (LPR) | `lpr` |
| 10 | Nueva visita — paso 5: REPUVE (reporte de robo) | `repuve`, `blacklistPlate` |
| 11 | Nueva visita — paso 6: tomar foto del visitante | `createVisitorUnexpected`, `imageVisit` |
| 12 | Nueva visita — paso 7: dar acceso (crear visita) | `createServiceVisit`, `createVisitorVisit`, `createEmployeeVisit` |
| 13 | QR Auto / QR Caminando (escaneo) | `visitWithQrCode`, `visitorWithQrCode`, `visitorWithSecretCode`, `employeeVisitByFolio`, `leaveVisitWithQrCode` |
| 14 | Pánico | `createPanicAlert`, `panicAlerts`, `seePanicAlert` |
| 15 | Chat con colonos | (canal Phoenix/realtime; flags `accessChat` / `userWithUserChat`) |
| 16 | Menú / Perfil / Cambiar caseta / Cerrar sesión | `myProfile`, `securityBooths`, `logout` |

**Total: 16 pantallas.**

---

## Flags de residencial que condicionan la UI (`myResidential -> Residential`)

La app pide `myResidential` al iniciar y guarda estos flags; activan/ocultan botones y pasos:

| Flag | Efecto en la app de caseta |
|------|----------------------------|
| `guardCreateVisits` | habilita el botón **"+ Nueva visita"** (guardia crea visitas). |
| `guardInVisits` | guardia puede registrar ingreso/acceso directo. |
| `guardShippingNotification` | habilita **Notificar paquetería** por fila. |
| `lpr` | habilita el paso **Verificar placas (LPR)**. |
| `repuve` | habilita el paso **REPUVE**. |
| `qr` / `qrVisitors` / `qrEmployees` / `qrAirbnb` | habilitan **QR Auto** y validación por folio. |
| `walkingQr` | habilita **QR Caminando** (peatonal). |
| `secretCode` | habilita validación por **código secreto** (`visitorWithSecretCode`). |
| `qrNumeric` | el QR/folio es numérico. |
| `cameraQrReader` | usa cámara del dispositivo como lector de QR. |
| `manualVisitPhotos` / `visitorFacial` / `employeeTabletPhoto` | habilitan el paso **tomar foto**. |
| `visitAutoCard` / `autoCardNumber` | asigna número de tarjeta/tag automático a la visita. |
| `accessChat` + `userWithUserChat` | habilitan **chat con colonos**. |
| `company` + `companyInput*` (`companyInputCampus`, `companyInputColor`, `companyInputCompany`, `companyInputDriver`, `companyInputHost`, `companyInputPlates`, `companyInputSubject`, `companyInputVehicle`, `companyInputDetails`) | activan el modo "empresa/multidomicilio" y qué campos del complemento se piden. |
| `staffVisitTypesList` / `timelineVisitTypesList` / `timelineVehicleTypeList` | catálogos de tipos de visita y vehículo. |
| `frequentlyByPlate` / `residentAccessByPlate` | habilitan reconocimiento de visitante frecuente por placa. |
| `cluster` / `clusterId` | residencial con clusters (la visita lleva `cluster`). |
| `confirmationWaitTime` | tiempo de espera para autorización del colono. |
| `doubleCheck` (en `SecurityBooth`) | la caseta requiere doble verificación (intermedia). |

---

## 1. Login

Campos del formulario:

| Campo UI | GraphQL arg | Notas |
|----------|-------------|-------|
| **Usuario** | `username: String!` | |
| **Contraseña** | `password: String!` | input seguro |
| **Residencial** | `channel: String!` | el "channel"/tenant del residencial. Picker o subdominio. |
| (oculto) ID de dispositivo | `idDevice: String!` | identificador del equipo (Expo Device / push token) |

Acción **Iniciar sesión**:
```graphql
mutation {
  login(username:"...", password:"...", channel:"<residencial>", idDevice:"<device>") {
    token authToken rol super construction representative name channel
  }
}
```
- `Login{ token, authToken, rol, super, construction, representative, name, channel }`.
- Guardar `token`/`authToken` (auth header), `channel` (tenant para `*Public`/`securityBooths`),
  `rol` (debe ser guardia), `super` (permisos extendidos).
- Tras login exitoso → cargar `myResidential` (flags) y navegar a **Selección de caseta**.
- Errores: usuario/contraseña inválidos; respeta `loginFails`/`loginTimeout` del residencial.

---

## 2. Selección de caseta

Tras login el guardia elige en qué caseta opera. Tipos vistos en vivo:
**Principal / Virtual / Salida principal / Virtual peatonal / Normal**.

Listado de casetas del tenant:
```graphql
query { securityBooths(tenant:"<channel>") {
  id name main channel color status printer doubleCheck
} }
```
- `SecurityBooth{ id, name, main, channel, color, status, printer, doubleCheck }`.
- `main:true` → es la **Principal** (acceso principal). `doubleCheck:true` → caseta con doble
  verificación (registra `intermediate`/`intermediateEnterDate` en la visita).
- El "tipo" (Principal/Virtual/Salida/Virtual peatonal/Normal) se deriva de `name` + `main` + naming
  convention del residencial; la app sólo muestra el `name` y guarda el `id` elegido como
  `securityBooth` para todas las operaciones siguientes.
- Acción **Seleccionar** → guarda `securityBoothId` en sesión y entra a la pantalla principal.
- Disponible también desde el menú (**Cambiar caseta**).

---

## 3. Pantalla principal (listado de visitas)

**Barra superior (de izquierda a derecha):** logo · **Buscar** · filtros (**Tipo Visita · Status ·
Caseta**) · **QR Auto** · **QR Caminando** · **historial** · **menú** (Perfil / Cambiar caseta /
Cerrar sesión).

**Listado** de visitas del día (columnas vistas: **Visita · Tipo · Fecha/Hora**):
```graphql
query { visitsToday(kind:"<tipo>", status:"<status>", search:"<texto>", page:1) {
  total
  visits {
    id folio kind status accessKind arriveDate dueDate enterDate leaveDate
    quick guardReport residentReport private autoCardNumber notes reason
    house { id address cluster phone }
    visitor { id name phone company avatar curp }
    employee { id name folio }
    service { id name }
    transport { id name plates }
    plate { id number state brand model color blacklist graylist report }
    securityBooth { id name }
    tag { id tagNumber }
    photos { id url }
    complement { companyName host subject vehiclePlates vehicleColor visitKind driver campus }
  }
} }
```

Para ver el histórico/listado por caseta específica (paginado):
```graphql
query { securityBoothVisits(id:"<securityBoothId>", page:1) { total visits { id ... } } }
```

| Control | Acción | GraphQL |
|---------|--------|---------|
| **Buscar** | filtra por nombre/folio/placa | arg `search` de `visitsToday` |
| Filtro **Tipo Visita** | valores: visitante/servicio/empleado/casual… (de `timelineVisitTypesList`/`staffVisitTypesList`) | arg `kind` |
| Filtro **Status** | p.ej. `authorized`/`pending`/`denied`/`inside`/`out` | arg `status` |
| Filtro **Caseta** | filtra por caseta | usa `securityBoothVisits(id)` o filtro local |
| **QR Auto** | abre escáner (pantalla 13, vehicular) | — |
| **QR Caminando** | abre escáner (pantalla 13, peatonal) — sólo si `walkingQr` | — |
| **Historial** | abre listado histórico (`adminSecurityBoothVisits` / `securityBoothVisits` con rango) | — |
| **Menú** | abre menú (pantalla 16) | — |
| **"+" (FAB)** | abre **Nueva visita** (pantalla 6) — sólo si `guardCreateVisits` | — |

> Mapeo de status (string `Visit.status`): valores observados en V1 — `authorized`, `pending`,
> `denied`, `inside`/`enter`, `out`/`leave`, `canceled`. El filtro de Status y la mutación
> `statusVisit` usan estos mismos strings.

---

## 4. Acciones por fila de visita

Cada fila del listado ofrece acciones (las visibles dependen de flags y del estado de la visita):

| Acción de fila | Qué hace | GraphQL |
|----------------|----------|---------|
| **Caseta / estatus** | cambia el estatus de la visita (autorizar / negar / marcar dentro) en la caseta actual | `statusVisit(id, securityBooth, status)` |
| **Dar acceso** | autoriza/permite el ingreso (estatus a "dentro") | `statusVisit(id:<visitId>, securityBooth:<boothId>, status:"<inside\|authorized>")` |
| **Salida** | registra la salida de la visita | `statusVisit(... status:"out")` o por folio `leaveVisitWithQrCode(folio, securityBooth)` |
| **Notificar paquetería** | notifica al colono que llegó paquetería (sólo si `guardShippingNotification`) | notificación push al residente del `house` (no es una mutation GraphQL dedicada en V1; usa el canal de notificaciones del tenant) |
| **Reportar visita** | crea un incidente sobre la visita | `createInsident(insident:{ visitId, reason })` |
| **Lista negra (desde reporte)** | manda el incidente/placa a lista negra | `blacklistInsident(insident:<id>)` y/o `blacklistPlate(id:<plateId>)` |
| **Creada por guardia** | etiqueta de origen (badge, `Visit.guardReport`) | sólo lectura |
| **Caminando** | indica visita peatonal (`accessKind`/sin transporte con placas) | sólo lectura |

`statusVisit`:
```graphql
mutation { statusVisit(id:"<visitId>", securityBooth:"<boothId>", status:"<status>") {
  id status enterDate leaveDate intermediateStatus
} }
```

`createInsident` (Reportar visita):
```graphql
mutation { createInsident(insident:{ visitId:"<visitId>", reason:"<texto>" }) {
  id reason blacklist insertedAt visit { id }
} }
```
- `InsidentParams{ reason: String!, visitId: ID! }`.

`blacklistInsident` / `blacklistPlate`:
```graphql
mutation { blacklistInsident(insident:"<insidentId>") { id blacklist } }
mutation { blacklistPlate(id:"<plateId>") { id blacklist graylist report } }
```

> **Notificar paquetería**: en V1 la caseta dispara una notificación al residente dueño del `house`
> (no expuesta como mutation independiente en el catálogo). En V2 se implementa como
> `expo-notifications` push + un registro en backend. Sólo se muestra si
> `Residential.guardShippingNotification = true`.

---

## 5. Detalle de visita

Al tocar una fila se abre el detalle con todos los campos de `Visit` (ver pantalla 3):
folio, visitante, domicilio, placas (`plate1..plate4` + `plate`), transporte, servicio/empleado,
fotos (`photos[].url`), complemento (empresa/host/asunto), tiempos (`arriveDate`, `enterDate`,
`leaveDate`, `dueDate`, `validity`, `permanence`), banderas (`private`, `guardReport`,
`residentReport`, `quick`, `airbnb`, `amenity`), tag/tarjeta, e incidentes (`insidents`).

Acciones del detalle: **Dar acceso**, **Salida**, **Reportar**, **Tomar/ver foto**, **Ver cámaras**.

- Cámaras de la caseta: `camerasBySecurityBooth(securityBooth:<id>) -> [Camera{ id name url cameraType automatic status }]`
  (o `camerasPublic` para las públicas del tenant).
- Tomar/adjuntar foto: `imageVisit(id, kind, type)` (ver pantalla 11).

---

## 6. "+ Nueva visita" — paso 1: tipo de ingreso

Visible sólo si `Residential.guardCreateVisits = true`. Opciones (según config del tenant):

- **Visita Vehicular** → flujo con placas (pasos 7→9→10→11→12).
- **Visita Peatonal** → flujo sin placas (salta LPR/REPUVE).
- **Multidomicilio** → varios domicilios destino (modo `company`, usa `companyInput*`).
- **Ingreso de colono** → registra entrada de residente.
- Sub-tipo **Visita Casual** (`Visit.quick = true`): registro rápido sin pre-registro.

Es navegación local; al elegir, se guarda `kind` y si lleva placas. El catálogo de tipos sale de
`staffVisitTypesList` / `timelineVisitTypesList` (CSV en `Residential`).

---

## 7. Nueva visita — paso 2: domicilio destino

Buscar y elegir el domicilio (`houseId`) al que va la visita:
```graphql
query { housesPublic(page:1, search:"<texto>") {
  total houses { id address cluster phone status defaulter visitorLimit blockQrVisitor } }
}
```
- En **Multidomicilio** se pueden seleccionar varios `house`.
- Validaciones de UI: `defaulter`/`defaulterAuthorizeVisit` (moroso), `visitorLimit`,
  `blockQrVisitor`/`blockQrEmployee`/`blockQrCasual`, `status`.

---

## 8. Nueva visita — paso 3: tipo de visita

Selector **Servicio / Conocido-Familia / Empleado** y datos del visitante.

| Sub-tipo | Catálogo | GraphQL |
|----------|----------|---------|
| **Servicio** | lista de servicios | `servicesPublic(search) -> [Service{ id name status hasDetails }]` |
| **Conocido / Familia** | visitante libre (nombre, CURP, empresa) | se crea con `createVisitorUnexpected` (paso 11) |
| **Empleado** (doméstico) | empleados del domicilio | `employeesPublic -> [Employee{ id name folio house status }]` |

Transporte (si vehicular):
```graphql
query { transportsPublic { id name plates status } }
```
- `Transport.plates:true` → el transporte exige captura de placas (continúa a LPR).

Campos comunes capturados aquí (mapean a los `*Params` del paso 12):
`subject` (asunto), `details` (si `Service.hasDetails`), `notes`, `dueDate` (vigencia),
`private`, `quick`, y los del complemento empresa si aplica (`companyName`, `host`, `driver`,
`vehicleColor`, `campus`, etc.).

---

## 9. Nueva visita — paso 4: verificar placas (LPR)

Sólo flujo vehicular y si `Residential.lpr = true`. Consulta de lectura automática de placas (OCR/cámara) para la caseta:
```graphql
query { lpr(accessKind:"<entrada>", securityBooth:<boothIdInt>) {
  plate1 plate2 plate3 plate4 visit
} }
```
- `Lpr{ plate1, plate2, plate3, plate4, visit }` — devuelve **sugerencias automáticas** de placas
  detectadas por la cámara LPR de la caseta.
- `accessKind`: tipo de acceso (entrada/salida); `securityBooth` es **Int** aquí (no ID).
- UI: muestra las sugerencias `plate1..4`; el guardia puede **aceptar una** o **capturar manualmente**.
- La placa elegida se usa en el paso REPUVE y se persiste en la visita (`plate1..plate4`/`plateId`).

---

## 10. Nueva visita — paso 5: REPUVE (reporte de robo)

Sólo si `Residential.repuve = true`. Verifica la placa contra el padrón REPUVE / reporte de robo:
```graphql
query { repuve(plate:"<NUMERO>", visit:<visitIdInt>) {
  id number state brand model color year classType
  blacklist graylist report recuperate resident kind
} }
```
- `Plate{ number, state, brand, model, color, year, blacklist, graylist, report, recuperate, ... }`.
- `report:true` → **placa con reporte de robo** → alerta roja; el guardia puede negar el acceso o
  enviar a lista negra (`blacklistPlate(id)`).
- `blacklist`/`graylist` → la placa ya está en lista negra/gris del residencial.
- Botón **Siguiente** continúa a tomar foto.

---

## 11. Nueva visita — paso 6: tomar foto del visitante

Captura de foto (si `manualVisitPhotos` / `visitorFacial` / `employeeTabletPhoto`).

1. Para **Conocido/Familia** sin registro previo, crear el visitante:
```graphql
mutation { createVisitorUnexpected(visitor:{ name:"...", curp:"...", username:"...", avatar:"<url|base64>", unexpected:true }) {
  id name curp avatar
} }
```
- `VisitorParams{ name: String!, curp, username, avatar, unexpected }`.

2. Adjuntar la foto a la visita/visitante (subida de imagen):
```graphql
mutation { imageVisit(id:"<id>", kind:"<visit|visitor|employee>", type:"<photo|face>") {
  status message
} }
```
- `imageVisit(id: ID!, kind: String!, type: String!) -> Request{ status, message }`.
- `kind` indica a qué entidad se asocia; `type` el tipo de imagen (foto normal / facial).
- Las fotos resultantes aparecen luego en `Visit.photos[].url`.

---

## 12. Nueva visita — paso 7: dar acceso (crear la visita)

Crea la visita y otorga el acceso. Una de tres mutaciones según el sub-tipo del paso 3.
`id` = `houseId` (domicilio destino). Todas devuelven `Visit`.

**Servicio:**
```graphql
mutation { createServiceVisit(id:"<houseId>", visit:{
  serviceId:"<id>", subject:"<asunto>", kind:"<tipo>", dueDate:"<ISO>",
  houseId:"<id>", quick:false, transportId:"<id>", plateId:"<id>",
  details:"<si hasDetails>", notes:"...", private:false, securityBoothId:"<boothId>"
}) { id folio status } }
```
`VisitServiceParams{ serviceId!, subject!, kind!, dueDate!, houseId!, quick!, transportId, plateId, details, notes, private, securityBoothId }`

**Conocido / Familia (visitante):**
```graphql
mutation { createVisitorVisit(id:"<houseId>", visit:{
  visitorId:"<id>", subject:"<asunto>", kind:"<tipo>", dueDate:"<ISO>",
  houseId:"<id>", quick:false, transportId:"<id>", plateId:"<id>",
  notes:"...", private:false, securityBoothId:"<boothId>"
}) { id folio status } }
```
`VisitVisitorParams{ visitorId!, subject!, kind!, dueDate!, houseId!, quick!, transportId, plateId, details, notes, private, securityBoothId }`

**Empleado:**
```graphql
mutation { createEmployeeVisit(id:"<houseId>", visit:{
  employeeId:"<id>", subject:"<asunto>", kind:"<tipo>", dueDate:"<ISO>",
  houseId:"<id>", quick:false, transportId:"<id>", plateId:"<id>",
  notes:"...", private:false, securityBoothId:"<boothId>"
}) { id folio status } }
```
`VisitEmployeeParams{ employeeId!, subject!, kind!, dueDate!, houseId!, quick!, transportId, plateId, details, notes, private, securityBoothId }`

- `quick:true` para **Visita Casual** (registro rápido).
- Tras crear, si el flujo es "dar acceso directo" (guardia con `guardInVisits`), encadenar
  `statusVisit(id, securityBooth, status:"inside")` para marcar el ingreso.
- Si el residencial exige autorización del colono, la visita queda `pending` esperando
  `confirmationWaitTime`.

---

## 13. QR Auto / QR Caminando (escaneo y validación)

Lector de QR (cámara — `expo-camera`; o lector externo si `cameraQrReader`). **QR Auto** = vehicular;
**QR Caminando** = peatonal (sólo si `walkingQr`).

| Tipo de código | Operación | Devuelve |
|----------------|-----------|----------|
| Folio de visita pre-registrada | `visitWithQrCode(folio:"<folio>", visit:<ID>)` | `Visit` completa |
| Código de visitante frecuente | `visitorWithQrCode(code:"<code>", visit:<ID>)` | `VisitorHouse` |
| Código secreto (si `secretCode`) | `visitorWithSecretCode(code:"<code>", visit:<ID>)` | `VisitorHouse` |
| Folio de empleado doméstico | `employeeVisitByFolio(folio:"<folio>", securityBooth:<ID>)` | `Employee` |
| Salida por folio | `leaveVisitWithQrCode(folio:"<folio>", securityBooth:<ID>)` | `Visit` (con `leaveDate`) |

`visitWithQrCode`:
```graphql
query { visitWithQrCode(folio:"<folio>", visit:"<visitId|0>") {
  id folio status visitor { id name avatar } house { id address }
  plate { number report blacklist } photos { url } dueDate
} }
```

`visitorWithQrCode` → `VisitorHouse{ id, qrCode, status, frecuently, frecuentlyCode, unexpected,
faceId, facialVerificationStatus, house, visitor }`.

`leaveVisitWithQrCode` (salida): marca `leaveDate` y devuelve la visita actualizada.

Flujo: escanear → validar (`status`, placa sin `report`/`blacklist`, vigencia `dueDate`) →
mostrar datos + foto → botón **Dar acceso** (`statusVisit` status `inside`) o **Salida**
(`leaveVisitWithQrCode`). En `doubleCheck` la caseta intermedia registra
`intermediateEnterDate`/`intermediateStatus`.

---

## 14. Pánico

La caseta **recibe** alertas de pánico de residentes y puede crearlas.

- **Recibir / listar** alertas:
```graphql
query { panicAlerts(dateStart:"<ISO>", dateEnd:"<ISO>", search:"", page:1) {
  total alerts { id kind lat lng saw status guard insertedAt house { id address } user { id name phone } }
} }
```
- **Marcar como vista / atendida:**
```graphql
mutation { seePanicAlert(id:"<id>") { id saw status } }
mutation { updatePanicAlert(id:"<id>", panicAlert:{ status:true }) { id status } }
```
- **Crear alerta** (botón de pánico del guardia, geolocalizado):
```graphql
mutation { createPanicAlert(panicAlert:{ lat:<float>, lng:<float> }) {
  id kind lat lng status insertedAt
} }
```
- `PanicAlertParams{ lat: Float, lng: Float }`. Las alertas entrantes muestran `lat`/`lng` en mapa,
  la casa (`house.address`) y el usuario que la disparó.

---

## 15. Chat con colonos

Habilitado por `Residential.accessChat` (chat de acceso/caseta) y `userWithUserChat`.

- En V1 **no existe** query/mutation GraphQL dedicada de chat; el esquema sólo expone los flags y los
  contadores en `User`: `lastChat` (último mensaje) y `notViewedChats` (no leídos). El transporte de
  mensajes corre por un **canal Phoenix/realtime** aparte del GraphQL.
- UI: lista de conversaciones con colonos (badge de `notViewedChats`), hilo de mensajes, enviar texto.
- **V2 (Supabase):** implementar con Realtime/Postgres (tabla `messages` + suscripción) o
  `supabase.channel`. La caseta chatea con el residente dueño del `house`.

---

## 16. Menú / Perfil / Cambiar caseta / Cerrar sesión

Menú superior derecho:

| Opción | Acción | GraphQL |
|--------|--------|---------|
| **Perfil** | ver datos del guardia | `myProfile -> User{ id name username email phone avatar rol house }` |
| **Cambiar caseta** | vuelve a la selección de caseta (pantalla 2) | `securityBooths(tenant)` |
| **Cerrar sesión** | logout y limpia tokens | `logout -> User` |

---

## Resumen de operaciones GraphQL de caseta

### Queries (15)
`login` no es query, va abajo. Queries usadas por la caseta:

1. `visitWithQrCode(folio, visit)` → `Visit`
2. `visitorWithQrCode(code, visit)` → `VisitorHouse`
3. `visitorWithSecretCode(code, visit)` → `VisitorHouse`
4. `leaveVisitWithQrCode(folio, securityBooth)` → `Visit`
5. `visitsToday(kind, status, search, page)` → `VisitWithPage`
6. `securityBoothVisits(id, page)` → `[VisitWithPage]`
7. `securityBooths(tenant)` → `[SecurityBooth]`
8. `housesPublic(page, search)` → `HouseWithPage`
9. `servicesPublic(search)` → `[Service]`
10. `employeesPublic()` → `[Employee]`
11. `transportsPublic()` → `[Transport]`
12. `camerasPublic()` / `camerasBySecurityBooth(securityBooth)` → `[Camera]`
13. `lpr(accessKind, securityBooth)` → `Lpr`
14. `repuve(plate, visit)` → `Plate`
15. `panicAlerts(dateStart, dateEnd, search, page)` → `PanicAlertWithPage`
16. `myResidential()` → `Residential` (config/flags) · `myProfile()` → `User`

### Mutations (11)
1. `login(username, password, channel, idDevice)` → `Login`
2. `logout()` → `User`
3. `statusVisit(id, securityBooth, status)` → `Visit`
4. `createServiceVisit(id, visit: VisitServiceParams)` → `Visit`
5. `createVisitorVisit(id, visit: VisitVisitorParams)` → `Visit`
6. `createEmployeeVisit(id, visit: VisitEmployeeParams)` → `Visit`
7. `createVisitorUnexpected(visitor: VisitorParams)` → `Visitor`
8. `employeeVisitByFolio(folio, securityBooth)` → `Employee`
9. `imageVisit(id, kind, type)` → `Request`
10. `createInsident(insident: InsidentParams)` → `Insident`
11. `blacklistInsident(insident)` / `blacklistPlate(id)` → `Insident` / `Plate`
12. `createPanicAlert(panicAlert: PanicAlertParams)` → `PanicAlert`
13. `seePanicAlert(id)` / `updatePanicAlert(id, panicAlert)` → `PanicAlert`

> Notas de implementación V2: "Notificar paquetería" y el "chat con colonos" no son operaciones
> GraphQL V1 — se resuelven con push (`expo-notifications`) y Realtime de Supabase respectivamente.
> `lpr`/`repuve` dependen de hardware/servicios externos (cámara LPR, padrón REPUVE) detrás del backend.
