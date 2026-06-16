# 07 — Cobertura de módulos y botones (V1 → V2)

Validación de **cada módulo y botón** revisado, contrastando: crawl del portal, introspección
GraphQL (~90 queries / ~110 mutations), apps en MuMuPlayer, brochure corporativo y manual de guardia.

Leyenda de estado V2 (web admin): ✅ construido · 🟡 stub navegable · 📱 corresponde a app móvil (pendiente) · 🔭 backlog

## A. Portal de administración / supervisor (web)

| Módulo V1 | Botones / acciones clave | V2 |
|-----------|--------------------------|-----|
| Dashboard | KPIs (visitas, domicilios, servicios, visitantes, colonos activados/app), horas pico, tipos de visita, últimas placas, rango de fechas | ✅ |
| Visitas | Buscar, filtros (tipo/estatus/caseta), QR Auto, QR Caminando, Nueva visita, Autorizar, Dar acceso, Notificar paquetería, Reportar, Salida | ✅ (acciones con UI; lógica → backend) |
| Departamentos | Buscar, filtro por tipo (terreno/construcción/residencia/activadas), Nuevo, estado moroso, recibiendo visitas, límites | ✅ |
| Autos y placas | Nueva placa, Leer placa (LPR), lista negra/gris, REPUVE, asignación a casa/visitante | ✅ |
| Usuarios | Tabs por rol (admin/supervisor/staff/guardia/residente), Nuevo, editar, cambiar password, activar/desactivar | ✅ |
| Lista negra | Placas vetadas, visitantes vetados, motivo | ✅ |
| Avisos | Nuevo aviso (empresa/departamento), tipos (general/cobranza/emergencia) | ✅ |
| Sugerencias y quejas | Tickets queja/sugerencia, concepto, estatus, respuestas | ✅ |
| Reportes | 15 reportes (accesos, seguridad, cobranza, comunidad), descarga | ✅ (catálogo; export → backend) |
| Sedes | Multi-sede (corporativo/industrial), casetas y unidades por sede | ✅ |
| Casetas | Nueva caseta (principal/virtual/salida/peatonal), impresora, estatus | ✅ |
| Servicios | Catálogo personalizable, "pide detalles", estatus | ✅ |
| Configuración | Modo (residencial/corporativo/industrial) + feature flags (QR, facial, LPR, REPUVE, reservaciones, paquetería, chat…) | ✅ |
| Reservaciones de amenidades | Espacios, autorizar/denegar, pago/voucher | 🟡 (modelo listo; pantalla pendiente) |
| Eventos | Crear evento, invitados, QR de evento | 🔭 |
| Chat staff↔guardia | Mensajería en tiempo real | 🔭 (Supabase Realtime) |
| Capacitación (videos) | Videos, comentarios, likes | 🔭 |

## B. App de caseta / guardia (tablet) — referencia para `apps/guard`

| Pantalla / botón (manual) | Estado |
|---------------------------|--------|
| Login (usuario, contraseña, residencial) | 📱 |
| Selección de caseta (Principal / Virtual / Salida / Virtual peatonal / Normal) | 📱 |
| Pantalla principal: buscador + filtros (tipo/estatus/caseta) | 📱 (paridad de UI ya en web `/visitas`) |
| `+` Nueva visita sin QR | 📱 |
| Tipo de ingreso: Vehícular / Peatonal / Multidomicilio / Ingreso de colono | 📱 |
| Tipo de visita: Servicio / Conocido-Familia / Empleado | 📱 |
| QR Auto · QR Caminando (escaneo) | 📱 |
| Verifica placas (LPR): sugerencias, captura manual, VERIFICAR, REPUVE, SIGUIENTE | 📱 |
| Por visita: Caseta (estatus), Notificar paquetería, Reportar visita, Creada por guardia, Caminando | 📱 (UI replicada en web) |
| Visitas pre-autorizadas · Historial · Chat con colonos | 📱 |
| Perfil del guardia: Perfil, Cambiar caseta, Cerrar sesión | 📱 |
| Tomar foto del visitante (manual / automática) | 📱 |
| Alertas de pánico (recibir) | 📱 |

## C. App de residente / staff — referencia para `apps/resident`

| Pantalla / botón | Estado |
|------------------|--------|
| Home: QR, Visitas, Notificaciones, Visitantes, Avisos, Staff | 📱 |
| Crear visita (servicios / proveedores / visitantes) + QR | 📱 |
| Visitantes frecuentes (alta, QR, código) | 📱 |
| Gestión de empleados domésticos (alta, QR, horario) | 📱 |
| Gestión de departamento / familiares | 📱 |
| Avisos de la empresa · Notificaciones tiempo real | 📱 |
| Alerta de pánico (botón) | 📱 |
| Perfil: actualizar perfil, cambiar password, sonido, borrar cuenta, aviso de privacidad | 📱 |
| Sugerencias/quejas (queja/sugerencia, concepto, comentario, adjuntar imagen) | 📱 |
| Chat con guardias · Chat bot de soporte (IA) | 🔭 |

## Resumen
- **Web admin (este entregable):** 13 módulos construidos (✅), 1 stub (🟡), 3 backlog (🔭).
- **Apps móviles (`apps/guard`, `apps/resident`):** especificadas botón por botón aquí; se construirán en Expo (React Native) reutilizando el modelo de datos y el cliente de API.
- Toda acción de escritura (autorizar, crear, reportar, etc.) tiene su **mutation** mapeada en `06-api-graphql.md` y su tabla en `/supabase`.
