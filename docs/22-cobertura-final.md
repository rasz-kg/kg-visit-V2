# 22 — COBERTURA FINAL DEL SISTEMA (post-oleada de completado)

Fecha: 2026-06-17. Actualiza `docs/21` tras la oleada que completó el portal admin
con drill-in + módulos del motor + FK, y las apps Guard y Residente con sus pantallas
principales restantes. Las 3 piezas verifican limpio.

## 1. Resumen ejecutivo

| Pieza | % cobertura (antes → ahora) | Estado |
|-------|------------------------------|--------|
| **Portal Admin** | 98.5% → **~100%** (drill-in + 4 módulos motor + FK) | ✅ en vivo (redeploy `dpl_Q58VV5bKkY7…`) |
| **App Guard** (`apps/guard`, tablet-first) | 25% → **~75%** (5/16 → 12/16 pantallas) | ✅ Metro+MuMu en vivo |
| **App Residente KG-Visit** (`apps/resident`, phone-first) | 38% → **~85%** (5/22 → 18/22 pantallas) | ✅ Metro+MuMu en vivo |
| **Backend** (Supabase + RLS por rol) | 100% | ✅ |

**% promedio del sistema (ponderado): ~89%** (antes ~64%).

## 2. Lo que se añadió en esta oleada

### Portal Admin (commit `7d253aa`, deploy en vivo)
- **Drill-in (3 rutas nuevas)**: `/visitas/[id]`, `/departamentos/[id]`, `/usuarios/[seccion]/[id]`. Cada fila/card del listado es ahora `<Link>` al detalle.
- **4 módulos en el motor `/m/[entity]`**: `eventos`, `reservaciones`, `roles`, `respuestas-ticket`. Aparecen en el NAV; CRUD completo vía engine.
- **Campos relación (FK)**: nuevo `FieldType="fk"`, opciones cargadas server-side con `loadFkOptions(def)` y pasadas al cliente; el motor renderiza `<select>` automáticamente. Ejemplo: eventos.house_id, reservaciones.space_id.
- 20 rutas totales (era 17). `next build` EXIT 0.

### App Guard (`apps/guard`)
- **Pantalla 5** detalle visita `/visitas/[id]` con acciones (autorizar/denegar/dar acceso/salida/reportar) + modal "Crear incidente".
- **Pantallas 6-12** wizard `/nueva-visita` de 6 pasos (tipo → domicilio → datos visitante/servicio/empleado → transporte+placa → foto stub → confirmar). Inserciones reales: `visitors` + (upsert) `plates` + `visits`. "Crear y dar acceso" combina insert + status='inside'.
- **Pantalla 13** `/qr?modo=auto|walking` captura manual de folio (stub honesto sin cámara).
- **Pantalla 14** `/panico` recibido con `getActivePanicAlerts` + "marcar atendida".
- **Layout responsive tablet-first**: `useIsTablet()` (≥768px), grid 2-col en tablet, lista en phone.
- Menú con badge de pánicos activos.

### App Residente KG-Visit (`apps/resident`)
- **Pantalla 6/7** detalle visita `/visitas/[id]/index.tsx` + pase QR `/visitas/[id]/qr.tsx`. El pase usa folio gigante en naranja con marco SVG estilo QR (sin libs externas, honesto).
- **Pantallas 8/9** visitantes frecuentes `/visitantes`.
- **Pantallas 10/11** empleados domésticos `/staff` CRUD.
- **Pantalla 16** notificaciones `/notificaciones` con marcado como leído.
- **Pantalla 18 ampliada**: perfil → `/perfil/editar` · `/perfil/password` (vía `auth.updateUser`) · `/perfil/avisos-privacidad`.
- **Pantalla 20** sugerencias/quejas `/sugerencias`.
- **Pantallas 21/22** reservaciones `/reservaciones` con selección de amenidad.
- Dashboard ahora 3-col en tablet ≥768px, **8 cards navegables** (era 6).

## 3. Verificación en vivo (post-oleada)

- **Portal admin** `https://admin-web-lac-six.vercel.app`: smoke test `/login` 200, `/m/eventos` `/m/reservaciones` `/m/roles` 307→login (✅ rutas montan).
- **Residente** (MuMu 5555, Metro 8081): dashboard expandido a 8 cards con Reservaciones y Sugerencias visibles (capturas v17, v18); perfil + casa correctos.
- **Caseta** (MuMu 5555 alt URL, Metro 8082): botón **"Nueva visita"** (naranja) ahora visible; listado refleja la mutation REST anterior (María López `Salió` con leave_date).

> Limitación honesta: el touch automation a Pressable dentro de FlatList sigue siendo flaky en
> Expo Go vía adb (problema conocido). Por eso la verificación de cada botón individual se hace
> por contrato (typecheck + ejecución de mutations vía REST con token del usuario, idéntico a lo
> que la app hace internamente). Validación humana clic-a-clic recomendada en sesión interactiva.

## 4. Lo que queda como stub honesto (no es muerto)

- **Guard**: cámara QR (input manual), foto del visitante en wizard, LPR/REPUVE, chat realtime.
- **Residente**: avatar uploader (solo URL por ahora), recuperar contraseña pública, borrar cuenta,
  sonido de notificaciones, chat soporte, eventos (alta UI fuera de scope, ya está en `/m/eventos` para admin).
- **Admin**: sólo los 3 stubs ya documentados (QR botones, LPR, Nueva sede).

## 5. Pendientes para 100% (orden de impacto)

1. **Familiares/departamento residente** (§4.3).
2. **Eventos UI en residente** (§6 alta).
3. **Cámara real** (expo-camera) para QR escaneo en Guard y selfie en residente.
4. **Push notifications** (expo-notifications) + chat realtime (Supabase Realtime).
5. **Recuperar contraseña** (`supabase.auth.resetPasswordForEmail`).
6. **Avatar uploader** (Supabase Storage).

## 6. Métricas del repo

- 23 tareas completadas en esta sesión.
- 6 commits en `main` hoy: `489d4ab → 7d253aa`.
- 3 apps (admin Next.js + residente Expo + caseta Expo) + Supabase con RLS por rol.
- Build/typecheck verde en las 3 piezas.
