# 10 — Cobertura de datos (GraphQL V1 → Supabase V2)

> **Objetivo:** barrido exhaustivo de **todo lo almacenable** en el backend original
> (`administracion.visitapp.io/api/v1`) para lograr un **clon exacto**.
>
> **Fuente de verdad:** esquema GraphQL completo por introspección en `/tmp/kgvisit_schema.json`.
> **Esquema actual:** `supabase/migrations/0001_schema_inicial.sql` (+ `0004_normalize_roles.sql`).
> **Parsing:** todo lo de abajo se generó con `python3` sobre el JSON; no se omitió ningún tipo ni campo.

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Tipos en el esquema GraphQL | 112 (`OBJECT` 67, `INPUT_OBJECT` 38, `SCALAR` 5, `ENUM` 2) |
| Tipos `OBJECT` (sin `__`) | 61 (incluye 2 raíces `RootQueryType`/`RootMutationType`) |
| Tipos `OBJECT` de datos (sin raíces) | 59 |
| └ Entidades **almacenables** | **42** |
| └ Wrappers de paginación/agregados (no se guardan) | 14 (`*WithPage`, `HouseByKind`, `VisitKindWithPage`) |
| └ Respuestas-solo (no se guardan) | 3 (`Login`, `Request`, `StatusResponse`) |
| Campos totales en las 59 OBJECT de datos | 637 |
| Tablas en Supabase actual | 31 |
| Columnas en Supabase actual | 316 |
| **GAPS — entidades sin tabla** | **8** (≈ 60 campos) |
| **GAPS — columnas faltantes en tablas existentes** | **227** |

> Escalares originales: el backend V1 manda casi todo como `String` (incluidas fechas y números).
> En V2 se tipan correctamente: `timestamptz`, `int`, `numeric`, `boolean`. Los `insertedAt`/`updatedAt`
> de GraphQL mapean a `created_at`/`updated_at`.

---

## 1 + 2. Inventario de entidades y campos, con mapeo a Supabase

Leyenda de la columna **Mapeo**:
`tabla.columna` = mapeado · **GAP** = no existe en el esquema actual ·
`(enum X)` = representado por un enum/valor agregado · `(jsonb settings)` = hoy colapsado en `residentials.settings`.

### Residential → `residentials` (113 campos)

`Residential` es el tenant con ~113 *feature flags*. El esquema V2 promovió a columna sólo los flags
más usados; el resto vive hoy en `residentials.settings jsonb`. Para clon **exacto** se recomienda
promover los flags a columnas tipadas (ver GAP-RES más abajo). Mapeo campo a campo:

| Campo GraphQL | Tipo | Mapeo Supabase |
|---|---|---|
| id | ID | residentials.id |
| name | String | residentials.name |
| logo | String | residentials.logo |
| channel | String | residentials.channel |
| timezoneHours | Int | residentials.timezone_hours |
| loginFails | Int | residentials.login_fails |
| loginTimeout | Int | residentials.login_timeout |
| qr | Boolean | residentials.qr_enabled |
| reservations | Boolean | residentials.reservations |
| lpr | Boolean | residentials.lpr |
| repuve | Boolean | residentials.repuve |
| residentApp (ResidentApp) | ResidentApp | (sub-objeto → settings; ver GAP) |
| company | Boolean | residentials.company_mode |
| visitorExpirationTime | Int | residentials.visitor_expiration_time |
| confirmationWaitTime | Int | residentials.confirmation_wait_time |
| status | Boolean | residentials.status |
| configuration (ResidentialModules) | ResidentialModules | (sub-objeto → settings; ver GAP) |
| facial* / qr* / company* / amenity* / suggestion* / timeline* / guard* (96 flags) | Boolean/String/Int | **GAP** (hoy en `settings jsonb`) |

Flags faltantes como columna (96), agrupados:
- **Acceso/QR:** `qrVisitors qrEmployees qrNumeric qrHikvision qrZkteco qrAlocity qrAirbnb walkingQr secretCode cameraQrReader showQrFolioToResidents hideQrForConstruction frequentlyByPlate`
- **Facial/hardware:** `alocity facialHikvision facialZkteco facialAlocity facialBlacklist facialVisitLink facialVisitorLink visitorFacial employeeFacial residentFacial airbnbFacial reservationFacialAuth hikvisionId`
- **Amenidades:** `amenityGuests amenityGuestsHikvision amenityGuestsZkteco amenityGuestsAlocity amenityGuestsFacial amenityUploadPaymentReceipt`
- **Empresa/corp:** `companyAutoAutorize companyAutomaticAuthorization companyCampus companyInputCampus companyInputColor companyInputCompany companyInputDetails companyInputDriver companyInputHost companyInputPlates companyInputSubject companyInputVehicle companyPrivateStaffVisits companyRecurrentQrs companyShowAddressOnQr companyShowQrAddress companyShowVisitorOrQr companyStaffQr staffVisitTypesList`
- **Residentes/app:** `accessChat adminChat residentApp(bool) residentVisits residentUpdateVisitors residentAccessByPlate residentSuggestions residentialDocuments userWithUserChat parentalNotifications`
- **Eventos:** `openEvents closeEvents openEventQr closeEventQr`
- **Operación/UI:** `airbnb cluster clusterId community concierge surveys suggestions suggestionsCategories suggestionsComplaints suggestionsKinds suggestionsStatus wallets autoserviceTablet dashboardEmployees employeeTabletPhoto guardCreateVisits guardInVisits guardShippingNotification guardTimelineDays houseGraylist leaveVouchersProfile leaveVouchersVisit manualVisitPhotos preRegisterManualAuthorization visitAutoCard visitorExpiration timelineCustomVisitTypes timelineHideEmployee timelineHideFamily timelineHideService timelineVehicleTypeList timelineVisitTypesList`

### ResidentApp → (sub-objeto de Residential) (35 campos) — **GAP completo**
Controla qué ve la app del residente. Hoy no existe como columna ni tabla (cae en `settings`).
Campos: `addressOnQr customMessageQr hideAirbnb hideAmenity hideCloseEvent hideCommunity hideCompany hideEmployee hideEvent hideNewVisit hideNotLeaveVisits hideNotice hideNotification hideQuickVisit hideResident hideSurvey hideVisitList hideVisitor hideWalkingTransport residentFacialNotification visitDetailsHideAccessKind visitDetailsHideArriveDate visitDetailsHideCreatedBy visitDetailsHideCreatedUser visitDetailsHideDetails visitDetailsHideDueDate visitDetailsHideEnterDate visitDetailsHideFolio visitDetailsHideKind visitDetailsHideLeaveDate visitDetailsHideMainAccessEnterDate visitDetailsHideMainAccessLeaveDate visitDetailsHidePermanence visitDetailsHideReport visitDetailsHideSubject`.

### ResidentialModules → (sub-objeto de Residential) (8 campos) — **GAP completo**
`autoremoveFrequentVisitors autoremoveFrequentVisitorsTime corpVisitFields rentAutomaticInactivation rentAutomaticInactivationFacial residentAppQrLogo residentAppQrSize residentAppTimelineLimit`.

### House → `houses` (29 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | houses.id |
| address | String | houses.address |
| cluster | String | houses.cluster |
| phone | String | houses.phone |
| publicPhone | String | houses.public_phone |
| land/construction/build/inhabited/rent | Boolean | houses.kind *(enum `house_kind`)* |
| paid | Boolean | houses.paid |
| paidStartDate | String | houses.paid_start_date |
| paidLimitTime | String | houses.paid_limit_time |
| defaulter | Boolean | houses.defaulter |
| defaulterAuthorizeVisit | Boolean | houses.defaulter_authorize_visit |
| residentLimit | Int | houses.resident_limit |
| visitorLimit | Int | houses.visitor_limit |
| employeeLimit | Int | houses.employee_limit |
| frequentlyLimit | Int | houses.frequently_limit |
| blockQrCasual | Boolean | houses.block_qr_casual |
| blockQrEmployee | Boolean | houses.block_qr_employee |
| blockQrVisitor | Boolean | houses.block_qr_visitor |
| validated | Boolean | houses.validated |
| status | Boolean | houses.status |
| deleted | Boolean | houses.deleted |
| print | Boolean | **GAP** |
| residentFacialNotifFrom | String | **GAP** |
| residentFacialNotifTo | String | **GAP** |
| restingTime | Boolean | **GAP** |

### User → `users` (32 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | users.id |
| name | String | users.name |
| username | String | users.username |
| email | String | users.email |
| phone | String | users.phone |
| avatar | String | users.avatar |
| qrCode | String | users.qr_code |
| rol (Rol) | Rol | users.rol_id |
| house (House) | House | users.house_id |
| representative | Boolean | users.representative |
| super | Boolean | users.super |
| status | Boolean | users.status |
| validated | Boolean | users.validated |
| emailActivation | Boolean | users.email_activation |
| hikvisionId | ID | users.hikvision_id |
| alocityStatus | String | **GAP** |
| alocityUserId | String | **GAP** |
| axisId | String | **GAP** |
| zkId | ID | **GAP** |
| faceId | ID | **GAP** |
| facialVerificationStatus | String | **GAP** |
| facialVerificationError | String | **GAP** |
| depositReference | String | **GAP** |
| idDevice | String | **GAP** |
| lastChat | String | **GAP** |
| lastVersion | String | **GAP** |
| notViewedChats | Int | **GAP** |
| notificationSound | String | **GAP** |
| recovery | Boolean | **GAP** |
| staffScheduleDays | String | **GAP** |
| staffScheduleStartEnd | String | **GAP** |
| staffScheduleStartHour | String | **GAP** |

### Visitor → `visitors` (22 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | visitors.id |
| name | String | visitors.name |
| phone | String | visitors.phone |
| company | String | visitors.company |
| curp | String | visitors.curp |
| avatar | String | visitors.avatar |
| credential | String | visitors.credential |
| notes | String | visitors.notes |
| amenity | Boolean | visitors.amenity |
| faceId | String | visitors.face_id |
| rol (Rol) | Rol | visitors.rol_id |
| status | Boolean | visitors.status |
| deleted | Boolean | visitors.deleted |
| visitorHouses ([VisitorHouse]) | lista | → tabla `visitor_houses` |
| amenityName | String | **GAP** |
| alocityUserId | String | **GAP** |
| authToken | String | **GAP** |
| fixCredential | String | **GAP** |
| idDevice | String | **GAP** |
| loginDate | String | **GAP** |
| username | String | **GAP** |
| updatedAt | String | visitors.updated_at |

### VisitorHouse → `visitor_houses` (12 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | visitor_houses.id |
| house (House) | House | visitor_houses.house_id |
| visitor (Visitor) | Visitor | visitor_houses.visitor_id |
| qrCode | String | visitor_houses.qr_code |
| frecuently | Boolean | visitor_houses.frequently |
| frecuentlyCode | String | visitor_houses.frequently_code |
| unexpected | Boolean | visitor_houses.unexpected |
| faceId | String | visitor_houses.face_id |
| status | Boolean | visitor_houses.status |
| hikvisionId | String | **GAP** |
| facialVerificationStatus | String | **GAP** |
| facialVerificationError | String | **GAP** |

### Employee → `employees` (18 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | employees.id |
| name | String | employees.name |
| credential | String | employees.credential |
| folio | String | employees.folio |
| avatar | String | employees.avatar |
| reference | String | employees.reference |
| days | String | employees.days |
| timeStart | String | employees.time_start |
| timeEnd | String | employees.time_end |
| faceId | String | employees.face_id |
| house (House) | House | employees.house_id |
| schedules ([EmployeeSchedule]) | lista | → tabla `employee_schedules` |
| status | Boolean | employees.status |
| deleted | Boolean | employees.deleted |
| hikvisionId | String | **GAP** |
| facialAction | String | **GAP** |
| facialVerificationStatus | String | **GAP** |
| facialVerificationError | String | **GAP** |

### EmployeeSchedule → `employee_schedules` (4): `day`→day, `timeStart`→time_start, `timeEnd`→time_end, `id`→id. **Cobertura 100%.**

### Plate → `plates` (14 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | plates.id |
| number | String | plates.number |
| state | String | plates.state |
| brand | String | plates.brand |
| model | String | plates.model |
| year | String | plates.year |
| color | String | plates.color |
| classType | String | plates.class_type |
| kind | String | plates.kind |
| blacklist/graylist/report/recuperate | Boolean | plates.list *(enum `plate_list`)* |
| resident | Boolean | plates.resident |

**Cobertura 100%** (las 4 listas se modelan vía enum `plate_list`).

### HousePlate → `house_plates` (4): `house`→house_id, `plate`→plate_id, `graylist`→graylist, `id`→id. **100%.**
### EmployeePlate → `employee_plates` (3): `employee`→employee_id, `plate`→plate_id, `id`→id. **100%.**
### VisitorPlate → `visitor_plates` (3): `visitor`→visitor_id, `plate`→plate_id, `id`→id. **100%.**

### Tag → `tags` (7): `tagNumber`→tag_number, `car`→car, `plates`→plates, `kind`→kind, `user`→user_id, `status`→status, `id`→id. **100%.**

### Event → `events` (13)

| Campo | Tipo | Mapeo |
|---|---|---|
| id/name/folio | | events.id/name/folio |
| dueDate | String | events.due_date |
| finishDate | String | events.finish_date |
| open | Boolean | events.open |
| qrUrl | String | events.qr_url |
| cars | Int | events.cars |
| house (House) | House | events.house_id |
| space (Space) | Space | events.space_id |
| user (User) | User | events.user_id |
| visitors ([EventVisitor]) | lista | → tabla `event_visitors` |
| visits ([VisitSmall]) | lista | → `visits.event_id` |

**Cobertura 100%.**

### EventVisitor → `event_visitors` (4): `name`→name, `folio`→folio, `visitorId`→visitor_id, `id`→id. **100%.**

### Visit → `visits` (67 campos) — entidad central

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | visits.id |
| kind | String | visits.kind *(enum `visit_kind`)* |
| status | String | visits.status *(enum `visit_status`)* |
| accessKind | String | visits.access_kind |
| folio | String | visits.folio |
| subject | String | visits.subject |
| details | String | visits.details |
| reason | String | visits.reason |
| notes | String | visits.notes |
| house (House) | House | visits.house_id |
| visitor (Visitor) | Visitor | visits.visitor_id |
| employee (Employee) | Employee | visits.employee_id |
| service (Service) | Service | visits.service_id |
| provider (Provider) | Provider | visits.provider_id |
| transport (Transport) | Transport | visits.transport_id |
| plate (Plate) | Plate | visits.plate_id |
| tag (Tag) | Tag | visits.tag_id |
| event (Event) | Event | visits.event_id |
| securityBooth (SecurityBooth) | SecurityBooth | visits.security_booth_id |
| accessUser (User) | User | visits.access_user_id |
| leaveUser (User) | User | visits.leave_user_id |
| arriveDate | String | visits.arrive_date |
| enterDate | String | visits.enter_date |
| leaveDate | String | visits.leave_date |
| dueDate | String | visits.due_date |
| quick | Boolean | visits.quick |
| private | Boolean | visits.private |
| guardReport | Boolean | visits.guard_report |
| validity | Int | visits.validity |
| permanence | Int | visits.permanence |
| insertedAt | String | visits.created_at |
| photos ([Photo]) | lista | → tabla `visit_photos` |
| **user (User)** | User | **GAP** (creador; existe `created_by` pero sin columna `user_id` explícita — ver nota) |
| **mobileAuthorized (User)** | User | **GAP** |
| **complement (VisitComplement)** | VisitComplement | **GAP** (sub-objeto, ver entidad nueva) |
| **insidents (Insident)** | Insident | (relación inversa vía `incidents.visit_id`) |
| amenity | Boolean | **GAP** |
| amenityName | String | **GAP** |
| airbnb | Boolean | **GAP** |
| cluster | String | **GAP** |
| deleted | Boolean | **GAP** |
| fails | Int | **GAP** |
| autoCardNumber | String | **GAP** |
| quickAuthorized | String | **GAP** |
| adminCamerasControl | Boolean | **GAP** |
| renderImagesOnServer | Boolean | **GAP** |
| residentReport | Boolean | **GAP** |
| reportDetails | String | **GAP** |
| inventoryChecked | Boolean | **GAP** |
| inventoryReport | String | **GAP** |
| plate1 / plate2 / plate3 / plate4 | String | **GAP** (lecturas LPR sueltas) |
| mainAccessEnterDate | String | **GAP** |
| lobbyEnterDate / lobbyLeaveDate | String | **GAP** |
| intermediate (SecurityBooth) | SecurityBooth | **GAP** → intermediate_id |
| intermediate2 (SecurityBooth) | SecurityBooth | **GAP** → intermediate2_id |
| intermediateEnterDate / intermediateLeaveDate | String | **GAP** |
| intermediateEnterDate2 / intermediateLeaveDate2 | String | **GAP** |
| intermediateStatus / intermediateStatus2 | String | **GAP** |
| megaSecurityChannel / megaSecurityName | String | **GAP** |

> Nota sobre `created_by`: la columna `visits.created_by` cubre el concepto del campo `user`
> de V1 (quién creó/autorizó). Se mantiene; el GAP es nominal.

### VisitSmall → `visits` (27 campos): proyección reducida de `Visit` usada en listados/eventos.
Mismos GAPs que `Visit` para: `amenity amenityName autoCardNumber fails mainAccessEnterDate plate1`.
No es una entidad propia; **no requiere tabla nueva**.

### VisitComplement → (sub-objeto de Visit) (12 campos) — **GAP completo**
Campos del formulario corporativo: `campus companyName details driver fields host subject vehicleColor vehicleKind vehiclePlates visitKind` (+ `id`).

### Photo → `visit_photos` (2): `url`→url, `id`→id. **100%.**

### Reservation → `reservations` (23 campos)

| Campo | Tipo | Mapeo |
|---|---|---|
| id | ID | reservations.id |
| space (Space) | Space | reservations.space_id |
| user (User) | User | reservations.user_id |
| authorizationUser (User) | User | reservations.authorization_user_id |
| startDate | String | reservations.start_date |
| endDate | String | reservations.end_date |
| startHour | Int | reservations.start_hour |
| endHour | Int | reservations.end_hour |
| status | String | reservations.status *(enum `reservation_status`)* |
| reason | String | reservations.reason |
| denyReason | String | reservations.deny_reason |
| price | Int | reservations.price |
| paid | Boolean | reservations.paid |
| paymentVoucher | String | reservations.payment_voucher |
| qrCode | String | reservations.qr_code |
| insertedAt | String | reservations.created_at |
| day / month / year | Int | **GAP** |
| reservationSchedulesId | Int | **GAP** (FK a tabla de horarios de espacios — `ReservationSchedules`, no introspectada como OBJECT) |
| hikvisionId | String | **GAP** |
| zktecoId | String | **GAP** |
| alocityId | String | **GAP** |

### Notice → `notices` (8): `kind`→kind, `description`→description, `file`→file, `house`→house_id, `user`→user_id, `status`→status, `insertedAt`→created_at, `id`→id. **100%.**

### PanicAlert → `panic_alerts` (10)
`kind house user lat lng saw status id insertedAt` → todos mapeados; **`guard` (String) → GAP.**

### Insident → `incidents` (6): `reason`→reason, `blacklist`→blacklist, `visit`→visit_id, `user`→user_id, `insertedAt`→created_at, `id`→id. **100%.**

### Ticket → `tickets` (7): `subject description status ticketCategory(→ticket_category_id) user(→user_id) insertedAt(→created_at) id`. **100%.**
### TicketCategory → `ticket_categories` (3): `name status id`. **100%.**
### TicketResponse → `ticket_responses` (4): `message user(→user_id) insertedAt(→created_at) id`. **100%.**
### Notification → `notifications` (4): `message viewed insertedAt(→created_at) id`. **100%.**
### Rol → `rols` (3): `name status id`. **100%.**
### Service → `services` (4): `name hasDetails(→has_details) status id`. **100%.**
### Transport → `transports` (4): `name plates status id`. **100%.**
### Provider → `providers` (3): `name logo id`. **100%.**

### SecurityBooth → `security_booths` (8): `name channel color main doubleCheck(→double_check) printer status id`. **100%.**

### Camera → `cameras` (10)
`name kind cameraType(→camera_type) url reference automatic status securityBooth(→security_booth_id) id` → mapeados;
**`supportToken` (String) → GAP.**

### Space → `spaces` (17)

| Campo | Tipo | Mapeo |
|---|---|---|
| id/name | | spaces.id/name |
| price | Int | spaces.price |
| deposit | Int | spaces.deposit |
| pay | Boolean | spaces.pay |
| guestsLimit | Int | spaces.guests_limit |
| reservationLimit | Int | spaces.reservation_limit |
| reservationFutureLimit | Int | spaces.reservation_future_limit |
| qrAccess | Boolean | spaces.qr_access |
| facialAccess | Boolean | spaces.facial_access |
| status | Boolean | spaces.status |
| accessLevelHikvision | Boolean | **GAP** |
| accessLevelZkteco | Boolean | **GAP** |
| accessLevelAlocity | Boolean | **GAP** |
| backlistResidents | Boolean | **GAP** |
| backlistBlockTime | Int | **GAP** |
| uploadPaymentReceipt | Boolean | **GAP** |

### Entidades sin tabla en Supabase (GAP completo)

| Entidad GraphQL | Campos | Propósito |
|---|---|---|
| **Lpr** (5) | plate1..4, visit | Resultado de lectura de placas (cámara LPR) |
| **Instance** (8) | id, name, token, port, online, status, notification, insertedAt | Instancia local (servidor on-premise por residencial) |
| **InstanceLog** (11) | kind, message, status, activeTime, activeTimeDays, inactiveTime, inactiveTimeDays, instance, insertedAt, updatedAt, id | Bitácora de conectividad de la instancia |
| **Solution** (6) | body, description, estimatedTime, like, dislikes, id | Artículo de ayuda/solución (centro de soporte) |
| **Video** (11) | name, description, body, video, coverPage, rol, views, likes, dislikes, status, deleted | Tutoriales en video |
| **VideoComment** (5) | body, user, video, insertedAt, id | Comentarios sobre tutoriales |
| **VisitorEvent** (4) | name, folio, visitor, id | Visitante asociado a un evento (variante de EventVisitor) |
| **VisitComplement** (12) | campus, companyName, details, driver, fields, host, subject, vehicleColor, vehicleKind, vehiclePlates, visitKind, id | Datos extra del formulario corporativo de visita |

> Tipos de GraphQL **no almacenables** (no requieren tabla): `Login`, `Request`, `StatusResponse`
> (respuestas de operaciones) y los 14 wrappers `*WithPage` / `HouseByKind` / `VisitKindWithPage` (paginación/agregados).
> Además se referencia un `ReservationSchedules` vía `reservationSchedulesId` que no aparece como OBJECT
> en la introspección pero es necesario para reservas con franjas horarias (ver DDL propuesto).

---

## 3 + 4. GAPS y DDL propuesto (para cobertura 100%)

> Convenciones: UUID PK (`gen_random_uuid()`), multi-tenant por `residential_id`,
> RLS habilitado, tipos correctos (`timestamptz`/`numeric`/`boolean`/`int`),
> `created_at`/`updated_at` con trigger `set_updated_at()`.

### 3.1 Tablas nuevas

```sql
-- ============================================================================
-- 0010 — Cobertura de datos: tablas faltantes del backend V1
-- ============================================================================

-- VisitComplement (datos del formulario corporativo, 1:1 con visit) ----------
create table visit_complements (
  id              uuid primary key default gen_random_uuid(),
  residential_id  uuid not null references residentials(id) on delete cascade,
  visit_id        uuid not null references visits(id) on delete cascade,
  visit_kind      text,
  subject         text,
  details         text,
  host            text,
  driver          text,
  campus          text,
  company_name    text,
  vehicle_kind    text,
  vehicle_color   text,
  vehicle_plates  text,
  fields          jsonb not null default '{}'::jsonb,  -- "fields" libre del formulario corp
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (visit_id)
);
create index on visit_complements(residential_id);

-- Lpr (lecturas de cámara de placas) -----------------------------------------
create table lpr_reads (
  id              uuid primary key default gen_random_uuid(),
  residential_id  uuid not null references residentials(id) on delete cascade,
  camera_id       uuid references cameras(id) on delete set null,
  visit_id        uuid references visits(id) on delete set null,
  plate1          text,
  plate2          text,
  plate3          text,
  plate4          text,
  created_at      timestamptz not null default now()
);
create index on lpr_reads(residential_id);

-- Instance (servidor on-premise por residencial) -----------------------------
create table instances (
  id              uuid primary key default gen_random_uuid(),
  residential_id  uuid not null references residentials(id) on delete cascade,
  name            text not null,
  token           text,
  port            text,
  online          text,
  notification    boolean not null default false,
  status          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on instances(residential_id);

-- InstanceLog (bitácora de conectividad) -------------------------------------
create table instance_logs (
  id                  uuid primary key default gen_random_uuid(),
  residential_id      uuid not null references residentials(id) on delete cascade,
  instance_id         uuid not null references instances(id) on delete cascade,
  kind                text,
  message             text,
  status              text,
  active_time         int,
  active_time_days    text,
  inactive_time       int,
  inactive_time_days  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on instance_logs(residential_id);
create index on instance_logs(instance_id);

-- Solution (centro de ayuda) -------------------------------------------------
create table solutions (
  id              uuid primary key default gen_random_uuid(),
  residential_id  uuid references residentials(id) on delete cascade,  -- null = global
  description     text,
  body            text,
  estimated_time  text,
  likes           int not null default 0,
  dislikes        int not null default 0,
  status          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on solutions(residential_id);

-- Video (tutoriales) ---------------------------------------------------------
create table videos (
  id              uuid primary key default gen_random_uuid(),
  residential_id  uuid references residentials(id) on delete cascade,  -- null = global
  name            text not null,
  description     text,
  body            text,
  video           text,        -- URL del video
  cover_page      text,        -- URL portada
  rol             text,        -- rol destinatario
  views           int not null default 0,
  likes           int not null default 0,
  dislikes        int not null default 0,
  status          boolean not null default true,
  deleted         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on videos(residential_id);

-- VideoComment ---------------------------------------------------------------
create table video_comments (
  id              uuid primary key default gen_random_uuid(),
  video_id        uuid not null references videos(id) on delete cascade,
  user_id         uuid references users(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index on video_comments(video_id);

-- ReservationSchedules (franjas horarias por espacio; referido por reservation) --
create table reservation_schedules (
  id              uuid primary key default gen_random_uuid(),
  residential_id  uuid not null references residentials(id) on delete cascade,
  space_id        uuid not null references spaces(id) on delete cascade,
  day             text,        -- p.ej. "L,M,X" o día concreto
  start_hour      int,
  end_hour        int,
  status          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index on reservation_schedules(residential_id);
create index on reservation_schedules(space_id);

-- NOTA: VisitorEvent es equivalente a event_visitors (ya existe). Si se desea
-- distinguir el flujo "visitante de evento" con su propia FK a visitor,
-- event_visitors ya cubre (visitor_id, name, folio). No se crea tabla nueva.
```

### 3.2 Columnas nuevas en tablas existentes (`ALTER TABLE`)

```sql
-- houses ---------------------------------------------------------------------
alter table houses
  add column if not exists print boolean not null default false,
  add column if not exists resident_facial_notif_from text,
  add column if not exists resident_facial_notif_to   text,
  add column if not exists resting_time boolean not null default false;

-- users ----------------------------------------------------------------------
alter table users
  add column if not exists zk_id text,
  add column if not exists axis_id text,
  add column if not exists alocity_user_id text,
  add column if not exists alocity_status text,
  add column if not exists face_id text,
  add column if not exists facial_verification_status text,
  add column if not exists facial_verification_error text,
  add column if not exists deposit_reference text,
  add column if not exists id_device text,
  add column if not exists last_chat text,
  add column if not exists last_version text,
  add column if not exists not_viewed_chats int not null default 0,
  add column if not exists notification_sound text,
  add column if not exists recovery boolean not null default false,
  add column if not exists staff_schedule_days text,
  add column if not exists staff_schedule_start_end text,
  add column if not exists staff_schedule_start_hour text;

-- visitors -------------------------------------------------------------------
alter table visitors
  add column if not exists amenity_name text,
  add column if not exists alocity_user_id text,
  add column if not exists auth_token text,
  add column if not exists fix_credential text,
  add column if not exists id_device text,
  add column if not exists login_date timestamptz,
  add column if not exists username citext;

-- visitor_houses -------------------------------------------------------------
alter table visitor_houses
  add column if not exists hikvision_id text,
  add column if not exists facial_verification_status text,
  add column if not exists facial_verification_error text;

-- employees ------------------------------------------------------------------
alter table employees
  add column if not exists hikvision_id text,
  add column if not exists facial_action text,
  add column if not exists facial_verification_status text,
  add column if not exists facial_verification_error text;

-- visits ---------------------------------------------------------------------
alter table visits
  add column if not exists user_id uuid references users(id) on delete set null,        -- "user" (creador app)
  add column if not exists mobile_authorized uuid references users(id) on delete set null,
  add column if not exists amenity boolean not null default false,
  add column if not exists amenity_name text,
  add column if not exists airbnb boolean not null default false,
  add column if not exists cluster text,
  add column if not exists deleted boolean not null default false,
  add column if not exists fails int not null default 0,
  add column if not exists auto_card_number text,
  add column if not exists quick_authorized text,
  add column if not exists admin_cameras_control boolean not null default false,
  add column if not exists render_images_on_server boolean not null default false,
  add column if not exists resident_report boolean not null default false,
  add column if not exists report_details text,
  add column if not exists inventory_checked boolean not null default false,
  add column if not exists inventory_report text,
  add column if not exists plate1 text,
  add column if not exists plate2 text,
  add column if not exists plate3 text,
  add column if not exists plate4 text,
  add column if not exists main_access_enter_date timestamptz,
  add column if not exists lobby_enter_date timestamptz,
  add column if not exists lobby_leave_date timestamptz,
  add column if not exists intermediate_id  uuid references security_booths(id) on delete set null,
  add column if not exists intermediate2_id uuid references security_booths(id) on delete set null,
  add column if not exists intermediate_enter_date  timestamptz,
  add column if not exists intermediate_leave_date  timestamptz,
  add column if not exists intermediate_enter_date2 timestamptz,
  add column if not exists intermediate_leave_date2 timestamptz,
  add column if not exists intermediate_status  text,
  add column if not exists intermediate_status2 text,
  add column if not exists mega_security_channel text,
  add column if not exists mega_security_name text;

-- reservations ---------------------------------------------------------------
alter table reservations
  add column if not exists reservation_schedule_id uuid references reservation_schedules(id) on delete set null,
  add column if not exists day   int,
  add column if not exists month int,
  add column if not exists year  int,
  add column if not exists hikvision_id text,
  add column if not exists zkteco_id text,
  add column if not exists alocity_id text;

-- panic_alerts ---------------------------------------------------------------
alter table panic_alerts
  add column if not exists guard text;

-- cameras --------------------------------------------------------------------
alter table cameras
  add column if not exists support_token text;

-- spaces ---------------------------------------------------------------------
alter table spaces
  add column if not exists access_level_hikvision boolean not null default false,
  add column if not exists access_level_zkteco    boolean not null default false,
  add column if not exists access_level_alocity   boolean not null default false,
  add column if not exists backlist_residents     boolean not null default false,
  add column if not exists backlist_block_time     int,
  add column if not exists upload_payment_receipt boolean not null default false;
```

### 3.3 Feature flags del tenant (`Residential` + `ResidentApp` + `ResidentialModules`) — 139 flags

Hoy colapsados en `residentials.settings jsonb`. Para clon **exacto** y consultas tipadas se recomienda
promoverlos a columnas. Opciones:

- **Opción A (recomendada, mínimo riesgo):** mantener `settings jsonb` como contrato canónico
  y documentar las 139 claves (96 de `Residential` + 35 de `ResidentApp` + 8 de `ResidentialModules`).
  La cobertura es 100% a nivel de almacenamiento (jsonb), aunque no tipada.
- **Opción B (cobertura tipada):** promover a columnas `boolean/text/int`. DDL representativo:

```sql
-- residentials: promover flags de Residential a columnas tipadas ------------
alter table residentials
  -- Acceso/QR
  add column if not exists qr_visitors boolean not null default true,
  add column if not exists qr_employees boolean not null default true,
  add column if not exists qr_numeric boolean not null default false,
  add column if not exists qr_hikvision boolean not null default false,
  add column if not exists qr_zkteco boolean not null default false,
  add column if not exists qr_alocity boolean not null default false,
  add column if not exists qr_airbnb boolean not null default false,
  add column if not exists walking_qr boolean not null default false,
  add column if not exists secret_code boolean not null default false,
  add column if not exists camera_qr_reader boolean not null default false,
  add column if not exists show_qr_folio_to_residents boolean not null default false,
  add column if not exists hide_qr_for_construction boolean not null default false,
  add column if not exists frequently_by_plate boolean not null default false,
  -- Facial / hardware
  add column if not exists alocity boolean not null default false,
  add column if not exists facial_hikvision boolean not null default false,
  add column if not exists facial_zkteco boolean not null default false,
  add column if not exists facial_alocity boolean not null default false,
  add column if not exists facial_blacklist boolean not null default false,
  add column if not exists facial_visit_link boolean not null default false,
  add column if not exists facial_visitor_link boolean not null default false,
  add column if not exists visitor_facial boolean not null default false,
  add column if not exists employee_facial boolean not null default false,
  add column if not exists resident_facial boolean not null default false,
  add column if not exists airbnb_facial boolean not null default false,
  add column if not exists reservation_facial_auth boolean not null default false,
  add column if not exists hikvision_id text,
  -- Amenidades
  add column if not exists amenity_guests boolean not null default false,
  add column if not exists amenity_guests_hikvision boolean not null default false,
  add column if not exists amenity_guests_zkteco boolean not null default false,
  add column if not exists amenity_guests_alocity boolean not null default false,
  add column if not exists amenity_guests_facial boolean not null default false,
  add column if not exists amenity_upload_payment_receipt boolean not null default false,
  -- Empresa / corporativo
  add column if not exists company_auto_autorize boolean not null default false,
  add column if not exists company_automatic_authorization text,
  add column if not exists company_campus text,
  add column if not exists company_input_campus boolean not null default false,
  add column if not exists company_input_color boolean not null default false,
  add column if not exists company_input_company boolean not null default false,
  add column if not exists company_input_details boolean not null default false,
  add column if not exists company_input_driver boolean not null default false,
  add column if not exists company_input_host boolean not null default false,
  add column if not exists company_input_plates boolean not null default false,
  add column if not exists company_input_subject boolean not null default false,
  add column if not exists company_input_vehicle boolean not null default false,
  add column if not exists company_private_staff_visits boolean not null default false,
  add column if not exists company_recurrent_qrs boolean not null default false,
  add column if not exists company_show_address_on_qr boolean not null default false,
  add column if not exists company_show_qr_address text,
  add column if not exists company_show_visitor_or_qr boolean not null default false,
  add column if not exists company_staff_qr boolean not null default false,
  add column if not exists staff_visit_types_list text,
  -- Residentes / app / chat
  add column if not exists access_chat boolean not null default false,
  add column if not exists admin_chat boolean not null default false,
  add column if not exists resident_visits boolean not null default false,
  add column if not exists resident_update_visitors boolean not null default false,
  add column if not exists resident_access_by_plate boolean not null default false,
  add column if not exists resident_suggestions boolean not null default false,
  add column if not exists residential_documents boolean not null default false,
  add column if not exists user_with_user_chat boolean not null default false,
  add column if not exists parental_notifications boolean not null default false,
  -- Eventos
  add column if not exists open_events boolean not null default false,
  add column if not exists close_events boolean not null default false,
  add column if not exists open_event_qr boolean not null default false,
  add column if not exists close_event_qr boolean not null default false,
  -- Operación / UI
  add column if not exists airbnb boolean not null default false,
  add column if not exists cluster boolean not null default false,
  add column if not exists cluster_id int,
  add column if not exists community boolean not null default false,
  add column if not exists concierge boolean not null default false,
  add column if not exists surveys boolean not null default false,
  add column if not exists suggestions boolean not null default false,
  add column if not exists suggestions_categories text,
  add column if not exists suggestions_complaints text,
  add column if not exists suggestions_kinds text,
  add column if not exists suggestions_status text,
  add column if not exists wallets boolean not null default false,
  add column if not exists autoservice_tablet boolean not null default false,
  add column if not exists dashboard_employees boolean not null default false,
  add column if not exists employee_tablet_photo boolean not null default false,
  add column if not exists guard_create_visits boolean not null default false,
  add column if not exists guard_in_visits boolean not null default false,
  add column if not exists guard_shipping_notification boolean not null default false,
  add column if not exists guard_timeline_days int,
  add column if not exists house_graylist boolean not null default false,
  add column if not exists leave_vouchers_profile boolean not null default false,
  add column if not exists leave_vouchers_visit boolean not null default false,
  add column if not exists manual_visit_photos boolean not null default false,
  add column if not exists pre_register_manual_authorization boolean not null default false,
  add column if not exists visit_auto_card boolean not null default false,
  add column if not exists visitor_expiration boolean not null default false,
  add column if not exists timeline_custom_visit_types boolean not null default false,
  add column if not exists timeline_hide_employee boolean not null default false,
  add column if not exists timeline_hide_family boolean not null default false,
  add column if not exists timeline_hide_service boolean not null default false,
  add column if not exists timeline_vehicle_type_list text,
  add column if not exists timeline_visit_types_list text;

-- ResidentialModules (8) -> columnas en residentials -------------------------
alter table residentials
  add column if not exists autoremove_frequent_visitors boolean not null default false,
  add column if not exists autoremove_frequent_visitors_time int,
  add column if not exists corp_visit_fields text,
  add column if not exists rent_automatic_inactivation boolean not null default false,
  add column if not exists rent_automatic_inactivation_facial boolean not null default false,
  add column if not exists resident_app_qr_logo text,
  add column if not exists resident_app_qr_size text,
  add column if not exists resident_app_timeline_limit int;

-- ResidentApp (35) -> tabla 1:1 con residentials (config de la app del residente)
create table resident_app_settings (
  id                          uuid primary key default gen_random_uuid(),
  residential_id              uuid not null references residentials(id) on delete cascade,
  address_on_qr               boolean not null default false,
  custom_message_qr           text,
  resident_facial_notification boolean not null default false,
  hide_airbnb                 boolean not null default false,
  hide_amenity                boolean not null default false,
  hide_close_event            boolean not null default false,
  hide_community              boolean not null default false,
  hide_company                boolean not null default false,
  hide_employee               boolean not null default false,
  hide_event                  boolean not null default false,
  hide_new_visit              boolean not null default false,
  hide_not_leave_visits       boolean not null default false,
  hide_notice                 boolean not null default false,
  hide_notification           boolean not null default false,
  hide_quick_visit            boolean not null default false,
  hide_resident               boolean not null default false,
  hide_survey                 boolean not null default false,
  hide_visit_list             boolean not null default false,
  hide_visitor                boolean not null default false,
  hide_walking_transport      boolean not null default false,
  visit_details_hide_access_kind            boolean not null default false,
  visit_details_hide_arrive_date            boolean not null default false,
  visit_details_hide_created_by             boolean not null default false,
  visit_details_hide_created_user           boolean not null default false,
  visit_details_hide_details                boolean not null default false,
  visit_details_hide_due_date               boolean not null default false,
  visit_details_hide_enter_date             boolean not null default false,
  visit_details_hide_folio                  boolean not null default false,
  visit_details_hide_kind                   boolean not null default false,
  visit_details_hide_leave_date             boolean not null default false,
  visit_details_hide_main_access_enter_date boolean not null default false,
  visit_details_hide_main_access_leave_date boolean not null default false,
  visit_details_hide_permanence             boolean not null default false,
  visit_details_hide_report                 boolean not null default false,
  visit_details_hide_subject                boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (residential_id)
);
```

### 3.4 RLS y triggers para las tablas nuevas

```sql
-- updated_at en las tablas nuevas con esa columna
do $$
declare t text;
begin
  foreach t in array array[
    'visit_complements','instances','instance_logs','solutions','videos',
    'reservation_schedules','resident_app_settings'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- RLS habilitado (secure by default) en todas las tablas nuevas
do $$
declare t text;
begin
  foreach t in array array[
    'visit_complements','lpr_reads','instances','instance_logs','solutions',
    'videos','video_comments','reservation_schedules','resident_app_settings'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;
```

---

## Notas de cierre

- **`VisitSmall`** y **`VisitKindWithPage`** son proyecciones/agregados de `Visit`; **no** requieren tabla.
- **`VisitorEvent`** es funcionalmente equivalente a `event_visitors` (ya existe); no se crea tabla nueva.
- **`ReservationSchedules`** no aparece como `OBJECT` en la introspección (sólo se referencia por
  `reservationSchedulesId`), pero es necesaria para reservas con franjas horarias; se propone tabla.
- La diferencia `Int` (price/deposit en GraphQL) vs `numeric(10,2)` (Supabase) es **mejora intencional** de tipo, no un gap.
- Tras aplicar todo lo anterior, la cobertura de almacenamiento alcanza el **100%** de las 42 entidades almacenables del backend V1.
