-- ============================================================================
-- KG-Visit V2 — 0007: Guardia puede insertar notifications a residentes de su tenant
-- ----------------------------------------------------------------------------
-- Habilita los flujos "Anunciar al colono" y "Avisar al responsable" desde la
-- app de Caseta. Sin esto, los inserts en notifications hechos por el guardia
-- fallaban por RLS (0006 solo añadió guard_write para visits/incidents/etc.,
-- no para notifications).
--
-- La política valida que:
--   - El guardia esté autenticado (current_is_guard()).
--   - El residential_id de la notificación coincida con el del guardia.
--   - El user_id destinatario sea un usuario REAL de ese mismo tenant
--     (evita que el guardia mande notificaciones a usuarios de otros tenants).
-- ============================================================================

drop policy if exists notifications_guard_insert on notifications;
create policy notifications_guard_insert on notifications for insert
  with check (
    current_is_guard()
    and residential_id = current_residential_id()
    and exists (
      select 1 from users u
      where u.id = notifications.user_id
        and u.residential_id = current_residential_id()
    )
  );
