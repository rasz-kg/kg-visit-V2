-- ============================================================================
-- KG-Visit V2 — Políticas RLS (Row Level Security)
-- Modelo: cada usuario pertenece a un `residential` (tenant) y a un `rol`.
-- El enlace con Supabase Auth es users.auth_user_id = auth.uid().
--
-- Estas políticas son el punto de partida seguro. Ajusta según el rol
-- (admin/guardia/residente) conforme avance el desarrollo del backend.
-- ============================================================================

-- Helper: residential del usuario autenticado -------------------------------
create or replace function current_residential_id() returns uuid
language sql stable security definer set search_path = public as $$
  select residential_id from users where auth_user_id = auth.uid() limit 1;
$$;

-- Helper: ¿el usuario autenticado es admin? ---------------------------------
create or replace function current_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from users u join rols r on r.id = u.rol_id
    where u.auth_user_id = auth.uid() and r.name = 'admin'
  );
$$;

-- Helper: casa del usuario autenticado (para residentes) --------------------
create or replace function current_house_id() returns uuid
language sql stable security definer set search_path = public as $$
  select house_id from users where auth_user_id = auth.uid() limit 1;
$$;

-- ----------------------------------------------------------------------------
-- Política base: aislamiento por tenant en todas las tablas con residential_id.
-- (Lectura para cualquier usuario del mismo tenant; escritura sólo admin.)
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'rols','services','transports','providers','spaces','ticket_categories',
    'security_booths','cameras','houses','users','visitors','plates','tags',
    'events','visits','reservations','notices','panic_alerts','incidents',
    'tickets','notifications'
  ] loop
    execute format($f$
      create policy %1$s_tenant_read on %1$s for select
        using (residential_id = current_residential_id());
      create policy %1$s_admin_write on %1$s for all
        using (residential_id = current_residential_id() and current_is_admin())
        with check (residential_id = current_residential_id() and current_is_admin());
    $f$, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Ejemplo de refinamiento por rol (residente sólo ve SU casa).
-- Descomenta/ajusta cuando definas la matriz de permisos por rol.
-- ----------------------------------------------------------------------------
-- drop policy houses_tenant_read on houses;
-- create policy houses_resident_read on houses for select
--   using (
--     residential_id = current_residential_id()
--     and (current_is_admin() or id = current_house_id())
--   );

-- Nota: las tablas hijas sin residential_id (visitor_houses, employees,
-- employee_schedules, house_plates, employee_plates, visitor_plates,
-- event_visitors, visit_photos, ticket_responses) heredan el aislamiento
-- vía sus FKs; agrega políticas EXISTS(...) según el caso de uso.
