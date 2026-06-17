# 09 — Blueprint de apps móviles (probadas en MuMu)

Capturado **en vivo** en MuMuPlayer (device `127.0.0.1:5555`, landscape 2560×1440) + manuales PDF.
Stack destino: **Expo (React Native)**, consumiendo el mismo backend Supabase.

## App de residente — `com.kgvisit.app` (Expo: `apps/resident`)

Navegación inferior: **Inicio · Visitas · Pánico · Perfil**.

- **Inicio (Dashboard):** tarjetas → Notificaciones (centro de actividad), Visitantes (listado),
  Avisos (comunicados, con badge de no leídos), Staff (personal corporativo).
- **Visitas:** listado con buscador + filtro; cada visita muestra estatus (Autorizada…), folio,
  transporte y botón **QR**. Botón **Nueva visita**.
- **Nueva visita (asistente por pasos):**
  1. **Fecha y hora** — cuándo estará disponible.
  2. **Vigencia** — horas de validez (p.ej. 24h).
  3. **Transporte** — auto / peatonal.
  4. **Tipo + datos del visitante** (servicio / proveedor / visitante; conocido/familia; empleado).
  → genera QR / pase.
- **Pánico:** botón de alerta (geolocalizada).
- **Perfil:** actualizar perfil, cambiar contraseña, sonido de notificaciones, avisos,
  aviso de privacidad, sugerencias/quejas, chat de soporte, borrar cuenta.
- Gestión de **visitantes frecuentes** y **empleados domésticos** (alta, QR, horario).

## App de caseta / guardia — `com.kgvisit.guard` (Expo: `apps/guard`)

Encabezado: logo + **Buscar** + filtros (**Tipo Visita, Status, Caseta**) + **QR Auto** + **QR Caminando**
+ historial + menú (Perfil / Cambiar caseta / Cerrar sesión).

- **Login:** usuario, contraseña, residencial. Luego **selección de caseta**
  (Principal / Virtual / Salida principal / Virtual peatonal / Normal).
- **Listado de visitas** (Visita · Tipo · Fecha/Hora) con acciones por fila:
  Caseta (estatus), **Notificar paquetería**, **Reportar visita**, Creada por guardia, Caminando, **Salida**.
- **"+" Nueva visita →** tipo de ingreso: **Visita Vehícular / Visita Peatonal**
  (y según config: Multidomicilio / Ingreso de colono) → **Visita Casual**.
  - Tipo de visita: **Servicio / Conocido-Familia / Empleado**.
  - Vehícular → **Verificar placas (LPR)**: sugerencias automáticas o captura manual → **REPUVE**
    (reporte de robo) → siguiente → **tomar foto** del visitante → **dar acceso**.
- **QR Auto / QR Caminando:** escaneo de QR del visitante para validar y dar acceso.
- Recibe **alertas de pánico**; **chat con colonos**; uso de **lista negra/gris**.

## Plan de construcción (Expo)
Monorepo: `apps/resident`, `apps/guard` + `packages/api` (cliente Supabase tipado compartido) +
`packages/ui`. Auth con Supabase; RLS por rol (resident / guard). Cámara para QR (expo-camera) y
captura de foto; notificaciones push (expo-notifications). El modelo de datos ya existe en `/supabase`.
