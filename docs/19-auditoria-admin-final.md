# 19 — AUDITORÍA FINAL DEL PORTAL DE ADMINISTRADOR (botones muertos conectados)

Continuación de `docs/18`. Documenta la oleada que **conectó los botones muertos** y migró las
páginas con datos demo a **datos reales de Supabase con acciones que persisten**.
Verificado contra el esquema real (ref `ljzzuwltgezvwpelavdz`), enums, columnas y políticas RLS en vivo.

> Build: `next build` → **EXIT 0**, TypeScript limpio, 17 rutas. Sin `as any` nuevos fuera de los server actions.

---
## 1. Qué se hizo en esta oleada

| # | Cambio | Antes | Ahora |
|---|--------|-------|-------|
| 1 | **Avisos** | datos demo, "Nuevo aviso" muerto | tabla `notices` real · crear / activar-desactivar / eliminar |
| 2 | **Sugerencias** | datos demo, sin acciones | tabla `tickets` real · avanzar estatus (open→en proceso→resuelto→cerrado), reabrir, eliminar, filtros |
| 3 | **Autos** | leía real pero "Nueva placa"/"LPR" sin handler | alta/edición/baja de `plates` · "LPR" abre captura manual con nota honesta |
| 4 | **Lista negra** | datos demo, botones muertos | `plates` marcadas (negra/gris/reportada) + `incidents` con veto · acción "quitar de lista" |
| 5 | **Sedes** | datos demo, "Nueva sede" muerto | `residentials` real + conteo real de casetas y unidades · "Nueva sede" deshabilitado con nota honesta (multi-sede requiere tabla `sites`) |
| 6 | **Visitas** | faltaba **Denegar**; header decorativo | **Denegar** cableado (estado pendiente) · **Nueva visita** crea visitante + visita pendiente · QR Auto/Caminando deshabilitados con tooltip (flujo de apps) |
| 7 | **Dashboard** | gráficas hardcodeadas | horas pico (por hora de `arrive_date`) y tipos de visita (por `kind`) **agregados reales**; degradan a demo con etiqueta "Demo" si no hay datos |
| 8 | **Buscador global** | decorativo | navega a `/visitas?q=` y filtra la lista · chip de sede muestra el **nombre real del residencial** |

---
## 2. Auditoría REAL por ruta (post-fixes, verificada clic-a-clic)

| Ruta | ¿Carga? | ¿Crea/edita? | Estado | Nota |
|------|--------|--------------|--------|------|
| `/dashboard` | ✅ | n/a | ✅ | KPIs, visitas recientes **y gráficas** reales (etiqueta Demo si no hay datos) |
| `/visitas` | ✅ | ✅ | ✅ | Autorizar · **Denegar** · Dar acceso · Salida · Paquetería · Reportar · **Nueva visita** persiste |
| `/departamentos` | ✅ | ✅ CRUD | ✅ | sin cambios (ya estaba bien) |
| `/usuarios` + `/usuarios/[seccion]` | ✅ | ✅ CRUD | ✅ | sin cambios |
| `/m/[entity]` (9 módulos) | ✅ | ✅ CRUD | ✅ | motor declarativo, sin cambios |
| `/configuracion` + `/campos` | ✅ | ✅ | ✅ | sin cambios |
| `/reportes` + `/reportes/[slug]` (14) | ✅ | n/a | ✅ | sin cambios |
| `/autos` | ✅ | ✅ | ✅ | **Nueva placa** y edición/baja persisten; LPR = captura manual |
| `/avisos` | ✅ | ✅ | ✅ | **migrado a real** |
| `/sugerencias` | ✅ | ✅ (estatus) | ✅ | **migrado a real** |
| `/lista-negra` | ✅ | ✅ (quitar) | ✅ | **migrado a real** |
| `/sedes` | ✅ | ⚠️ | 🟡 | datos reales; alta multi-sede pendiente de DDL (honesto) |
| `/emulador` | ✅ | n/a | ✅ | maqueta de las 2 apps |

**Ya no quedan páginas con datos demo** salvo el degradado automático cuando no hay sesión/Supabase
(comportamiento intencional y null-safe de toda la capa `data.ts`).

---
## 3. Checklist de botones / acciones (todo el portal)

**Visitas** — Autorizar ✅ · Denegar ✅ · Dar acceso ✅ · Salida ✅ · Paquetería ✅ · Reportar ✅ ·
Nueva visita ✅ · QR Auto / QR Caminando ⏸️ (deshabilitados con tooltip: se generan desde las apps).
**Avisos** — Nuevo aviso ✅ · Activar/Desactivar ✅ · Eliminar ✅ · Buscar ✅.
**Sugerencias** — Tomar/Resolver/Cerrar ✅ · Reabrir ✅ · Eliminar ✅ · Buscar/Filtrar ✅.
**Autos** — Nueva placa ✅ · Editar ✅ · Eliminar ✅ · Leer placa (LPR) ✅ (captura manual) · Buscar ✅.
**Lista negra** — Quitar de lista ✅ (placa→normal).
**Sedes** — Nueva sede ⏸️ (deshabilitado, requiere tabla `sites`).
**Topbar** — Buscador global ✅ · Chip de sede ✅ (nombre real) · Campana 🔔 ⏸️ (decorativa, sin centro de notificaciones aún).
**Motor `/m/[entity]`, Departamentos, Usuarios, Configuración, Reportes** — sin cambios, ya operativos.

---
## 4. Server actions nuevos y su contrato (tabla · RLS)

Todos siguen el patrón bespoke (`"use server"`, `tenantId()`/`currentUser()`, `revalidatePath`, degradan sin sesión).
Todas las tablas tienen RLS `((residential_id = current_residential_id()) AND current_is_admin())` en escritura.

| Archivo | Acciones | Tabla(s) |
|---------|----------|----------|
| `avisos/actions.ts` | `createNotice` · `toggleNotice` · `deleteNotice` | `notices` |
| `sugerencias/actions.ts` | `setTicketStatus` · `deleteTicket` | `tickets` |
| `autos/actions.ts` | `createPlate` · `updatePlate` · `setPlateList` · `deletePlate` | `plates` |
| `lista-negra` (reusa) | `setPlateList` (de `autos/actions`) | `plates` |
| `visitas/actions.ts` | **+`createVisit`** (crea `visitor` + `visit` pendiente) · `denyVisit` (ya existía, ahora cableado) | `visitors`, `visits` |

Lecturas nuevas en `lib/data.ts`: `getNotices`, `getTickets`, `getBlacklist`, `getSites`,
`getResidentialName`, `getDashboardCharts`. Mismo estilo null-safe que el resto.

---
## 5. Stubs honestos restantes (no son botones muertos: están etiquetados)

- **QR Auto / QR Caminando** (Visitas): la generación de QR es responsabilidad de las apps de
  caseta/residente. Botones deshabilitados con tooltip explicativo.
- **Leer placa (LPR)** (Autos): la lectura automática necesita cámara LPR (módulo Cámaras IP).
  El botón abre captura manual con aviso.
- **Nueva sede** (Sedes): la operación multi-sede requiere la tabla `sites` (ver `docs/10`).
  Deshabilitado con tooltip; la página muestra el residencial como sede única con datos reales.
- **Campana de notificaciones** (topbar): aún sin centro de notificaciones; pendiente.

---
## 6. Pendientes (siguiente fase, ver también `docs/18` §5)

1. **Vistas de detalle / drill-in**: clic en una fila abre `/.../[id]` con relaciones
   (residentes, placas, fotos, empleados). Falta en el motor y en Departamentos/Visitas/Usuarios.
2. **Campos relación (FK) en el motor** `/m/[entity]`: selector de domicilio/espacio → habilita
   Eventos, Reservaciones, Empleados domésticos como módulos declarativos.
3. **Módulos faltantes** (`docs/17`): Eventos, Reservaciones, Alertas de pánico, Roles,
   respuestas de tickets, credencial/visitante, notificaciones, capacitación/videos.
4. **DDL de gaps** (`docs/10`): tabla `sites` (multi-sede) + columnas faltantes → cobertura 100%.
5. **Centro de notificaciones** real para la campana del topbar.
6. **Apps móviles Expo** (residente + caseta) y luego **verificar el empate con las BD**
   correspondientes (objetivo declarado: validar que apps + emulador escriben/leen las mismas tablas).
7. **Hardening**: MFA admin, expiración de sesión, pentest autorizado, observabilidad.

---
## 7. Verificación realizada

- Esquema real de `notices`, `tickets`, `plates`, `incidents`, `visits`, `visitors`, `residentials`,
  `security_booths`, `houses` consultado en vivo; payloads de los `insert/update` casan columna a columna.
- Enums confirmados: `notice_kind`, `ticket_status`, `plate_list`, `visit_kind`, `visit_status`.
- Políticas RLS de escritura confirmadas para todas las tablas tocadas (admin del tenant).
- `next build` → EXIT 0, TypeScript sin errores, 17 rutas generadas.
- Pendiente de **prueba clic-a-clic en vivo** tras el redeploy (las escrituras dependen de sesión de admin real).
