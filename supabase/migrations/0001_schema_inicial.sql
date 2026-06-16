-- ============================================================================
-- KG-Visit V2 — Esquema inicial (PostgreSQL / Supabase)
-- Control de acceso y gestión de visitantes para comunidades residenciales.
--
-- Decisiones de diseño (vs. V1):
--   * UUID como PK (gen_random_uuid) en lugar de enteros secuenciales  -> mitiga IDOR (V-02)
--   * Multi-tenant por `residential_id` + RLS (ver supabase/policies.sql)
--   * Tipos correctos: timestamptz, numeric, boolean (V1 mandaba casi todo como String)
--   * `settings jsonb` en residentials para la cola larga de feature flags
--   * created_at / updated_at con trigger automático
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;      -- emails/usernames case-insensitive

-- ----------------------------------------------------------------------------
-- Trigger de updated_at
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type house_kind   as enum ('land','construction','build','inhabited','rent');
create type visit_kind   as enum ('visitor','employee','service','resident','provider','event');
create type visit_status as enum ('pending','authorized','denied','inside','finished','canceled','expired');
create type plate_list   as enum ('none','blacklist','graylist','report','recuperate');
create type reservation_status as enum ('pending','authorized','denied','canceled','finished');
create type ticket_status as enum ('open','in_progress','resolved','closed');
create type notice_kind  as enum ('general','house','emergency','payment');

-- ----------------------------------------------------------------------------
-- Tenant + catálogos
-- ----------------------------------------------------------------------------
create table residentials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo          text,
  channel       text,
  timezone_hours int  not null default -6,          -- MX Centro por defecto
  login_fails   int  not null default 5,
  login_timeout int  not null default 300,
  -- módulos principales (flags más usados; el resto va en settings)
  qr_enabled        boolean not null default true,
  reservations      boolean not null default false,
  lpr               boolean not null default false,
  repuve            boolean not null default false,
  facial            boolean not null default false,
  resident_app      boolean not null default true,
  company_mode      boolean not null default false,
  visitor_expiration_time int,
  confirmation_wait_time  int not null default 0,
  settings      jsonb not null default '{}'::jsonb,  -- feature flags de la cola larga
  status        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table rols (
  id   uuid primary key default gen_random_uuid(),
  residential_id uuid references residentials(id) on delete cascade,  -- null = global
  name text not null,
  status boolean not null default true
);

create table services (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  name text not null,
  has_details boolean not null default false,
  status boolean not null default true
);

create table transports (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  name text not null,
  plates boolean not null default false,
  status boolean not null default true
);

create table providers (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  name text not null,
  logo text
);

create table spaces (   -- amenidades reservables
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  deposit numeric(10,2) not null default 0,
  pay boolean not null default false,
  guests_limit int,
  reservation_limit int,
  reservation_future_limit int,
  qr_access boolean not null default false,
  facial_access boolean not null default false,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_categories (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  name text not null,
  status boolean not null default true
);

create table security_booths (   -- casetas
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  name text not null,
  channel text,
  color text,
  main boolean not null default false,
  double_check boolean not null default false,
  printer boolean not null default false,
  status boolean not null default true
);

create table cameras (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  security_booth_id uuid references security_booths(id) on delete set null,
  name text not null,
  kind text,           -- entrada/salida/lpr
  camera_type text,    -- hikvision/axis/...
  url text,
  reference text,
  automatic boolean not null default false,
  status boolean not null default true
);

-- ----------------------------------------------------------------------------
-- Domicilios, usuarios, residentes
-- ----------------------------------------------------------------------------
create table houses (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  address text not null,
  cluster text,
  phone text,
  public_phone text,
  kind house_kind not null default 'inhabited',
  -- cobranza
  paid boolean not null default true,
  paid_start_date date,
  paid_limit_time text,
  defaulter boolean not null default false,
  defaulter_authorize_visit boolean not null default false,
  -- límites
  resident_limit int,
  visitor_limit int,
  employee_limit int,
  frequently_limit int,
  -- bloqueos de QR
  block_qr_casual boolean not null default false,
  block_qr_employee boolean not null default false,
  block_qr_visitor boolean not null default false,
  validated boolean not null default false,
  status boolean not null default true,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on houses(residential_id);

create table users (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  rol_id uuid references rols(id),
  house_id uuid references houses(id) on delete set null,   -- residentes ligados a una casa
  auth_user_id uuid,        -- enlace a auth.users de Supabase (cuando aplique)
  name text not null,
  username citext,
  email citext,
  phone text,
  avatar text,
  qr_code text,
  representative boolean not null default false,
  super boolean not null default false,
  validated boolean not null default false,
  email_activation boolean not null default false,
  -- integraciones de hardware
  hikvision_id text, zk_id text, axis_id text, alocity_user_id text, face_id text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (residential_id, username)
);
create index on users(residential_id);
create index on users(house_id);

create table visitors (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  rol_id uuid references rols(id),
  name text not null,
  phone text,
  company text,
  curp text,
  avatar text,
  credential text,
  notes text,
  amenity boolean not null default false,
  face_id text,
  status boolean not null default true,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on visitors(residential_id);

create table visitor_houses (   -- relación visitante <-> casa (frecuentes, QR por casa)
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  visitor_id uuid not null references visitors(id) on delete cascade,
  qr_code text,
  frequently boolean not null default false,
  frequently_code text,
  unexpected boolean not null default false,
  face_id text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  unique (house_id, visitor_id)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  name text not null,
  credential text,
  folio text,
  avatar text,
  reference text,
  days text,          -- p.ej. "L,M,X,J,V"
  time_start time,
  time_end time,
  face_id text,
  status boolean not null default true,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table employee_schedules (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  day text not null,
  time_start time,
  time_end time
);

-- ----------------------------------------------------------------------------
-- Placas vehiculares
-- ----------------------------------------------------------------------------
create table plates (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  number text not null,
  state text,
  brand text,
  model text,
  year text,
  color text,
  class_type text,
  kind text,
  list plate_list not null default 'none',
  resident boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on plates(residential_id);
create index on plates(number);

create table house_plates (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  plate_id uuid not null references plates(id) on delete cascade,
  graylist boolean not null default false,
  unique (house_id, plate_id)
);
create table employee_plates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  plate_id uuid not null references plates(id) on delete cascade,
  unique (employee_id, plate_id)
);
create table visitor_plates (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  plate_id uuid not null references plates(id) on delete cascade,
  unique (visitor_id, plate_id)
);

create table tags (   -- TAGs vehiculares
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  tag_number text not null,
  car text,
  plates text,
  kind text,
  status boolean not null default true
);

-- ----------------------------------------------------------------------------
-- Eventos
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,
  space_id uuid references spaces(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  name text not null,
  folio text,
  due_date timestamptz,
  finish_date timestamptz,
  open boolean not null default false,
  qr_url text,
  cars int,
  created_at timestamptz not null default now()
);

create table event_visitors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  visitor_id uuid references visitors(id) on delete set null,
  name text,
  folio text
);

-- ----------------------------------------------------------------------------
-- Visitas / accesos  (entidad central)
-- ----------------------------------------------------------------------------
create table visits (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,
  kind visit_kind not null,
  status visit_status not null default 'pending',
  access_kind text,
  folio text,
  subject text,
  details text,
  reason text,
  notes text,
  -- partes relacionadas
  visitor_id uuid references visitors(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  provider_id uuid references providers(id) on delete set null,
  transport_id uuid references transports(id) on delete set null,
  plate_id uuid references plates(id) on delete set null,
  tag_id uuid references tags(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  security_booth_id uuid references security_booths(id) on delete set null,
  created_by uuid references users(id) on delete set null,   -- quien autorizó/creó
  access_user_id uuid references users(id) on delete set null,
  leave_user_id uuid references users(id) on delete set null,
  -- tiempos
  arrive_date timestamptz,
  enter_date timestamptz,
  leave_date timestamptz,
  due_date timestamptz,
  -- flags
  quick boolean not null default false,
  private boolean not null default false,
  guard_report boolean not null default false,
  validity int,
  permanence int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on visits(residential_id);
create index on visits(house_id);
create index on visits(status);
create index on visits(arrive_date);

create table visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Reservaciones de amenidades
-- ----------------------------------------------------------------------------
create table reservations (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  authorization_user_id uuid references users(id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  start_hour int,
  end_hour int,
  status reservation_status not null default 'pending',
  reason text,
  deny_reason text,
  price numeric(10,2) not null default 0,
  paid boolean not null default false,
  payment_voucher text,
  qr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Avisos, pánico, incidentes
-- ----------------------------------------------------------------------------
create table notices (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  kind notice_kind not null default 'general',
  description text not null,
  file text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table panic_alerts (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  house_id uuid references houses(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  kind text,
  lat double precision,
  lng double precision,
  saw text,
  status boolean not null default true,
  created_at timestamptz not null default now()
);

create table incidents (   -- "Insident" en V1
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  visit_id uuid references visits(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  reason text,
  blacklist boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Soporte / tickets
-- ----------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  ticket_category_id uuid references ticket_categories(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  subject text not null,
  description text,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_responses (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  message text not null,
  viewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Triggers updated_at
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'residentials','spaces','houses','users','visitors','employees','plates',
    'visits','reservations','tickets'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Seguridad: RLS habilitado por defecto en TODAS las tablas (secure by default).
-- Las políticas concretas viven en supabase/policies.sql.
-- El SQL Editor / service_role omite RLS, por lo que el seed funciona sin políticas.
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'residentials','rols','services','transports','providers','spaces',
    'ticket_categories','security_booths','cameras','houses','users','visitors',
    'visitor_houses','employees','employee_schedules','plates','house_plates',
    'employee_plates','visitor_plates','tags','events','event_visitors','visits',
    'visit_photos','reservations','notices','panic_alerts','incidents','tickets',
    'ticket_responses','notifications'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;
