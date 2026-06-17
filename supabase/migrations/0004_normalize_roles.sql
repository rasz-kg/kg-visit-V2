-- ============================================================================
-- 0004 — Normalizar roles a slugs canónicos en inglés
-- La UI traduce los slugs a etiquetas en español (admin→Administrador, etc.).
-- Idempotente: seguro de re-ejecutar.
-- ============================================================================
update rols set name = 'guard'    where name = 'guardia';
update rols set name = 'resident' where name = 'residente';

-- Asegurar roles supervisor y staff por cada tenant existente
insert into rols (residential_id, name)
select r.id, v.name
from residentials r
cross join (values ('supervisor'), ('staff')) as v(name)
where not exists (
  select 1 from rols x where x.residential_id = r.id and x.name = v.name
);
