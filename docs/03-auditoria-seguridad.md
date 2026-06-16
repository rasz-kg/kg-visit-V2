# 03 — Auditoría de seguridad (V1)

> **Alcance y ética.** Hallazgos obtenidos mediante **análisis estático** de las APKs
> (propiedad del cliente, instaladas en MuMuPlayer) y **navegación de lectura** del portal
> de administración con una sesión ya iniciada por el propietario. **No** se ha realizado
> testing intrusivo (explotación, fuzzing, inyección) contra el sistema en producción.
> Los hallazgos marcados *POR VERIFICAR* requieren autorización explícita y, de preferencia,
> un entorno de staging antes de probarse.

## Resumen de hallazgos

> **Actualización (verificación activa autorizada, no destructiva):** varios hallazgos se
> confirmaron vía `curl`/introspección sin modificar datos. El bucket S3 resultó **no** público.

| # | Severidad | Estado | Hallazgo |
|---|-----------|--------|----------|
| V-08 | 🔴 Alta | **Confirmado** | **Introspección de GraphQL habilitada en producción** → todo el esquema (modelo + operaciones) es público sin autenticación |
| V-01 | 🔴 Alta | **Confirmado** | App de caseta usa **HTTP en texto plano** (`http://tablets.visitapp.io`); responde 200 sin redirigir a HTTPS |
| V-02 | 🟠 Media-Alta | Por verificar | Posible **IDOR** en rutas `/root/houses/{id}/...` con IDs enteros secuenciales |
| V-10 | 🟠 Media | **Confirmado** | **Sin HSTS ni CSP** en ningún host; cookie `_visitapp_key` **sin `Secure` ni `SameSite`** |
| V-09 | 🟠 Media | **Confirmado** | **nginx 1.10.3 (Ubuntu)** — versión de ~2017, fuera de soporte / sin parches |
| V-04 | 🟠 Media | Confirmado | **Dependencia total de un tercero** (VisitApp.io); sin código fuente, sin IaC, sin backups propios |
| V-05 | 🟡 Media | Confirmado | Sesión de **Administrador General** persistente en navegador (sin expiración aparente) |
| V-06 | 🟡 Baja | Por verificar | Versionado de API inconsistente (`v1` y `v2-7-0`); posibles endpoints legacy sin protección |
| V-03 | 🟢 Baja | **Mitigado** | Bucket S3: **listado denegado (AccessDenied)** y objeto `/public/*` → **403**; no es público |
| V-07 | 🟢 Calidad | Confirmado | Ruta con typo `/notces`; inconsistencias menores de UX |

## Detalle

### V-01 — Tráfico en texto plano (caseta) 🔴
La app `com.kgvisit.guard` referencia `http://tablets.visitapp.io/api/v1` y `http://visitapp.io`.
La caseta transmite datos de accesos (placas, fotos, identidad de visitantes y residentes)
y muy probablemente tokens de sesión **sin cifrar**, expuestos a intercepción en la red local
de la caseta (MITM, sniffing Wi-Fi).
**Recomendación V2:** forzar HTTPS/TLS en todo endpoint, HSTS, `cleartextTrafficPermitted=false`
en `network_security_config`, certificate pinning en apps.

### V-02 — Posible IDOR en rutas privilegiadas 🟠
Rutas observadas: `/root/houses/33/defaulter`, `/root/houses/36/defaulter`, `/root/houses/31/defaulter`.
Usan **identificadores enteros secuenciales** en acciones administrativas. Si la autorización
por objeto es deficiente, un usuario podría manipular domicilios ajenos cambiando el ID.
**Por verificar** (solo con autorización y/o staging): comprobar control de acceso por objeto.
**Recomendación V2:** IDs no adivinables (UUID/ULID), autorización por recurso (policies/RLS).

### V-03 — Exposición de almacenamiento S3 🟠
`mega-visitapp.s3.amazonaws.com/public/` sugiere objetos servidos públicamente. Las fotos de
visitantes/placas son **datos personales**; si el bucket permite listado o las URLs son
adivinables, hay riesgo de fuga de PII.
**Por verificar:** política del bucket, listado, ACLs.
**Recomendación V2:** almacenamiento privado con URLs firmadas y expiración corta.

### V-04 — Dependencia de tercero y falta de soberanía de datos 🟠
KG-Visit no controla backend, base de datos ni almacenamiento (todo en VisitApp.io). No hay
código fuente versionado ni infraestructura como código. Riesgo de continuidad de negocio,
imposibilidad de auditar el manejo de datos personales y falta de backups propios.
**Recomendación V2:** backend e infraestructura propios; este repo como única fuente de verdad.

### V-05 — Gestión de sesión del portal 🟡
La sesión de administrador permanece activa de forma prolongada en el navegador.
**Recomendación V2:** expiración de sesión, re-autenticación para acciones sensibles, MFA para admins.

### V-06 — Superficie de API legacy 🟡
Conviven `/api/v1` y `/api/v2-7-0`. Endpoints antiguos suelen quedar sin las protecciones nuevas.
**Recomendación V2:** una sola versión soportada, deprecación explícita, gateway con rate-limiting.

### V-08 — Introspección de GraphQL abierta en producción 🔴
`POST administracion.visitapp.io/api/v1` responde a la query `__schema` sin autenticación,
exponiendo **todo el modelo de datos y todas las operaciones** (~90 queries, ~110 mutations).
Esto facilita enormemente el reconocimiento de un atacante (incluido el mapeo de mutations
sensibles como `passwordUserForAdmin`, `blacklistPlate`, `deleteHouseForAdmin`).
**Recomendación V2:** deshabilitar introspección en producción, exigir auth en todo el endpoint,
persisted queries / allowlist, rate-limiting y profundidad/complejidad máxima de query.

### V-09 — Servidor web obsoleto 🟠
`Server: nginx/1.10.3 (Ubuntu)` (≈2017, Ubuntu 16.04). Fuera de soporte: vulnerabilidades
conocidas sin parchear y TLS/ciphers anticuados.
**Recomendación V2:** infraestructura administrada/actualizada (o nginx LTS reciente), parches automáticos.

### V-10 — Cabeceras de seguridad y cookie 🟠
No hay `Strict-Transport-Security` (HSTS) ni `Content-Security-Policy` (CSP) en ninguno de los
hosts. La cookie de sesión `_visitapp_key` es `HttpOnly` (bien) pero **carece de `Secure` y
`SameSite`** → puede viajar por HTTP (ver V-01) y es más expuesta a CSRF.
**Recomendación V2:** HSTS con preload, CSP estricta, cookies `Secure`+`SameSite=Lax/Strict`,
y `cleartextTrafficPermitted=false` en las apps.

## Vulnerabilidades a revisar en la fase intrusiva (requiere autorización)
- AuthZ por objeto (IDOR) en todas las rutas `/root/*` y `/admin/*`.
- AuthN: fortaleza de tokens `kac.*`, expiración, refresh, posibilidad de replay.
- Inyección (SQLi) y XSS en formularios del portal (búsquedas, alta de domicilios/usuarios).
- Rate limiting / fuerza bruta en login y endpoints de la API.
- Configuración del bucket S3 y URLs firmadas.
- Validación de placas/fotos subidas desde caseta (tipo, tamaño, SSRF en procesamiento de imágenes).
