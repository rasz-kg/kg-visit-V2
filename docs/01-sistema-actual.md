# 01 — Sistema actual (V1)

Sistema de **control de acceso y gestión de visitantes** para comunidades residenciales
(fraccionamientos). Gestiona el ingreso de visitas, servicios, empleados y vehículos a
través de una caseta de vigilancia, con un portal de administración y apps móviles para
residentes y guardias.

## Actores

- **Administrador** — gestiona la comunidad desde el portal web (`Administrador General`).
- **Colono / Residente** — usa la app móvil para autorizar visitas, generar pases/QR, etc.
- **Guardia / Caseta** — usa la app de caseta para registrar entradas/salidas, validar
  visitas y placas.

## Módulos del portal de administración (`admin.kg-visit.com`)

| Módulo | Ruta | Función |
|--------|------|---------|
| Dashboard | `/admin/dashboard` | KPIs y gráficas: total de visitas, domicilios, visitantes, colonos activados, colonos usando app, horas pico, tipos de visita, últimas placas |
| Usuarios | `/admin/users-dashboard` | Gestión de usuarios del sistema |
| Departamentos | `/admin/houses` | Domicilios/unidades. Estados: morosidad, recibiendo visitas, licencia. Categorías: Terrenos, Terrenos en construcción, Residencias, Activadas |
| Reportes | `/admin/reports-dashboard` | Reportería de accesos/visitas |
| Avisos | `/notces` *(sic)* | Comunicados a residentes |
| Configuración | `/admin/configuration-dashboard` | Configuración de la comunidad |
| Autos | `/admin/cars` | Registro/control de vehículos y placas |

Rutas privilegiadas observadas: `/root/houses/{id}/defaulter` (marcar morosidad),
prefijo `/root/` para acciones administrativas elevadas.

### Métricas del entorno inspeccionado
- Total de Domicilios: **8**
- Total de Visitantes: **60**
- Colonos activados / usando App: **8 / 8**
- Tipos de Servicios: **7**
- Clasificación de visitas: **Servicio, Empleados, Visitantes, Residentes**

## Apps móviles

### App de residentes — `com.kgvisit.app` (React Native, v1.1)
Permite al colono gestionar sus visitas, generar autorizaciones de acceso, recibir
avisos. Backend: `administracion.visitapp.io/api/v1` y `/api/v2-7-0`.

### App de caseta / guardia — `com.kgvisit.guard` (React Native, v1.0.0)
Usada en la caseta para registrar y validar accesos, capturar placas/fotos, consultar
visitas autorizadas. Backend: `tablets.visitapp.io/api/v1` y `/api/v2-7-0`.

### App EVR — `com.kauilgroup.evr` (Capacitor/Ionic, v1.0)
Producto relacionado de Kauil Group (a confirmar su rol dentro del ecosistema).

## Funcionalidad núcleo a replicar

1. **Gestión de domicilios** (alta/edición, estados, licencia/cobranza, categorías).
2. **Gestión de residentes** y activación de su app.
3. **Autorización de visitas** por el residente (visita única, frecuente, QR/pase).
4. **Registro de accesos en caseta** (entrada/salida, captura de placa y foto, validación).
5. **Clasificación de visitas** (servicio, empleados, visitantes, residentes).
6. **Control vehicular** (placas, últimas placas registradas).
7. **Avisos / comunicados** a la comunidad.
8. **Reportería** y **dashboard** de métricas.
9. **Gestión de usuarios** y roles (admin, guardia).

> Pendiente: crawl detallado de cada formulario/campo de cada módulo para replicar el
> modelo de datos completo (ver plan de Fase 1).
