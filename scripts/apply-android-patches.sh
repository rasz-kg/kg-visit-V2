#!/usr/bin/env bash
# Aplica los fixes necesarios DESPUÉS de `npx expo prebuild --platform android --clean`
# en apps/{resident,guard}, para que `./gradlew assembleRelease` compile sin
# el error "Compose Compiler 1.5.15 requires Kotlin 1.9.25 / using 1.9.24".
#
# Uso:
#   bash scripts/apply-android-patches.sh apps/resident
#   bash scripts/apply-android-patches.sh apps/guard
set -euo pipefail
APP_DIR="${1:?uso: $0 apps/<app>}"
AND="$APP_DIR/android"
[ -d "$AND" ] || { echo "no existe $AND. corre 'npx expo prebuild --platform android' primero"; exit 1; }

# 1) gradle.properties: forzar Kotlin 1.9.25 + suppress check
if ! grep -q "android.kotlinVersion=1.9.25" "$AND/gradle.properties"; then
  cat >> "$AND/gradle.properties" <<'PROPS'

# Forzar Kotlin 1.9.25 para compatibilidad con Compose Compiler 1.5.15 (expo-modules-core)
android.kotlinVersion=1.9.25
kotlin.version=1.9.25
android.suppressKotlinVersionCompatibilityCheck=true
PROPS
  echo "  · gradle.properties parcheado"
fi

# 2) build.gradle root: classpath kotlin con versión + resolutionStrategy en subprojects
python3 - "$AND/build.gradle" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
s = s.replace(
  "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
  "classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}\")"
)
if "subprojects { sub ->" not in s:
  s = s.replace(
    'apply plugin: "com.facebook.react.rootproject"',
    'apply plugin: "com.facebook.react.rootproject"\n\n'
    '// Forzar Kotlin uniforme en todos los subprojects (incluido expo-modules-core)\n'
    'subprojects { sub ->\n'
    '    sub.configurations.all {\n'
    '        resolutionStrategy.eachDependency { details ->\n'
    '            if (details.requested.group == \'org.jetbrains.kotlin\') {\n'
    '                details.useVersion rootProject.ext.kotlinVersion\n'
    '            }\n'
    '        }\n'
    '    }\n'
    '}'
  )
open(p, "w").write(s)
print("  · build.gradle parcheado")
PY
echo "listo."
