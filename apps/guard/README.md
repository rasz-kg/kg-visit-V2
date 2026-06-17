# KG-Visit — App de Caseta / Guardia (Expo)

Clon V2 de `com.kgvisit.guard` en **Expo (React Native) + Expo Router**, consumiendo el **mismo Supabase**
que el portal admin y la app de residente. Spec completo en [`docs/13`](../../docs/13-app-caseta.md);
estado del clon en [`docs/20`](../../docs/20-estado-clonamiento.md).

## Estado (v0 — scaffold / vertical slice)
Implementado: cliente Supabase + auth (login por correo/contraseña), gate de sesión,
**selección de caseta** (persistida en AsyncStorage), **pantalla principal** (listado de visitas del día
con buscador, filtros de Tipo/Status y barra superior oscura) y **acciones por fila** sobre Supabase real:
`pending`→Autorizar/Denegar, `authorized`→Dar acceso (`inside` + `enter_date`), `inside`→Salida
(`finished` + `leave_date`), y **Reportar** (`guard_report=true`) en cualquier estado. Menú con
**Cambiar caseta** y **Cerrar sesión**.

Stubs etiquetados (sin backend aún): **QR Auto / QR Caminando** (alerta "desde cámara"). Pendiente
(ver `docs/13`): wizard de **Nueva visita** (LPR/REPUVE/foto), detalle de visita, cámaras, pánico y chat.

## ⚠️ Requisito de backend
Las escrituras del guardia (cambiar `status`, marcar entrada/salida, reportar) y la lectura del listado
**dependen de la migración [`0006_app_roles_rls.sql`](../../supabase/migrations/0006_app_roles_rls.sql)**,
que habilita RLS por rol (lectura del tenant + escritura de visitas/incidentes para el guardia).

## Correr
```bash
cd apps/guard
npm install          # o: npx expo install  (alinea versiones nativas)
npx expo start       # luego abrir en Expo Go / emulador (MuMu vía adb)
```
Credenciales en `app.json → expo.extra` (claves públicas de Supabase). Cuenta demo de guardia:
`guardia@kg-demo.mx` / `KgVisit2026!`.
