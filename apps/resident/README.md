# KG-Visit — App de Residente (Expo)

Clon V2 de `com.kgvisit.app` en **Expo (React Native) + Expo Router**, consumiendo el **mismo Supabase**
que el portal admin. Spec completo en [`docs/12`](../../docs/12-app-residente.md); estado del clon en
[`docs/20`](../../docs/20-estado-clonamiento.md).

## Estado (v0 — scaffold / vertical slice)
Implementado: cliente Supabase + auth (login por correo/contraseña), gate de sesión, tab bar
(**Inicio · Visitas · Pánico · Perfil**), listado de visitas de la casa del residente (lectura real),
botón de pánico (inserta en `panic_alerts`).

Pendiente (ver `docs/12`): wizard de **Nueva visita**, pase/QR, visitantes frecuentes, empleados,
eventos, avisos, notificaciones, reservaciones, sugerencias, edición de perfil/contraseña.

## ⚠️ Requisito de backend
Las escrituras de residente (pánico, visitas, etc.) y la lectura acotada **dependen de la migración
[`0006_app_roles_rls.sql`](../../supabase/migrations/0006_app_roles_rls.sql)**, que habilita RLS por rol.
Hasta aplicarla, solo el admin puede escribir y no hay cuentas de auth para residentes.

## Correr
```bash
cd apps/resident
npm install          # o: npx expo install  (alinea versiones nativas)
npx expo start       # luego abrir en Expo Go / emulador (MuMu vía adb)
```
Credenciales en `app.json → expo.extra` (claves públicas de Supabase). Login con un usuario que tenga
cuenta de auth (hoy solo el admin demo; residentes tras aplicar 0006 + alta de cuentas).
