-- ============================================================================
-- KG-Visit V2 — 0006: Auth y RLS por ROL para las apps móviles
-- ----------------------------------------------------------------------------
-- Hasta 0005 el backend autoriza ESCRITURA solo a admin/supervisor y LECTURA a
-- cualquier usuario del tenant. Las apps de RESIDENTE y CASETA (GUARDIA) necesitan
-- permisos propios. Esta migración:
--   1) agrega helpers de identidad/rol,
--   2) refina la LECTURA de tablas sensibles (el residente solo ve lo de SU casa),
--   3) habilita ESCRITURA acotada para guardia y residente.
--
-- Convención de nombres en vivo: cada tabla tiene `<tabla>_read` (SELECT) y
-- `<tabla>_write` (ALL, admin). Aquí se REEMPLAZA `<tabla>_read` por una versión
-- consciente del rol y se AÑADEN políticas de escritura con nombres únicos
-- (coexisten con `<tabla>_write` admin vía OR). Idempotente (DROP IF EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helpers de identidad y rol
-- ---------------------------------------------------------------------------
create or replace function current_user_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function current_rol() returns text
language sql stable security definer set search_path = public as $$
  select r.name from users u join rols r on r.id = u.rol_id
  where u.auth_user_id = auth.uid() limit 1;
$$;

create or replace function current_is_guard() returns boolean
language sql stable security definer set search_path = public as $$
  select current_rol() = 'guard';
$$;

-- current_house_id(): casa del usuario en sesión (no existía en prod; se crea aquí).
create or replace function current_house_id() returns uuid
language sql stable security definer set search_path = public as $$
  select house_id from users where auth_user_id = auth.uid() limit 1;
$$;

-- current_residential_id() y current_is_admin() (admin+supervisor) ya existen (0001/0004).

-- ---------------------------------------------------------------------------
-- 2. VISITS — guardia opera el tenant; residente solo su casa
-- ---------------------------------------------------------------------------
drop policy if exists visits_read on visits;
create policy visits_read on visits for select using (
  residential_id = current_residential_id()
  and (current_is_admin() or current_is_guard() or house_id = current_house_id())
);
drop policy if exists visits_guard_write on visits;
create policy visits_guard_write on visits for all
  using (residential_id = current_residential_id() and current_is_guard())
  with check (residential_id = current_residential_id() and current_is_guard());
drop policy if exists visits_resident_write on visits;
create policy visits_resident_write on visits for all
  using (residential_id = current_residential_id() and house_id = current_house_id())
  with check (residential_id = current_residential_id() and house_id = current_house_id());

-- ---------------------------------------------------------------------------
-- 3. VISITORS — alta por residente y por guardia (visitante inesperado)
--    (visitors_read se conserva: guardia/residente buscan visitantes del tenant)
-- ---------------------------------------------------------------------------
drop policy if exists visitors_resident_insert on visitors;
create policy visitors_resident_insert on visitors for insert
  with check (residential_id = current_residential_id() and current_rol() = 'resident');
drop policy if exists visitors_guard_insert on visitors;
create policy visitors_guard_insert on visitors for insert
  with check (residential_id = current_residential_id() and current_is_guard());

-- ---------------------------------------------------------------------------
-- 4. VISITOR_HOUSES (frecuentes) — hija sin residential_id (tenant vía house)
-- ---------------------------------------------------------------------------
drop policy if exists visitor_houses_read on visitor_houses;
create policy visitor_houses_read on visitor_houses for select using (
  exists (
    select 1 from houses h where h.id = visitor_houses.house_id
    and h.residential_id = current_residential_id()
    and (current_is_admin() or current_is_guard() or h.id = current_house_id())
  )
);
drop policy if exists visitor_houses_resident_write on visitor_houses;
create policy visitor_houses_resident_write on visitor_houses for all
  using (house_id = current_house_id())
  with check (house_id = current_house_id());
drop policy if exists visitor_houses_admin_write on visitor_houses;
create policy visitor_houses_admin_write on visitor_houses for all
  using (exists (select 1 from houses h where h.id = visitor_houses.house_id and h.residential_id = current_residential_id() and current_is_admin()))
  with check (exists (select 1 from houses h where h.id = visitor_houses.house_id and h.residential_id = current_residential_id() and current_is_admin()));

-- ---------------------------------------------------------------------------
-- 5. EMPLOYEES (domésticos) — hija sin residential_id (tenant vía house)
-- ---------------------------------------------------------------------------
drop policy if exists employees_read on employees;
create policy employees_read on employees for select using (
  exists (
    select 1 from houses h where h.id = employees.house_id
    and h.residential_id = current_residential_id()
    and (current_is_admin() or current_is_guard() or h.id = current_house_id())
  )
);
drop policy if exists employees_resident_write on employees;
create policy employees_resident_write on employees for all
  using (house_id = current_house_id())
  with check (house_id = current_house_id());
drop policy if exists employees_admin_write on employees;
create policy employees_admin_write on employees for all
  using (exists (select 1 from houses h where h.id = employees.house_id and h.residential_id = current_residential_id() and current_is_admin()))
  with check (exists (select 1 from houses h where h.id = employees.house_id and h.residential_id = current_residential_id() and current_is_admin()));

-- ---------------------------------------------------------------------------
-- 6. EVENTS — residente gestiona los de su casa
-- ---------------------------------------------------------------------------
drop policy if exists events_read on events;
create policy events_read on events for select using (
  residential_id = current_residential_id()
  and (current_is_admin() or current_is_guard() or house_id = current_house_id())
);
drop policy if exists events_resident_write on events;
create policy events_resident_write on events for all
  using (residential_id = current_residential_id() and house_id = current_house_id())
  with check (residential_id = current_residential_id() and house_id = current_house_id());

-- ---------------------------------------------------------------------------
-- 7. RESERVATIONS — residente gestiona las propias
-- ---------------------------------------------------------------------------
drop policy if exists reservations_read on reservations;
create policy reservations_read on reservations for select using (
  residential_id = current_residential_id()
  and (current_is_admin() or user_id = current_user_id())
);
drop policy if exists reservations_resident_write on reservations;
create policy reservations_resident_write on reservations for all
  using (residential_id = current_residential_id() and user_id = current_user_id())
  with check (residential_id = current_residential_id() and user_id = current_user_id());

-- ---------------------------------------------------------------------------
-- 8. TICKETS (sugerencias/quejas) — residente ve y crea los propios
-- ---------------------------------------------------------------------------
drop policy if exists tickets_read on tickets;
create policy tickets_read on tickets for select using (
  residential_id = current_residential_id()
  and (current_is_admin() or user_id = current_user_id())
);
drop policy if exists tickets_resident_write on tickets;
create policy tickets_resident_write on tickets for all
  using (residential_id = current_residential_id() and user_id = current_user_id())
  with check (residential_id = current_residential_id() and user_id = current_user_id());

-- ---------------------------------------------------------------------------
-- 9. PANIC_ALERTS — residente dispara las propias; guardia recibe todas
-- ---------------------------------------------------------------------------
drop policy if exists panic_alerts_read on panic_alerts;
create policy panic_alerts_read on panic_alerts for select using (
  residential_id = current_residential_id()
  and (current_is_admin() or current_is_guard() or user_id = current_user_id())
);
drop policy if exists panic_alerts_resident_insert on panic_alerts;
create policy panic_alerts_resident_insert on panic_alerts for insert
  with check (residential_id = current_residential_id() and user_id = current_user_id());
drop policy if exists panic_alerts_guard_update on panic_alerts;
create policy panic_alerts_guard_update on panic_alerts for update
  using (residential_id = current_residential_id() and current_is_guard())
  with check (residential_id = current_residential_id() and current_is_guard());

-- ---------------------------------------------------------------------------
-- 10. NOTIFICATIONS — cada quien ve/marca las suyas
-- ---------------------------------------------------------------------------
drop policy if exists notifications_read on notifications;
create policy notifications_read on notifications for select using (
  residential_id = current_residential_id()
  and (current_is_admin() or user_id = current_user_id())
);
drop policy if exists notifications_own_update on notifications;
create policy notifications_own_update on notifications for update
  using (user_id = current_user_id())
  with check (user_id = current_user_id());

-- ---------------------------------------------------------------------------
-- 11. INCIDENTS — guardia reporta (incidents_read/write admin se conservan)
-- ---------------------------------------------------------------------------
drop policy if exists incidents_guard_insert on incidents;
create policy incidents_guard_insert on incidents for insert
  with check (residential_id = current_residential_id() and current_is_guard());

-- ---------------------------------------------------------------------------
-- 12. VISIT_PHOTOS — guardia/residente suben fotos de su visita (tenant vía visit)
-- ---------------------------------------------------------------------------
drop policy if exists visit_photos_read on visit_photos;
create policy visit_photos_read on visit_photos for select using (
  exists (
    select 1 from visits v where v.id = visit_photos.visit_id
    and v.residential_id = current_residential_id()
    and (current_is_admin() or current_is_guard() or v.house_id = current_house_id())
  )
);
drop policy if exists visit_photos_write on visit_photos;
create policy visit_photos_write on visit_photos for insert with check (
  exists (
    select 1 from visits v where v.id = visit_photos.visit_id
    and v.residential_id = current_residential_id()
    and (current_is_admin() or current_is_guard() or v.house_id = current_house_id())
  )
);

-- ---------------------------------------------------------------------------
-- NOTA: las cuentas de Supabase Auth para residentes/guardias (auth.users +
-- users.auth_user_id) se crean aparte (alta/invitación desde el portal o seed).
-- Catálogos (services, transports, security_booths, cameras, spaces,
-- ticket_categories) y houses conservan su `*_read` de tenant.
-- ============================================================================
