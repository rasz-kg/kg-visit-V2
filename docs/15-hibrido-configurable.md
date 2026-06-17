# 15 — Híbrido configurable (apps Vita / Vita Colono → KG-Visit V2)

Probadas EN VIVO las apps **originales** (superset completo) en MuMu:
- **Vita Colono** = `com.visitappmega` (residente) — más rica que el white-label `com.kgvisit.app`.
- **Vita** = `com.visitappguardtablet` (caseta) — equivalente a `com.kgvisit.guard`.

**Hallazgo central:** el white-label KG es la MISMA app con módulos/campos **ocultos por flags**
del tenant (`ResidentApp.hide*`, `visitDetailsHide*`, `companyInput*`, etc. — ver `docs/14`, 147 opciones).
Por tanto el V2 se construye como **híbrido = superset de TODAS las pantallas/campos**, y cada
administrador **enciende/apaga** módulos y campos. Esto cubre "mostrar más/menos campos, más/menos
fotos, datos del visitante", etc.

## Principio de diseño
1. Construir **todas** las rutas/pantallas del superset (no el subconjunto del white-label).
2. Cada módulo (ruta) y cada campo se renderiza **condicionado a la config del tenant**:
   - Módulos → flags `ResidentApp.hide<Modulo>` / `Residential.<modulo>` (ver `docs/14`).
   - Campos del formulario de visita → tabla `visit_field_configs` + `companyInput*` (ver `docs/14`).
   - Campos del detalle de visita → `visitDetailsHide*`.
   - Fotos → `manualVisitPhotos`, `employeeTabletPhoto`, `visitorFacial`, nº de fotos (config).
3. La app lee `myResidential` (o la vista resuelta de config) al iniciar sesión y arma la UI.

## A. App RESIDENTE (Vita Colono) — rutas del híbrido
Detalle de campos/ops en `docs/12-app-residente.md`. Columna "flag" = qué lo activa/oculta.

| # | Ruta / pantalla | Flag de visibilidad (tenant) | Notas de config |
|---|-----------------|------------------------------|-----------------|
| 1 | Home (grid de módulos) | — | el grid muestra solo los módulos activos |
| 2 | Mi QR / credencial | `qr`, `showQrFolioToResidents`, `secretCode` | QR numérico/alfanumérico, código secreto |
| 3 | Visitas (lista) | `residentVisits` | filtros, estados |
| 4 | Nueva visita (asistente) | `hideNewVisit` | pasos: fecha→vigencia→transporte→tipo/visitante |
| 5 | Visita rápida | `hideQuickVisit` | flujo corto |
| 6 | Detalle de visita | `visitDetailsHide*` (≈18 flags) | oculta c/campo del detalle |
| 7 | Visitantes frecuentes (+ alta) | `residentUpdateVisitors`, `frequentlyByPlate` | Create: Full name, Empresa, Notas (configurables) |
| 8 | Empleados domésticos (+ alta, horario, QR) | `qrEmployees`, `dashboardEmployees` | |
| 9 | Familiares / residentes de la casa | `residentApp` | alta/baja de familiares |
| 10 | Eventos (+ alta, invitados, QR) | `hideEvent`, `openEvents/closeEvents` | |
| 11 | Reservación de amenidades | `hideAmenity`, `reservations`, `amenityGuests*` | pago/voucher, aforo |
| 12 | Avisos | `hideNotice` | comunicados |
| 13 | Notificaciones | `parentalNotifications` | centro de actividad |
| 14 | Pánico | `Residential` (panic) | alerta geolocalizada |
| 15 | Staff / personal corporativo | (modo company) | |
| 16 | Sugerencias y quejas | `suggestions`, `suggestionsKinds/Categories` | queja/sugerencia, concepto, foto |
| 17 | Perfil + Administración | — | sonido notif., actualizar perfil, cambiar contraseña, borrar cuenta, aviso de privacidad, chat soporte |
| 18 | Documentos del residencial | `residentialDocuments` | |
| 19 | Encuestas | `surveys` | |
| 20 | Wallets / cartera | `wallets` | |
| 21 | Chat (acceso / con guardia) | `accessChat`, `userWithUserChat` | Realtime |

## B. App CASETA (Vita) — rutas del híbrido
Detalle en `docs/13-app-caseta.md`.

| # | Ruta / pantalla | Flag (tenant) | Notas |
|---|-----------------|---------------|-------|
| 1 | Login (usuario/contraseña/residencial) | — | |
| 2 | Selección de caseta | `securityBooths` | Principal/Virtual/Salida/Peatonal/Normal; `doubleCheck`→registro intermedio |
| 3 | Principal: lista + buscador + filtros (Tipo/Status/Caseta) | — | |
| 4 | QR Auto / QR Caminando (escaneo) | `qr`, `walkingQr`, `cameraQrReader` | |
| 5 | + Nueva visita (Vehícular/Peatonal/Multidomicilio/Ingreso colono) | `guardCreateVisits` | |
| 6 | Tipo de visita (Servicio/Conocido-Familia/Empleado) | `staffVisitTypesList` | tipos configurables |
| 7 | Campos de la visita | `companyInput*` (9) + `visit_field_configs` | empresa, conductor, asunto, host, placas, vehículo, detalles, campus, color |
| 8 | Verificar placas (LPR) | `lpr` | sugerencias plate1..4 |
| 9 | REPUVE (reporte de robo) | `repuve` | |
| 10 | Tomar foto (manual/automática, nº fotos) | `manualVisitPhotos`, `employeeTabletPhoto`, facial | **cuántas fotos = configurable** |
| 11 | Acciones por fila (acceso, salida, notificar paquetería, reportar) | `guardShippingNotification`, `guardInVisits` | |
| 12 | Búsqueda de vehículos (ícono auto) | `residentAccessByPlate` | |
| 13 | Historial de accesos | `guardTimelineDays` | ventana en días |
| 14 | Pánico (recibir alertas) | — | |
| 15 | Chat con colonos | `accessChat` | Realtime |
| 16 | Menú (Usuario, Cambiar caseta, Cerrar sesión) | — | |

## C. Implementación del "configurable"
1. **Backend**: aplicar el DDL de `docs/14` (columnas maestras en `residentials` + `settings jsonb`
   + tabla `visit_field_configs`) y el de `docs/10` (entidades/columnas faltantes).
2. **Panel admin**: módulo "Configuración → Configurar residencial" con todos los toggles agrupados
   (Acceso/QR, Facial/Hardware, Campos de visita, Fotos, Reservaciones, Empresa, Residentes/App,
   Operación) + editor de `visit_field_configs` (campo: etiqueta, tipo, requerido, orden, visible,
   aplica_a, nº fotos).
3. **Apps (Expo) + admin**: un hook `useTenantConfig()` que lee la config resuelta (con defaults) y
   un `<DynamicForm config={...}>` que renderiza campos/fotos según el tenant. Los módulos se montan
   condicionados a sus flags.

## Pendiente de mapear con más detalle (próximas pasadas)
- Sub-formularios exactos de: Eventos, Reservaciones, Empleados (horarios), Sugerencias (categorías).
- Pantallas de Wallets, Encuestas, Documentos (módulos premium que el white-label oculta).
