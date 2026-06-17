# 23 — Cómo generar los APKs (apps Residente + Guard)

Las apps son **Expo SDK 52** sin código nativo personalizado (todo es JS + librerías Expo).
Para distribuir un APK instalable hay dos caminos. **EAS Build cloud es el más rápido**:
no requiere Android SDK ni Java locales.

## Pre-requisitos del Mac

Verificado en esta sesión (16-jun-2026):
- ❌ Android SDK no instalado en `~/Library/Android/sdk`.
- ❌ Java no instalado (`java -version` → "Unable to locate a Java Runtime").
- ✅ Node + npm + npx disponibles (probado con `npx eas-cli@latest --version`).

→ Build **local** (gradle) está fuera de alcance para esta sesión. **Usamos EAS Build cloud**.

## Camino A — EAS Build cloud (recomendado, 1 vez por app)

1) **Crear cuenta Expo** (gratis) en https://expo.dev/signup si no tienes una.
2) **Login en el CLI**:
   ```bash
   npx eas-cli@latest login
   ```
3) **Configurar proyecto EAS** (en cada app, primera vez):
   ```bash
   cd apps/resident
   npx eas-cli@latest init     # crea projectId si falta; ya tenemos eas.json
   cd ../guard
   npx eas-cli@latest init
   ```
   El `eas.json` ya existe en ambas con perfiles `preview` (APK instalable) y `production` (AAB).
4) **Build APK preview** (instalable directo en MuMu/dispositivo):
   ```bash
   cd apps/resident && npx eas-cli@latest build --platform android --profile preview
   cd ../guard       && npx eas-cli@latest build --platform android --profile preview
   ```
   EAS sube el código, builda en sus servidores (10-20 min cada uno) y devuelve URL de descarga del `.apk`.
5) **Instalar el APK** en MuMu (drag-and-drop) o en cualquier Android:
   ```bash
   "/Applications/MuMuPlayer Pro.app/Contents/MacOS/MuMu Android Device.app/Contents/MacOS/tools/adb" install <archivo.apk>
   ```

## Camino B — Local (requiere setup adicional)

Si más adelante quieres builds offline, instala:
1) Android Studio (Android SDK + Platform-Tools + NDK).
2) JDK 17 (`brew install --cask zulu@17`).
3) Configura `ANDROID_HOME`, `JAVA_HOME` en `~/.zshrc`.
4) Luego:
   ```bash
   cd apps/resident
   npx expo prebuild --platform android
   cd android && ./gradlew assembleRelease
   # APK queda en android/app/build/outputs/apk/release/app-release.apk
   ```
Mismo procedimiento para `apps/guard`. Estimado: 60-90 min de setup inicial.

## Perfiles definidos en `eas.json` (ambas apps)

- **preview** → APK firmado con keystore generado por EAS, `distribution: internal`. Ideal
  para subirlo a MuMu o WhatsApp y probarlo en cualquier Android.
- **production** → Bundle AAB para subir a Play Console (no APK; Play Store requiere AAB).

## Credenciales de prueba (cortas)

| Sistema | Email | Password |
|---|---|---|
| Portal Admin | `a@k.mx` | `123456` |
| App Residente | `r@k.mx` | `123456` |
| App Guardia | `g@k.mx` | `123456` |

(`Supabase` no permite contraseñas de menos de 6 caracteres por política de seguridad.)

## Identificadores nativos (app.json)

- Residente: `com.kgvisit.app.v2` (Android + iOS).
- Guard: `com.kgvisit.guard.v2`.

Estos coexisten con los clones V1 ya instalados (`com.kgvisit.app`, `com.kgvisit.guard`), así
que puedes tener ambas versiones lado a lado para comparar.
