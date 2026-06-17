# 23 — APKs (build local funcionando)

**Estado:** ambos APKs ya están construidos y validados en MuMu (corren standalone, sin Metro).

| App | Paquete | Etiqueta | Tamaño | Archivo |
|---|---|---|---|---|
| Residente | `com.kgvisit.app.v2` | KG-Visit | 78 MB | `apks/kg-visit-resident.apk` |
| Caseta | `com.kgvisit.guard.v2` | KG-Visit Caseta | 78 MB | `apks/kg-visit-guard.apk` |

`apks/` está en `.gitignore` (los binarios no entran al repo). Si los necesitas
en otra máquina, los reconstruyes con el procedimiento de abajo.

## Toolchain instalada en este Mac (verificada)
- ✅ Android Studio + SDK en `~/Library/Android/sdk`
- ✅ `build-tools 36.1.0 + 37.0.0`, `platforms android-36.1`
- ✅ JDK 17 (Homebrew formula): `/opt/homebrew/opt/openjdk@17`
- ✅ `sdkmanager` (Homebrew android-commandlinetools)
- ❌ No requiere `gradle` global — usamos el wrapper de cada app.

## Build (1 comando por app)

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# Residente
cd apps/resident
npx expo prebuild --platform android --clean
bash ../../scripts/apply-android-patches.sh apps/resident  # <- fix Kotlin (ver §issue)
cd android && ./gradlew assembleRelease
# APK queda en: android/app/build/outputs/apk/release/app-release.apk
cp android/app/build/outputs/apk/release/app-release.apk ../../apks/kg-visit-resident.apk

# Guard (idéntico)
cd apps/guard
npx expo prebuild --platform android --clean
bash ../../scripts/apply-android-patches.sh apps/guard
cd android && ./gradlew assembleRelease
cp android/app/build/outputs/apk/release/app-release.apk ../../apks/kg-visit-guard.apk
```

## El issue de Kotlin (parche reusable)

Expo SDK 52 + RN 0.76 trae Compose Compiler 1.5.15 (vía expo-modules-core) que exige
Kotlin 1.9.25, pero el classpath de RN viene con 1.9.24 → build falla. El script
`scripts/apply-android-patches.sh` aplica 2 cambios al proyecto generado:

1. **`gradle.properties`**: agrega `android.kotlinVersion=1.9.25`,
   `kotlin.version=1.9.25` y `android.suppressKotlinVersionCompatibilityCheck=true`.
2. **`android/build.gradle`**:
   - Hace explícita la versión del classpath: `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")`.
   - Añade `subprojects { sub -> resolutionStrategy.eachDependency { ... useVersion kotlinVersion } }`
     para forzar la versión en TODOS los módulos (incluido expo-modules-core).

Se debe re-ejecutar el script cada vez que se haga `expo prebuild --clean` (que
regenera la carpeta android/ desde cero).

## Instalar en MuMu / dispositivo

```bash
ADB="/Applications/MuMuPlayer Pro.app/Contents/MacOS/MuMu Android Device.app/Contents/MacOS/tools/adb"
"$ADB" -s 127.0.0.1:5555 install -r apks/kg-visit-resident.apk
"$ADB" -s 127.0.0.1:5555 install -r apks/kg-visit-guard.apk
```

Validado: ambos APKs arrancan standalone en MuMu (sin Metro ni Expo Go), muestran
la pantalla de login premium y se conectan a Supabase real.

## Credenciales de prueba (mínimo Supabase: 6 chars)

| Sistema | Email | Password |
|---|---|---|
| Portal Admin | `a@k.mx` | `123456` |
| App Residente | `r@k.mx` | `123456` |
| App Guardia | `g@k.mx` | `123456` |

## Próximos pasos

- **Firma de release real**: hoy el APK usa el debug keystore de RN. Para Play Store
  hay que generar un upload keystore con `keytool` y configurarlo en
  `android/app/build.gradle` antes del próximo `assembleRelease`. Documentado en
  Expo Docs > "Sign your app".
- **Bundle AAB** (formato Play Store): `./gradlew bundleRelease` en lugar de
  `assembleRelease`. El perfil `production` de `eas.json` ya lo contempla.
- **Versionado**: cambiar `versionCode` y `versionName` en `app.json` antes de cada
  release (el prebuild los propaga al `android/app/build.gradle`).
