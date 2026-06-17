-- ============================================================================
-- 0005 — Campos dinámicos del formulario de visita, configurables por admin (tenant)
-- Permite a cada administrador definir qué campos pide la app, su tipo, si son
-- obligatorios, orden, visibilidad y a qué tipo de visita aplican.
-- ============================================================================
create table if not exists visit_field_configs (
  id uuid primary key default gen_random_uuid(),
  residential_id uuid not null references residentials(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null default 'text',          -- text | number | select | date | phone | photo
  required boolean not null default false,
  visible boolean not null default true,
  sort_order int not null default 0,
  applies_to text not null default 'visitor', -- visitor | employee | service | all
  options jsonb,
  system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (residential_id, key, applies_to)
);
create index if not exists idx_vfc_residential on visit_field_configs(residential_id);

create trigger trg_vfc_updated before update on visit_field_configs
  for each row execute function set_updated_at();

alter table visit_field_configs enable row level security;
create policy vfc_read on visit_field_configs for select to authenticated
  using (residential_id = current_residential_id());
create policy vfc_write on visit_field_configs for all to authenticated
  using (residential_id = current_residential_id() and current_is_admin())
  with check (residential_id = current_residential_id() and current_is_admin());

-- Seed de los 9 campos companyInput* del original (tenant demo)
insert into visit_field_configs (residential_id, key, label, type, required, visible, sort_order, applies_to, system)
values
 ('11111111-1111-1111-1111-111111111111','company','Empresa','text', false, true, 1, 'all', true),
 ('11111111-1111-1111-1111-111111111111','driver','Nombre del conductor','text', true, true, 2, 'all', true),
 ('11111111-1111-1111-1111-111111111111','subject','Asunto de la visita','text', true, true, 3, 'all', true),
 ('11111111-1111-1111-1111-111111111111','host','A quién visita','text', true, true, 4, 'all', true),
 ('11111111-1111-1111-1111-111111111111','plates','Placas','text', false, true, 5, 'visitor', true),
 ('11111111-1111-1111-1111-111111111111','vehicle','Tipo de vehículo','select', false, true, 6, 'visitor', true),
 ('11111111-1111-1111-1111-111111111111','color','Color','text', false, false, 7, 'visitor', true),
 ('11111111-1111-1111-1111-111111111111','campus','Sede / Campus','select', false, false, 8, 'all', true),
 ('11111111-1111-1111-1111-111111111111','details','Detalles','text', false, true, 9, 'all', true)
on conflict (residential_id, key, applies_to) do nothing;
