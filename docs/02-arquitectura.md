# 02 — Arquitectura técnica actual (V1)

## Diagrama lógico

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  App Residente (RN) │     │  App Caseta (RN)     │     │  Portal Admin (web)  │
│  com.kgvisit.app    │     │  com.kgvisit.guard   │     │  admin.kg-visit.com  │
└──────────┬──────────┘     └──────────┬───────────┘     └──────────┬───────────┘
           │ HTTPS                     │ HTTP (!)                   │ (Laravel SSR)
           ▼                           ▼                            ▼
   administracion.visitapp.io   tablets.visitapp.io        administracion.visitapp.io
        /api/v1, /api/v2-7-0       /api/v1, /api/v2-7-0          (back-office)
                          \            │            /
                           ▼           ▼           ▼
                        ┌──────────────────────────────┐
                        │ VisitApp — Phoenix/Elixir     │
                        │ Absinthe GraphQL + Postgres   │
                        └───────────────┬──────────────┘
                                        ▼
                          mega-visitapp.s3.amazonaws.com  (imágenes: fotos, placas)
```

## Componentes

### Frontend móvil
- **Framework**: React Native (bundle `assets/index.android.bundle`, vector-icons,
  MaterialIcons). minSdk 24, targetSdk 35–36.
- **Apps**: `com.kgvisit.app` (residente, v1.1), `com.kgvisit.guard` (caseta, v1.0.0).
- Empaquetado como white-label de VisitApp (los dominios y rutas de API son de `visitapp.io`).

### App EVR
- **Framework**: Capacitor/Ionic (Cordova bridge, `assets/public/` con build de Vite:
  `html2canvas`, `purify.es`, etc.). minSdk 22, targetSdk 34.

### Portal de administración
- **`admin.kg-visit.com`** — aplicación server-rendered en **Phoenix (Elixir)** (rutas
  `/admin/...`, `/root/...`). Cookie de sesión firmada `_visitapp_key` (formato Plug/Phoenix,
  ETF Erlang). Apunta al back-office de `administracion.visitapp.io`.

> **Corrección:** la primera hipótesis fue Laravel; la cookie `_visitapp_key=SFMyNTY...`
> (Base64 de `HS256` + términos Erlang) confirma **Phoenix/Elixir**.

### Backend / API
- **GraphQL (Absinthe sobre Phoenix)**. Endpoint `POST /api/v1` (y `/api/v2-7-0`).
  `RootQueryType` (~90 queries) y `RootMutationType` (~110 mutations). Ver `06-api-graphql.md`.
- **`administracion.visitapp.io`** — API principal (residentes/admin) y back-office.
- **`tablets.visitapp.io`** — API para la app de caseta (tablets). ⚠️ Servida por **HTTP** (confirmado).
- **`caseta.visitapp.io`** — assets/recursos de caseta.
- **Multi-tenant**: entidades `Residential` (configuración por comunidad), `Instance`/`InstanceLog`
  (instancias/tenants), parámetros `tenant`/`tennant` en queries.
- **Integraciones de hardware/terceros** (según flags de `Residential`): Hikvision, ZKTeco,
  Alocity (reconocimiento facial/control de acceso), LPR (lectura de placas), REPUVE
  (registro vehicular MX), Airbnb.

### Almacenamiento
- **AWS S3** — `mega-visitapp.s3.amazonaws.com`, con prefijo `/public/` para imágenes
  (fotos de perfil, placas, "imagen no disponible").

### Autenticación
- Flujo **OAuth** con códigos `kac.*` (callback observado a `localhost:17165/oauth/callback`).
  Servidor de autorización propio (probable "Kauil Auth").

## Dependencia crítica
Todo el sistema V1 depende de la infraestructura de un tercero (**VisitApp.io**). KG-Visit
no controla el backend, la base de datos ni el bucket S3. Esto es el principal motivador
para construir V2 con stack propio.

## Inventario de artefactos analizados
- APKs extraídas de MuMuPlayer Pro (2 instancias, dispositivos `127.0.0.1:5555` y `emulator-5554`):
  - `com.kgvisit.app` — base.apk (~26.6 MB)
  - `com.kgvisit.guard` — base.apk (~25.6 MB)
  - `com.kauilgroup.evr` — base.apk (~7.2 MB)
- Bundles JS RN y assets web (EVR) extraídos para análisis estático de endpoints.
