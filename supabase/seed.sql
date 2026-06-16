-- ============================================================================
-- KG-Visit V2 — Datos demo / funcionales para empezar a poblar
-- UUIDs fijos y legibles para que las relaciones sean fáciles de seguir.
-- Ejecutar después de 0001_schema_inicial.sql (SQL Editor o `supabase db reset`).
-- ============================================================================

-- Tenant -----------------------------------------------------------------------
insert into residentials (id, name, channel, qr_enabled, reservations, lpr, resident_app)
values ('11111111-1111-1111-1111-111111111111', 'Fraccionamiento Demo KG', 'kg-demo',
        true, true, true, true);

-- Roles ------------------------------------------------------------------------
insert into rols (id, residential_id, name) values
 ('20000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','admin'),
 ('20000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','guardia'),
 ('20000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','residente');

-- Caseta -----------------------------------------------------------------------
insert into security_booths (id, residential_id, name, main, printer) values
 ('30000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Caseta Principal', true, true);

-- Servicios (los 7 tipos vistos en el portal) ----------------------------------
insert into services (id, residential_id, name, has_details) values
 ('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Paquetería', true),
 ('40000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Gas', false),
 ('40000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Agua', false),
 ('40000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Comida a domicilio', false),
 ('40000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Mantenimiento', true),
 ('40000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Jardinería', false),
 ('40000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','Mensajería', false);

-- Transportes ------------------------------------------------------------------
insert into transports (id, residential_id, name, plates) values
 ('41000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Automóvil', true),
 ('41000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Motocicleta', true),
 ('41000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','A pie', false);

-- Amenidades -------------------------------------------------------------------
insert into spaces (id, residential_id, name, price, pay, guests_limit, qr_access) values
 ('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Salón de Eventos', 1500.00, true, 50, true),
 ('50000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Alberca', 0, false, 20, false);

-- Categorías de tickets --------------------------------------------------------
insert into ticket_categories (id, residential_id, name) values
 ('51000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Mantenimiento'),
 ('51000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Quejas y sugerencias');

-- Domicilios (replican los del portal demo) ------------------------------------
insert into houses (id, residential_id, address, kind, paid, defaulter, status, validated) values
 ('60000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Cobra 101','inhabited', true, false, true, true),
 ('60000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Empleado 1','inhabited', true, false, true, true),
 ('60000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Escorpión 22','inhabited', true, false, true, true),
 ('60000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Lote 14 (en construcción)','construction', false, true, true, false),
 ('60000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Terreno 7','land', false, false, true, false);

-- Usuarios (admin, guardia, residente) -----------------------------------------
insert into users (id, residential_id, rol_id, house_id, name, username, email, phone, super, validated, status) values
 ('70000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000001', null,
   'Administrador General','admin','admin@kg-demo.mx','5550000001', true, true, true),
 ('70000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000002', null,
   'Guardia Caseta','guardia','guardia@kg-demo.mx','5550000002', false, true, true),
 ('70000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001',
   'Juan Pérez (Residente)','jperez','jperez@kg-demo.mx','5550000003', false, true, true);

-- Visitantes -------------------------------------------------------------------
insert into visitors (id, residential_id, rol_id, name, phone, company) values
 ('80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000003','María López','5551111111', null),
 ('80000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000003','Repartidor Amazon','5552222222','Amazon');

insert into visitor_houses (house_id, visitor_id, frequently, qr_code) values
 ('60000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001', true, 'QR-MARIA-001');

-- Empleado doméstico + horario ------------------------------------------------
insert into employees (id, house_id, name, days, time_start, time_end) values
 ('90000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','Ana (limpieza)','L,M,X,J,V','08:00','14:00');
insert into employee_schedules (employee_id, day, time_start, time_end) values
 ('90000000-0000-0000-0000-000000000001','L','08:00','14:00'),
 ('90000000-0000-0000-0000-000000000001','X','08:00','14:00');

-- Placas -----------------------------------------------------------------------
insert into plates (id, residential_id, number, state, brand, color, resident) values
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','ABC-12-34','CDMX','Nissan','Blanco', true),
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','XYZ-98-76','EdoMex','Mazda','Gris', false);
insert into house_plates (house_id, plate_id) values
 ('60000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
insert into visitor_plates (visitor_id, plate_id) values
 ('80000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002');

-- Visitas demo -----------------------------------------------------------------
insert into visits (residential_id, house_id, kind, status, folio, visitor_id, transport_id, plate_id, security_booth_id, created_by, arrive_date) values
 ('11111111-1111-1111-1111-111111111111','60000000-0000-0000-0000-000000000001','visitor','authorized','F-0001',
  '80000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000003', now() - interval '2 hours');

insert into visits (residential_id, house_id, kind, status, folio, service_id, security_booth_id, created_by, arrive_date) values
 ('11111111-1111-1111-1111-111111111111','60000000-0000-0000-0000-000000000003','service','finished','F-0002',
  '40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002', now() - interval '1 day');

-- Aviso, reservación, ticket ---------------------------------------------------
insert into notices (residential_id, user_id, kind, description) values
 ('11111111-1111-1111-1111-111111111111','70000000-0000-0000-0000-000000000001','general','Corte de agua programado el sábado 9:00–12:00.');

insert into reservations (residential_id, space_id, user_id, start_date, end_date, status, price) values
 ('11111111-1111-1111-1111-111111111111','50000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000003',
  now() + interval '3 days', now() + interval '3 days 5 hours', 'pending', 1500.00);

insert into tickets (residential_id, ticket_category_id, user_id, subject, description, status) values
 ('11111111-1111-1111-1111-111111111111','51000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000003',
  'Luminaria fundida','El poste frente a Cobra 101 no enciende.','open');
