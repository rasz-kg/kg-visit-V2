# 14 — Personalización por administrador (tenant)

> Cada **administrador = tenant = `residentials`** debe poder configurar qué ven y qué piden
> sus apps (admin web, app residente, app caseta/guardia): más/menos campos, más/menos fotos,
> qué datos del visitante se solicitan, qué módulos se activan.
>
> En V1 esto vive en el tipo GraphQL **`Residential`** (113 campos, de los cuales **104 son
> opciones configurables** una vez quitados `id/name/logo/status/channel/clusterId/hikvisionId`
> y las referencias anidadas `configuration`/`residentApp`) más dos objetos anidados:
> **`ResidentialModules`** (8 opciones) y **`ResidentApp`** (35 opciones).
>
> **Total catalogado: 147 opciones configurables** (104 + 8 + 35).
>
> Fuente: introspección GraphQL (`/tmp/kgvisit_schema.json`), `docs/05-modelo-datos.md` y
> `supabase/migrations/0001_schema_inicial.sql` (tabla `residentials` con `settings jsonb`).

---

## 1. Catálogo completo de opciones configurables

Convención de **default sugerido** para V2: "off" salvo módulos base esperados (QR, app
residente). Tipo: `bool` = Boolean, `int` = Int, `str` = String (en V1 muchos `str` son CSV o JSON
que enumeran catálogos — p.ej. `timelineVisitTypesList`).

### 1.1 Acceso / QR

| Flag (V1) | Tipo | Default | Qué controla en las apps |
|-----------|------|---------|--------------------------|
| `qr` | bool | true | Habilita el módulo de QR (maestro). |
| `qrVisitors` | bool | true | Permite generar QR para visitantes. |
| `qrEmployees` | bool | false | Permite generar QR para empleados/personal. |
| `qrNumeric` | bool | false | QR numérico (código corto tecleable) en vez de gráfico. |
| `qrAirbnb` | bool | false | QR para huéspedes Airbnb. |
| `qrHikvision` | bool | false | Genera credencial/QR contra Hikvision. |
| `qrZkteco` | bool | false | Genera credencial/QR contra ZKTeco. |
| `qrAlocity` | bool | false | Genera credencial/QR contra Alocity. |
| `walkingQr` | bool | false | QR para acceso peatonal ("caminando"). |
| `secretCode` | bool | false | Código secreto adicional para validar el acceso. |
| `frequentlyByPlate` | bool | false | Identifica visitantes frecuentes por placa. |
| `visitorExpiration` | bool | false | Activa expiración automática de QR/visita de visitante. |
| `visitorExpirationTime` | int | 24 (h) | Horas hasta que expira el QR/visita. |
| `confirmationWaitTime` | int | 0 (min) | Minutos de espera para confirmar el acceso. |
| `hideQrForConstruction` | bool | false | Oculta el QR en casas de tipo construcción. |
| `cameraQrReader` | bool | false | Usa cámara como lector de QR en caseta. |
| `visitAutoCard` | bool | false | Genera tarjeta/credencial de visita automáticamente. |

### 1.2 Facial / Hardware

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `lpr` | bool | false | Lectura automática de placas (LPR). |
| `repuve` | bool | false | Validación de placas contra REPUVE. |
| `alocity` | bool | false | Integración con controladora Alocity (maestro). |
| `facialHikvision` | bool | false | Reconocimiento facial vía Hikvision. |
| `facialZkteco` | bool | false | Reconocimiento facial vía ZKTeco. |
| `facialAlocity` | bool | false | Reconocimiento facial vía Alocity. |
| `facialBlacklist` | bool | false | Lista negra facial (bloquea rostros vetados). |
| `visitorFacial` | bool | false | Captura/valida rostro de visitantes. |
| `employeeFacial` | bool | false | Captura/valida rostro de empleados. |
| `residentFacial` | bool | false | Captura/valida rostro de residentes. |
| `facialVisitLink` | bool | false | Liga rostro a una visita concreta. |
| `facialVisitorLink` | bool | false | Liga rostro al visitante (perfil). |
| `houseGraylist` | bool | false | Lista gris por casa (placas/visitantes en observación). |
| `hikvisionId` | str | null | ID/credencial de la cuenta Hikvision del tenant (parámetro, no flag). |

### 1.3 Fotos

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `manualVisitPhotos` | bool | true | Permite al guardia tomar fotos manuales de la visita. |
| `employeeTabletPhoto` | bool | false | Exige/permite foto del empleado desde la tablet de caseta. |
| `autoserviceTablet` | bool | false | Modo autoservicio en tablet (el visitante se registra y se foto­grafía). |
| `leaveVouchersVisit` | bool | false | Adjuntar comprobantes/fotos al **dar salida** a la visita. |
| `leaveVouchersProfile` | bool | false | Adjuntar comprobantes/fotos al perfil al salir. |

> Nota: la **cantidad** de fotos no es un flag dedicado en V1; se infiere de los flags anteriores
> (manual + tablet + autoservicio). En V2 se modela explícitamente con `photos_min`/`photos_max`
> (ver §2) para soportar "más/menos fotos" por tenant.

### 1.4 Campos del formulario de visita (modo Empresa / `companyInput*`)

Estos son los **campos dinámicos del formulario de alta de visita**. Cada `companyInput*`
muestra/oculta un campo del formulario.

| Flag (V1) | Tipo | Default | Campo del formulario que controla |
|-----------|------|---------|-----------------------------------|
| `companyInputCompany` | bool | true | Empresa / razón social del visitante. |
| `companyInputDriver` | bool | false | Nombre del conductor. |
| `companyInputSubject` | bool | true | Asunto / motivo de la visita. |
| `companyInputHost` | bool | true | Anfitrión (host) a quien visita. |
| `companyInputPlates` | bool | false | Placas del vehículo. |
| `companyInputVehicle` | bool | false | Tipo / descripción del vehículo. |
| `companyInputDetails` | bool | false | Detalles libres. |
| `companyInputCampus` | bool | false | Campus / sede destino. |
| `companyInputColor` | bool | false | Color del vehículo. |

### 1.5 Empresa / Corporativo

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `company` | bool | false | Activa el **modo corporativo/empresa** (maestro). |
| `companyAutoAutorize` | bool | false | Autoriza visitas automáticamente. |
| `companyAutomaticAuthorization` | str | null | Regla/horario de autorización automática (config en cadena). |
| `companyStaffQr` | bool | false | QR para el staff de la empresa. |
| `companyPrivateStaffVisits` | bool | false | Marca como privadas las visitas del staff. |
| `companyRecurrentQrs` | bool | false | QR recurrentes (reutilizables). |
| `companyShowAddressOnQr` | bool | false | Muestra la dirección en el QR. |
| `companyShowQrAddress` | str | null | Texto/formato de la dirección mostrada en el QR. |
| `companyShowVisitorOrQr` | bool | false | Elige mostrar datos del visitante o el QR. |
| `companyCampus` | str | null | Catálogo de campus/sedes de la empresa. |
| `staffVisitTypesList` | str | null | Lista (CSV/JSON) de tipos de visita de staff permitidos. |
| `preRegisterManualAuthorization` | bool | false | Pre-registro requiere autorización manual. |
| `concierge` | bool | false | Modo conserje. |
| `community` | bool | false | Módulo comunidad. |
| `cluster` | bool | false | Agrupación por clúster. |
| `clusterId` | int | null | ID del clúster asociado (parámetro). |
| `residentialDocuments` | bool | false | Repositorio de documentos del residencial. |
| `wallets` | bool | false | Monederos / wallets. |
| `airbnb` | bool | false | Módulo Airbnb. |
| `airbnbFacial` | bool | false | Facial para huéspedes Airbnb. |

### 1.6 Reservaciones / Amenidades

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `reservations` | bool | false | Activa el módulo de reservaciones de amenidades. |
| `reservationFacialAuth` | bool | false | Autenticación facial para acceder a la amenidad reservada. |
| `amenityGuests` | bool | false | Permite invitados a amenidades. |
| `amenityGuestsFacial` | bool | false | Facial para invitados de amenidad. |
| `amenityGuestsHikvision` | bool | false | Credencial Hikvision para invitados de amenidad. |
| `amenityGuestsZkteco` | bool | false | Credencial ZKTeco para invitados de amenidad. |
| `amenityGuestsAlocity` | bool | false | Credencial Alocity para invitados de amenidad. |
| `amenityUploadPaymentReceipt` | bool | false | Permite subir comprobante de pago de la amenidad. |
| `openEvents` | bool | false | Eventos abiertos. |
| `openEventQr` | bool | false | QR para evento abierto. |
| `closeEvents` | bool | false | Cierre de eventos. |
| `closeEventQr` | bool | false | QR de cierre de evento. |

### 1.7 Residentes / App

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `residentVisits` | bool | true | El residente puede registrar visitas desde la app. |
| `residentUpdateVisitors` | bool | true | El residente puede editar a sus visitantes. |
| `residentAccessByPlate` | bool | false | Acceso del residente por placa. |
| `residentSuggestions` | bool | false | El residente puede enviar sugerencias. |
| `showQrFolioToResidents` | bool | false | Muestra el folio del QR a los residentes. |
| `accessChat` | bool | false | Chat de acceso (residente ↔ caseta). |
| `adminChat` | bool | false | Chat con administración. |
| `userWithUserChat` | bool | false | Chat entre usuarios/residentes. |
| `parentalNotifications` | bool | false | Notificaciones a padres/tutores. |
| `surveys` | bool | false | Encuestas. |
| `suggestions` | bool | false | Módulo sugerencias (maestro). |
| `suggestionsCategories` | str | null | Catálogo de categorías de sugerencias (CSV/JSON). |
| `suggestionsComplaints` | str | null | Catálogo de tipos de queja. |
| `suggestionsKinds` | str | null | Tipos de sugerencia. |
| `suggestionsStatus` | str | null | Estados disponibles de sugerencias. |

### 1.8 Operación / Caseta / Timeline

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `loginFails` | int | 5 | Intentos de login fallidos antes de bloquear. |
| `loginTimeout` | int | 300 (s) | Tiempo de bloqueo tras intentos fallidos. |
| `timezoneHours` | int | -6 | Desfase horario del tenant. |
| `guardTimelineDays` | int | 7 | Días visibles en la línea de tiempo del guardia. |
| `guardCreateVisits` | bool | true | El guardia puede crear visitas. |
| `guardInVisits` | bool | true | El guardia puede dar acceso/entrada. |
| `guardShippingNotification` | bool | false | Notificación de paquetería desde caseta. |
| `dashboardEmployees` | bool | false | Muestra empleados en el dashboard. |
| `timelineCustomVisitTypes` | bool | false | Tipos de visita personalizados en el timeline. |
| `timelineVisitTypesList` | str | null | Catálogo (CSV/JSON) de tipos de visita del timeline. |
| `timelineVehicleTypeList` | str | null | Catálogo de tipos de vehículo del timeline. |
| `timelineHideEmployee` | bool | false | Oculta visitas de empleados en el timeline. |
| `timelineHideFamily` | bool | false | Oculta visitas de familia en el timeline. |
| `timelineHideService` | bool | false | Oculta visitas de servicio en el timeline. |

### 1.9 Objeto anidado `ResidentialModules` (8 opciones)

| Flag (V1) | Tipo | Default | Qué controla |
|-----------|------|---------|--------------|
| `autoremoveFrequentVisitors` | bool | false | Elimina automáticamente visitantes frecuentes inactivos. |
| `autoremoveFrequentVisitorsTime` | int | 90 (d) | Días de inactividad antes de eliminar. |
| `corpVisitFields` | str | null | **Definición (JSON/CSV) de los campos del formulario de visita corporativa** — antecedente directo de `visit_field_configs` en V2. |
| `rentAutomaticInactivation` | bool | false | Inactiva automáticamente rentas vencidas. |
| `rentAutomaticInactivationFacial` | bool | false | Idem, removiendo accesos faciales. |
| `residentAppQrLogo` | str | null | Logo mostrado en el QR de la app del residente. |
| `residentAppQrSize` | str | null | Tamaño del QR en la app del residente. |
| `residentAppTimelineLimit` | int | 30 | Límite de elementos del timeline en la app del residente. |

### 1.10 Objeto anidado `ResidentApp` (35 opciones) — visibilidad de la app del residente

Controla **qué módulos y qué campos** ve el residente. Dos sub-grupos:

**a) Módulos visibles (`hide*` → ocultar; default sugerido: false = visible):**
`hideAirbnb`, `hideAmenity`, `hideCloseEvent`, `hideCommunity`, `hideCompany`, `hideEmployee`,
`hideEvent`, `hideNewVisit`, `hideNotLeaveVisits`, `hideNotice`, `hideNotification`,
`hideQuickVisit`, `hideResident`, `hideSurvey`, `hideVisitList`, `hideVisitor`,
`hideWalkingTransport` (17 flags bool).

**b) Campos del detalle de visita (`visitDetailsHide*` → ocultar; default false = visible):**
`visitDetailsHideAccessKind`, `visitDetailsHideArriveDate`, `visitDetailsHideCreatedBy`,
`visitDetailsHideCreatedUser`, `visitDetailsHideDetails`, `visitDetailsHideDueDate`,
`visitDetailsHideEnterDate`, `visitDetailsHideFolio`, `visitDetailsHideKind`,
`visitDetailsHideLeaveDate`, `visitDetailsHideMainAccessEnterDate`,
`visitDetailsHideMainAccessLeaveDate`, `visitDetailsHidePermanence`, `visitDetailsHideReport`,
`visitDetailsHideSubject` (15 flags bool).

**c) Otros (3):** `addressOnQr` (bool), `customMessageQr` (str — mensaje en el QR),
`residentFacialNotification` (bool).

> **Recuento por categoría:** Acceso/QR 17 · Facial/Hardware 14 · Fotos 5 · Campos formulario
> (`companyInput*`) 9 · Empresa/Corporativo 20 · Reservaciones/Amenidades 12 · Residentes/App 15 ·
> Operación/Caseta/Timeline 14 → **104 en `Residential`** + 8 (`ResidentialModules`) +
> 35 (`ResidentApp`) = **147 opciones configurables**.

---

## 2. Diseño del modelo de configuración para V2

Estrategia de **tres capas**, de menor a mayor flexibilidad:

### Capa A — Columnas tipadas en `residentials` (módulos maestros, alto tráfico de lectura)
Los flags consultados en casi cada request y que conviene indexar/validar fuertemente van como
columnas booleanas/enteras. La migración `0001` ya creó las más usadas
(`qr_enabled`, `reservations`, `lpr`, `repuve`, `facial`, `resident_app`, `company_mode`,
`visitor_expiration_time`, `confirmation_wait_time`, `login_fails`, `login_timeout`,
`timezone_hours`). El `ALTER` de §4 añade los maestros que faltan.

### Capa B — `settings jsonb` (la "cola larga" de ~147 flags)
El resto de flags (sub-flags de hardware, `hide*` de la app del residente, catálogos CSV,
`visitDetailsHide*`, etc.) vive en `residentials.settings` como JSON namespaced. No requieren
migración para agregar/quitar uno nuevo. Estructura propuesta:

```jsonc
{
  "access":   { "qr_numeric": false, "walking_qr": false, "secret_code": false,
                "frequently_by_plate": false, "hide_qr_for_construction": false },
  "facial":   { "hikvision": false, "zkteco": false, "alocity": false,
                "blacklist": false, "visitor": false, "employee": false, "resident": false },
  "photos":   { "manual_visit_photos": true, "employee_tablet_photo": false,
                "autoservice_tablet": false, "photos_min": 1, "photos_max": 3 },
  "company":  { "auto_authorize": false, "staff_qr": false, "recurrent_qrs": false,
                "campus": ["Sede Norte","Sede Sur"] },
  "amenities":{ "facial_auth": false, "guests": false, "upload_payment_receipt": false },
  "resident_app": {
    "hide": { "airbnb": true, "amenity": false, "event": false, "visitor": false },
    "visit_details_hide": { "folio": false, "permanence": true, "report": false },
    "qr": { "logo_url": null, "size": "M", "custom_message": null }
  },
  "timeline": { "guard_days": 7, "custom_visit_types": false,
                "visit_types": ["Familiar","Servicio","Proveedor"],
                "vehicle_types": ["Auto","Moto","Camioneta"],
                "hide": { "employee": false, "family": false, "service": false } }
}
```

Reglas: claves `snake_case`, namespaces por categoría, valores con default conocido. Una capa de
aplicación (TypeScript) define el **schema canónico con defaults** (p.ej. Zod), de modo que leer un
flag ausente devuelve su default y nunca `undefined`.

### Capa C — `visit_field_configs` (campos dinámicos del formulario de visita)
Los `companyInput*` y `corpVisitFields` de V1 describen un formulario configurable. En V2 se
normaliza en una tabla por tenant para soportar **campos arbitrarios** (no sólo los 9 fijos),
con etiqueta, tipo, requerido, orden, visibilidad y a qué tipo de alta aplica
(`visitor`/`employee`/`service`). Esto permite "más/menos campos" sin tocar código.

Campos de la tabla:
- `key` (slug estable, p.ej. `company`, `driver`, `plates`, o uno custom `gate_pass`),
- `label` (etiqueta mostrada), `field_type` (`text|number|select|bool|date|phone|plate|photo`),
- `options jsonb` (para `select`), `required`, `visible`, `sort_order`,
- `applies_to` (enum `visitor|employee|service`), `system` (true = mapea a una columna real de
  `visits`/`visitors`; false = se guarda en `visits` extendido / `jsonb` de respuestas).

Los 9 `companyInput*` se **siembran** como filas `system=true` con su `key` correspondiente, de
modo que activar/ocultar uno = togglear `visible`/`required` de su fila.

---

## 3. Cómo las apps leen la config para renderizar formularios dinámicos

**Origen único de verdad:** al iniciar sesión / abrir el tenant, las apps consultan una vista o
RPC que devuelve la config "resuelta" (columnas + `settings` mergeados con defaults) y la lista de
`visit_field_configs` activa. Se cachea en el cliente y se invalida por Realtime cuando el admin
guarda cambios.

```
GET config →  { residential: {...columnas...},
                settings: {...jsonb resuelto con defaults...},
                visit_fields: [ {key,label,field_type,required,visible,sort_order,applies_to}, ... ] }
```

- **App de caseta / guardia (alta de visita):** construye el formulario iterando
  `visit_fields` filtrados por `applies_to` del tipo de alta y `visible=true`, ordenados por
  `sort_order`; aplica `required`. La sección de fotos lee `photos.photos_min/max` +
  `manual_visit_photos`/`employee_tablet_photo` para decidir cuántas y de qué tipo capturar.
  Botones de QR/LPR/facial se muestran según los flags maestros (Capa A) y de hardware (Capa B).
- **App del residente:** oculta módulos según `resident_app.hide.*` y campos del detalle de visita
  según `resident_app.visit_details_hide.*`. El formulario de "nueva visita" del residente reusa
  los mismos `visit_fields` (`applies_to='visitor'`).
- **Admin web:** además de consumir la config, expone la **UI de edición** (toggles por categoría
  del §1, editor de catálogos CSV→array, y CRUD de `visit_field_configs` con drag-and-drop para
  `sort_order`). Guardar hace `update residentials` (columnas + `settings`) y `upsert`/`delete`
  en `visit_field_configs`.

Patrón de lectura recomendado (resolver defaults en el servidor): una función SQL
`get_residential_config(rid)` que haga `jsonb_build_object(...)` mezclando columnas + `settings`,
o resolverlo en el edge/BFF. Las apps nunca leen flags crudos sin pasar por el resolvedor de
defaults.

---

## 4. DDL propuesto (no aplicado — sólo propuesta)

> Convención RLS tomada de `supabase/policies.sql`: helpers `current_residential_id()` y
> `current_is_admin()`; lectura para el tenant, escritura sólo admin.

```sql
-- ============================================================================
-- 0005_personalizacion.sql  (PROPUESTA — no aplicar sin revisión)
-- ============================================================================

-- 4.1 Flags maestros que faltan como columnas tipadas en residentials ---------
alter table residentials
  add column if not exists company_auto_authorize   boolean not null default false,
  add column if not exists company_staff_qr          boolean not null default false,
  add column if not exists walking_qr                boolean not null default false,
  add column if not exists qr_numeric                boolean not null default false,
  add column if not exists qr_visitors               boolean not null default true,
  add column if not exists qr_employees              boolean not null default false,
  add column if not exists secret_code               boolean not null default false,
  add column if not exists frequently_by_plate       boolean not null default false,
  add column if not exists alocity                   boolean not null default false,
  add column if not exists facial_blacklist          boolean not null default false,
  add column if not exists visitor_facial            boolean not null default false,
  add column if not exists employee_facial           boolean not null default false,
  add column if not exists resident_facial           boolean not null default false,
  add column if not exists manual_visit_photos       boolean not null default true,
  add column if not exists employee_tablet_photo     boolean not null default false,
  add column if not exists autoservice_tablet        boolean not null default false,
  add column if not exists photos_min                int     not null default 1,
  add column if not exists photos_max                int     not null default 3,
  add column if not exists amenity_guests            boolean not null default false,
  add column if not exists reservation_facial_auth   boolean not null default false,
  add column if not exists guard_create_visits       boolean not null default true,
  add column if not exists guard_in_visits           boolean not null default true,
  add column if not exists guard_timeline_days       int     not null default 7,
  add column if not exists resident_visits           boolean not null default true,
  add column if not exists resident_update_visitors  boolean not null default true,
  add column if not exists access_chat               boolean not null default false,
  add column if not exists surveys                   boolean not null default false,
  add column if not exists suggestions               boolean not null default false;
-- (el resto de los ~147 flags vive en residentials.settings jsonb — sin DDL)

-- 4.2 Tipo de alta al que aplica un campo dinámico ----------------------------
do $$ begin
  create type visit_field_target as enum ('visitor','employee','service');
exception when duplicate_object then null; end $$;

create type visit_field_type as enum
  ('text','number','select','bool','date','phone','plate','photo');

-- 4.3 Campos dinámicos del formulario de visita (multi-tenant) ----------------
create table if not exists visit_field_configs (
  id             uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  key            text not null,                 -- slug estable: company, driver, plates, host...
  label          text not null,                 -- etiqueta mostrada en la app
  field_type     visit_field_type not null default 'text',
  options        jsonb not null default '[]'::jsonb,  -- para select: [{value,label}]
  required       boolean not null default false,
  visible        boolean not null default true,
  sort_order     int     not null default 0,
  applies_to     visit_field_target not null default 'visitor',
  system         boolean not null default false, -- true = mapea a columna real de visits/visitors
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (residential_id, applies_to, key)
);
create index on visit_field_configs(residential_id);
create index on visit_field_configs(residential_id, applies_to) where visible;

create trigger trg_visit_field_configs_updated
  before update on visit_field_configs
  for each row execute function set_updated_at();

-- 4.4 RLS (mismo patrón que policies.sql: lectura tenant, escritura admin) -----
alter table visit_field_configs enable row level security;

create policy visit_field_configs_tenant_read on visit_field_configs for select
  using (residential_id = current_residential_id());

create policy visit_field_configs_admin_write on visit_field_configs for all
  using (residential_id = current_residential_id() and current_is_admin())
  with check (residential_id = current_residential_id() and current_is_admin());

-- 4.5 Seed de los 9 companyInput* como campos system por tenant ----------------
-- (ejecutar por cada residential nuevo, p.ej. en seed.sql o un trigger AFTER INSERT)
insert into visit_field_configs (residential_id, key, label, field_type, required, visible, sort_order, applies_to, system)
select r.id, c.key, c.label, c.ftype::visit_field_type, c.req, c.vis, c.ord, 'visitor', true
from residentials r
cross join (values
  ('company','Empresa','text',          false, true,  10),
  ('driver','Conductor','text',         false, false, 20),
  ('subject','Asunto','text',           false, true,  30),
  ('host','Anfitrión','text',           false, true,  40),
  ('plates','Placas','plate',           false, false, 50),
  ('vehicle','Vehículo','text',         false, false, 60),
  ('color','Color','text',              false, false, 70),
  ('details','Detalles','text',         false, false, 80),
  ('campus','Campus','select',          false, false, 90)
) as c(key,label,ftype,req,vis,ord)
on conflict (residential_id, applies_to, key) do nothing;
```

---

## 5. Notas de migración V1 → V2

- Los `companyInput*` (bool) de V1 mapean 1:1 al `visible` de la fila `system` correspondiente en
  `visit_field_configs`. `corpVisitFields` (string JSON) de `ResidentialModules` se parsea para
  sembrar campos **no estándar** (`system=false`).
- Los `qr*`, `facial*`, `amenityGuests*` por proveedor (Hikvision/ZKTeco/Alocity) se consolidan en
  `settings.facial.*` y `settings.access.*` (Capa B), dejando sólo el maestro `facial`/`qr` como
  columna.
- Los catálogos CSV de V1 (`timelineVisitTypesList`, `suggestionsCategories`, `companyCampus`…)
  se convierten a arrays JSON dentro de `settings`.
- `ResidentApp.hide*` y `visitDetailsHide*` se invierten conceptualmente en la UI de admin
  (mostrar "Visible: sí/no") pero se persisten tal cual en `settings.resident_app.*`.
```
