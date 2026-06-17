# 24 — HANDOFF (estado completo para continuar en otro chat)

Lee este archivo primero al retomar. Reemplaza a `docs/18` como referencia operativa.
Fecha: 2026-06-17.

---
## 1. ¿Qué es esto?
**KG-Visit V2** — clon white-label de VisitApp para Kauil Group. Tres piezas:
1. **Portal Admin** web (Next.js 16) en https://admin-web-lac-six.vercel.app
2. **App Residente** Expo SDK 52 (`com.kgvisit.app.v2`) — dark mode, phone-first responsive.
3. **App Caseta/Guardia** Expo SDK 52 (`com.kgvisit.guard.v2`) — light mode, tablet-first responsive.

Backend Supabase (project `ljzzuwltgezvwpelavdz`, us-east-2) con RLS por rol.

---
## 2. Estado actual
| Pieza | % | Validado |
|---|---|---|
| Portal Admin | **~100%** | live en Vercel, drill-in + motor con FK + 4 módulos nuevos |
| App Residente | **100%** pantallas | tsc EXIT 0, APK standalone en MuMu, dashboard navegable |
| App Caseta | **100%** pantallas | tsc EXIT 0, APK con cámara real (QR scan + foto) |
| Backend | **100%** | RLS por rol (0006) + guard→notifications (0007), bucket fotos |

**APKs construidos localmente** (no EAS):
- `apks/kg-visit-resident.apk` (78 MB)
- `apks/kg-visit-guard.apk` (98 MB · incluye expo-camera)
- Orientación: **libre** (portrait + landscape, rotación con sensor) — recién activada.
- `apks/` está en `.gitignore`. Para reconstruir: ver §6.

---
## 3. Credenciales (recomendado usar las CORTAS)

| Sistema | Email | Password |
|---|---|---|
| Portal Admin | `a@k.mx` | `123456` |
| App Residente | `r@k.mx` | `123456` |
| App Caseta | `g@k.mx` | `123456` |

Mínimo Supabase Auth = 6 chars; por eso `123456` es lo más corto posible. Las cuentas
largas históricas (`admin@kg-demo.mx` / `KgVisit2026!`, etc.) siguen funcionando.

---
## 4. Accesos
| Recurso | Valor |
|---|---|
| Repo | `git@github.com:rasz-kg/kg-visit-V2.git` (rama `main`) |
| Portal en vivo | https://admin-web-lac-six.vercel.app |
| Supabase | proyecto `kg-visit-V2`, ref `ljzzuwltgezvwpelavdz` |
| Supabase URL | `https://ljzzuwltgezvwpelavdz.supabase.co` |
| Anon key (pública) | `sb_publishable_L8oRM36wh6xG7SHYYERxAQ_aahxXPeG` |
| MuMu Player | adb en `/Applications/MuMuPlayer Pro.app/Contents/MacOS/MuMu Android Device.app/Contents/MacOS/tools/adb` (paths con espacios, citarlos) |
| Devices ADB | `127.0.0.1:5555` y `emulator-5554` apuntan a la **misma instancia** MuMu |

---
## 5. Stack y arquitectura

- **Portal Admin**: Next.js 16 + React 19 + Tailwind v4 + @supabase/ssr · Vercel.
  - Motor declarativo `/m/[entity]` con FK auto-cargada server-side (ver `apps/admin-web/src/lib/entities.ts`).
  - 4 módulos en el motor: servicios, transportes, proveedores, amenidades, casetas, cámaras, etiquetas, categorías, incidentes, eventos, reservaciones, roles, respuestas-ticket.
  - Drill-in: `/visitas/[id]`, `/departamentos/[id]`, `/usuarios/[seccion]/[id]`.
- **Apps móviles**: Expo SDK 52 + React Native 0.76 + expo-router 4.0 + Supabase JS + react-native-svg + (guard: expo-camera + react-native-qrcode-svg).
- **Theme residente**: dark `#0F1729`, surfaces `#1a2238`, brand naranja `#f97316`, radius pill.
- **Theme guard**: light `#f8fafc`, brand naranja, headerOverlay translúcido, radius pill.
- **Modelo de rutas** (Expo Router):
  - Residente: grupo `(tabs)` con `index/visitas/panico/perfil` + rutas hermanas sueltas (notificaciones, avisos, visitantes, staff, sugerencias, reservaciones, eventos/*, familiares, perfil/*, mis-alertas, recuperar, visitas/[id]/*).
  - Guard: grupo `(app)` con index/casetas/visitas/visitas/[id]/{index,qr-emit}/menu/nueva-visita/qr/panico/panico/[id].

---
## 6. Build APKs (procedimiento real verificado)

**Tooling en este Mac (ya instalado):**
- Android Studio + SDK en `~/Library/Android/sdk` (build-tools 36.1, 37.0, platforms android-36.1).
- JDK 17 en `/opt/homebrew/opt/openjdk@17` (Homebrew formula, sin sudo).
- `npx eas-cli` disponible (NO usado — preferimos build local).

```bash
cd "/Users/ava/Desktop/Desarrollos/Apps/KG-VISIT V2"
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Para CADA app:
cd apps/resident   # o apps/guard
npx expo prebuild --platform android --clean
cd ../..
bash scripts/apply-android-patches.sh apps/resident    # ← OBLIGATORIO (ver §gotcha 1)
cd apps/resident/android
./gradlew assembleRelease
# APK: apps/<app>/android/app/build/outputs/apk/release/app-release.apk
```

Tiempo: ~2.5 min residente, ~3 min guard (con expo-camera).

**Instalar en MuMu:**
```bash
ADB="/Applications/MuMuPlayer Pro.app/Contents/MacOS/MuMu Android Device.app/Contents/MacOS/tools/adb"
"$ADB" -s 127.0.0.1:5555 install -r apks/kg-visit-resident.apk
"$ADB" -s 127.0.0.1:5555 install -r apks/kg-visit-guard.apk
```

---
## 7. Gotchas críticos a recordar

### Gotcha 1 — Kotlin 1.9.24 vs 1.9.25 (build siempre falla la primera vez)
Expo SDK 52 + expo-modules-core trae Compose Compiler 1.5.15 que exige Kotlin 1.9.25,
pero RN 0.76 trae 1.9.24 en el classpath. Después de cada `expo prebuild --clean`,
ejecutar `bash scripts/apply-android-patches.sh apps/<app>` para parchear
`android/build.gradle` y `android/gradle.properties` (forzar 1.9.25 + resolutionStrategy
en subprojects).

### Gotcha 2 — Insert en `notifications` desde guard NO usa `.select()`
La policy `notifications_read` no incluye al guardia. Si haces `.insert().select()` el
RETURNING falla con 42501. Solución: solo `.insert(...)` (default `Prefer: return=minimal`).

### Gotcha 3 — Gate del `_layout.tsx` (residente) — ya arreglado
ANTES: `segments[0] === "(tabs)"` causaba que cualquier `router.push("/x")` fuera del
grupo disparara `router.replace("/(tabs)")` y regresara al dashboard. AHORA: whitelist
`PUBLIC_ROUTES = {"login","recuperar"}`. NO regreses al patrón anterior.

### Gotcha 4 — Touch automation via adb es flaky en Pressable de RN
`adb input tap` sobre Pressable dentro de FlatList no siempre dispara el handler.
Para pruebas E2E reales usar Detox o Maestro. Para verificar cadenas auth+RLS,
ejecutar mutations vía REST con el token del usuario.

### Gotcha 5 — MuMu reporta 2 device IDs (5554, 5555) pero es UNA instancia
Los dos IDs apuntan al mismo emulador. No intentes correr residente y guard "en
paralelo" en MuMu — solo puede haber una app en foreground.

### Gotcha 6 — `KEYCODE_BACK` en pantalla raíz manda Expo Go a background
Cuando estás en una pantalla raíz del Stack (ej. login), `input keyevent KEYCODE_BACK`
hace `moveTaskToBack` y la app sale al launcher. Para cerrar el teclado en automation,
hacer tap fuera del input en lugar de BACK.

### Gotcha 7 — Espacios en el path del repo
La ruta `/Users/ava/Desktop/Desarrollos/Apps/KG-VISIT V2/` tiene espacios. Citar SIEMPRE
con `"..."` o usar variables; varios comandos fallan silenciosamente sin quotes.

---
## 8. Esquema y RLS

### Tablas clave (Supabase)
- `residentials` (tenants), `houses`, `users`, `visitors`, `visits`, `visit_photos`
- `plates`, `house_plates`, `visitor_plates`, `employee_plates`
- `employees`, `employee_schedules`, `services`, `transports`, `providers`
- `spaces` (amenidades), `reservations`, `events`, `event_visitors`
- `notices`, `tickets`, `ticket_categories`, `ticket_responses`
- `notifications`, `panic_alerts`, `incidents`, `security_booths`, `cameras`
- `tags`, `rols`, `visit_field_configs`

### Helpers RLS
- `current_residential_id()` — UUID del tenant del usuario en sesión
- `current_user_id()` — UUID de `public.users` del usuario en sesión
- `current_rol()` — texto del rol (admin/supervisor/staff/guard/resident)
- `current_is_admin()` — true si rol ∈ (admin, supervisor)
- `current_is_guard()` — true si rol == 'guard'
- `current_house_id()` — UUID de la casa del residente (null para otros)

### Migraciones aplicadas en prod
- `0001_schema_inicial.sql`
- `0004_normalize_roles.sql`
- `0005_visit_field_configs.sql`
- `0006_app_roles_rls.sql` — RLS por rol (residente=su casa, guardia=su tenant)
- `0007_guard_notify_residents.sql` — guardia puede insertar notifications a residentes del tenant

### Storage
- Bucket público `visit-photos` (5MB max, image/*) con policy `visit_photos_insert_auth` para autenticados.

---
## 9. Lo que está pendiente

### Backend / DDL pendiente (`docs/10` original)
- Tabla `sites` para multi-sede (hoy "Nueva sede" en admin está deshabilitado con tooltip).
- Columnas `secret_code`, `qr_code` en `visits` (los QR se generan client-side con el folio).
- Tracking de lectura por residente en `notices` (badge en residente cuenta todos activos).

### Features no implementadas (intencionales, fuera de scope)
- **REPUVE** (validación de placa robada) — stub con texto "próximamente".
- **LPR automático** (lectura placa por cámara IP) — el flujo es captura manual.
- **Chat realtime** guardia↔colono — requiere Supabase Realtime + canal Phoenix.
- **Push notifications** (`expo-notifications`) — hoy el feed es pull (`useFocusEffect`).
- **Avatar uploader real** — hoy es URL en input (sin Supabase Storage para perfil).
- **Recuperar contraseña** — la pantalla existe pero usa el flujo default de Supabase.
- **Firma upload key real** para Play Store — APKs actuales usan debug.keystore.

### Bugs conocidos / monitoreo
- **avisos.tsx**: usa `useEffect` con `[]` en lugar de `useFocusEffect`. Inconsistencia menor; los avisos no se refrescan al volver. Cambio trivial si se reporta.
- **`expo-system-ui` warning** en cada prebuild: `userInterfaceStyle: Install expo-system-ui`. No bloquea pero se podría agregar con `npx expo install expo-system-ui`.

### Pendiente UX (mejora continua, no bloqueante)
- Validar URL del avatar en `/perfil/editar` (hoy acepta cualquier string).
- Notificación al residente cuando guardia anuncia/avisa (hoy escribe en `notifications`
  pero la app residente recarga con `useFocusEffect` — funcional pero no push real).

---
## 10. Comandos de desarrollo

```bash
# Portal admin local
cd apps/admin-web && npm run dev   # http://localhost:3000

# Redeploy admin a Vercel
cd apps/admin-web && vercel deploy --prod --yes \
  --build-env NEXT_PUBLIC_SUPABASE_URL=https://ljzzuwltgezvwpelavdz.supabase.co \
  --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L8oRM36wh6xG7SHYYERxAQ_aahxXPeG

# Apps móviles con Metro (development)
cd apps/resident && REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.48 npx expo start --port 8081
cd apps/guard    && REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.48 npx expo start --port 8082
# Luego en MuMu (Expo Go SDK 52): abrir exp://192.168.0.48:8081

# Typecheck
cd apps/<app> && npx tsc --noEmit
cd apps/admin-web && npm run build
```

---
## 11. Documentación organizada en `docs/`

- `01-09`: análisis del sistema V1 y planeación V2.
- `10-cobertura-datos.md`: gap DDL.
- `11-rutas-admin.md`, `12-app-residente.md` (22 pantallas), `13-app-caseta.md` (16 pantallas): specs.
- `16-auditoria-v2.md`, `17-gaps-vs-original.md`, `19-auditoria-admin-final.md`: auditorías.
- `18-handoff.md`: handoff inicial (reemplazado por este).
- `20-estado-clonamiento.md`, `21-verificacion-en-vivo.md`, `22-cobertura-final.md`: auditorías de cobertura.
- `23-apks.md`: build local APKs.
- **`24-handoff.md` (este)**: handoff vigente.

---
## 12. Última actividad (resumen de commits)

```
44d6a2f fix(apps): caseta cámara + reportar real + RLS guard→notifications + bucket fotos
ebf39b7 chore(apks): build local funcional + parche Kotlin reusable
6a5bd8f feat: 100% apps Guard + Residente + usuarios cortos + eas.json
063be06 feat(apps): rediseño estético premium + pantallas finales
7d253aa feat: completar portal admin + apps Guard + Residente
4e0ca99 docs(22): cobertura final post-oleada
8dd37d3 docs(21): verificación en vivo
ac13a90 feat(apps/guard): scaffold app de caseta
31d1c6a feat(apps/resident): wizard Nueva visita + RLS 0006
0115181 feat(apps): arranque del clon móvil
2dd681f feat: conectar botones muertos del portal admin
```

---
## 13. Si rompo algo, dónde mirar primero

| Síntoma | Probable causa | Archivo |
|---|---|---|
| App residente vuelve al dashboard al tocar cards | Gate `_layout.tsx` regresó al patrón viejo | `apps/resident/app/_layout.tsx` |
| Build APK falla con "Kotlin 1.9.24" | Olvidaste el patch tras `prebuild --clean` | `scripts/apply-android-patches.sh` |
| Caseta no escanea QR | Permiso de cámara denegado o `expo-camera` quitado | `apps/guard/app.json` plugins |
| Insert notifications falla con 42501 | Cliente JS hizo `.insert().select()` (debe ser solo `.insert`) | `apps/guard/src/lib/data.ts` |
| Admin no ve módulo nuevo en motor | Falta entrada en `entities.ts` o en `nav.ts` | `apps/admin-web/src/lib/{entities,nav}.ts` |
| RLS bloquea acción de un rol | Política faltante o helper devuelve false | `supabase/migrations/0006`/`0007` |

---
## 14. Tareas pendientes propuestas (en orden de impacto)

1. Push notifications (`expo-notifications`) — el residente debería recibir el aviso del guardia en tiempo real.
2. Realtime chat guardia ↔ residente (Supabase Realtime + tabla `messages`).
3. DDL multi-sede (tabla `sites`) — destrabar "Nueva sede" en admin.
4. Firma de upload key para Play Store + `bundleRelease` AAB.
5. Validación de URL en avatar + uploader con Storage (perfil/avatar).
6. Tracking de lectura por residente en `notices` (badge real).
7. Iconos de app y splash custom (hoy son los default de Expo).
8. Migrar a expo-system-ui para quitar warning de prebuild.
