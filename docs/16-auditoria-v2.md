# Auditoría de salud de rutas — KG-Visit V2 (admin-web)

> Fecha: 2026-06-16 · Alcance: todas las rutas del portal admin V2.
> Método: lectura estática de `page.tsx` + `*Client.tsx` + `actions.ts` de cada ruta,
> más los catálogos declarativos (`nav.ts`, `entities.ts`, `sections.ts`, `reportes/catalog.ts`).
> Se asume que `npm run build` pasa; el foco es **completitud funcional**, no compilación.

## Arquitectura de datos (contexto)

- **`isSupabaseConfigured`** (`src/lib/supabase/config.ts`) decide si la app lee de Supabase o degrada a demo.
- **`src/lib/data.ts`**: capa de lectura con patrón "Supabase real con *fallback* a `mock.ts`". Null-safe, nunca lanza.
- **`src/lib/mock.ts`**: datos demo en memoria (se usan solo cuando faltan envs **o** para las páginas que importan `mock` directamente).
- **Motor declarativo** (`/m/[entity]`): `entities.ts` (def) + `crud.ts` (lectura) + `m/[entity]/actions.ts` (escritura) + `EntityClient.tsx` (UI genérica con CRUD/toggle/delete completo y *tenant scoping*).
- **Reportes** (`/reportes/[slug]`): `catalog.ts` (14 metadatos) + `queries.ts` (14 lecturas reales a Supabase, mismo patrón de degradación que `data.ts`).

Distinción clave de "Fuente de datos":
- **Supabase (real)** = `data.ts`/`queries.ts`/`crud.ts` → leen de Supabase cuando hay envs, con *fallback* a demo.
- **mock (directo)** = la `page.tsx` importa `@/lib/mock` directamente y **nunca** consulta Supabase, ni siquiera con envs configuradas. Son las que deben migrarse.

## Tabla de rutas

| Ruta | Tipo | Datos | Escritura | Estado | Notas |
|---|---|---|---|---|---|
| `/` | redirect | — | — | ✅ | `redirect("/dashboard")`. |
| `/login` | bespoke (auth) | Supabase Auth (real) | sí (signIn) | ✅ | `signInWithPassword`; en modo demo entra directo. |
| `/dashboard` | bespoke lectura-real (parcial) | Supabase (real) KPIs + visitas; **estático** gráficas | no | 🟡 | KPIs (`getDashboardStats`) y "Visitas recientes" (`getVisits`) reales. "Horas pico" y "Tipos de visita" son arreglos **hardcodeados** (`peak`, `visitTypes`). |
| `/visitas` | bespoke con CRUD | Supabase (real) vía `getVisits` | sí (5 acciones) | 🟡 | Acciones de fila reales (autorizar/dar acceso/salida/paquetería/reportar). **3 botones del header sin handler** (QR Auto, QR Caminando, Nueva visita). Existe `denyVisit` en actions pero **no hay botón "Denegar"** que lo invoque. |
| `/departamentos` | bespoke con CRUD | Supabase (real) vía `getHouses` | sí (CRUD completo) | ✅ | Crear/editar/eliminar (soft-delete) + toggle moroso. Bien cableado. |
| `/autos` | bespoke lectura-real | Supabase (real) vía `getPlates` | **no** | 🟡 | Tabla lee datos reales, pero **"Leer placa (LPR)" y "Nueva placa" sin handler**. Sin alta/edición/baja. |
| `/usuarios` | bespoke lectura-real (hub) | Supabase (real) vía `getPeople` | no (solo navegación) | ✅ | Hub con conteos reales por sección; enlaza a `/usuarios/[seccion]`. |
| `/usuarios/[seccion]` | bespoke con CRUD | Supabase (real) vía `getPeople` | sí (CRUD completo) | ✅ | 5 secciones (admins/supervisores/colaboradores/guardias/visitantes). Crear/editar/toggle/delete reales, *tenant scoping* + rol. |
| `/lista-negra` | estático/demo | **mock (directo)** | no | 🔴 | Importa `plates` de `@/lib/mock` y un arreglo `blockedVisitors` hardcodeado en el archivo. Nunca consulta Supabase. Solo lectura. |
| `/avisos` | estático/demo | **mock (directo)** | **no** | 🔴 | Importa `notices` de `@/lib/mock`. Botón "Nuevo aviso" sin handler. Sin actions. (La tabla `notices` sí existe y se consulta en el reporte de avisos.) |
| `/sugerencias` | estático/demo | **mock (directo)** | no | 🔴 | Importa `tickets` de `@/lib/mock`. Solo lectura, sin acciones de cambio de estatus. |
| `/sedes` | estático/demo | **mock (directo)** | **no** | 🔴 | Importa `sites` de `@/lib/mock`. Botón "Nueva sede" sin handler. Sin actions. |
| `/reportes` | bespoke (hub) | estático (catálogo) | no | ✅ | Hub de 14 reportes desde `catalog.ts`; navegación a `[slug]`. Correcto por diseño. |
| `/reportes/[slug]` | bespoke lectura-real | Supabase (real) vía `queries.ts` | no (solo lectura + filtro fechas) | ✅ | Los 14 slugs mapean a queries reales con filtro de rango por GET. Degrada a vacío sin Supabase. |
| `/configuracion` | bespoke con CRUD | Supabase (real) `residentials` | sí (`saveConfig`) | ✅ | Lee columnas tipadas + `settings` jsonb; guarda con *merge* no destructivo. |
| `/configuracion/campos` | bespoke con CRUD | Supabase (real) `visit_field_configs` | sí (CRUD completo) | ✅ | Campos dinámicos del formulario de visita: crear/editar/toggle visible+required/eliminar. Tabla no tipada (cast en el borde) pero funcional. |
| `/m/[entity]` (motor) | motor declarativo | Supabase (real) vía `crud.ts` | sí (CRUD+toggle+delete) | ✅ | 8 entidades. Save (insert/update con `residential_id`), toggle status, delete (hard/soft según `softDelete`). Todo genérico y completo. |

### Entidades del motor `/m/[entity]` (todas ✅, mismo engine)

`servicios`, `transportes`, `proveedores`, `espacios` (amenidades), `casetas`, `camaras`, `etiquetas`, `categorias-ticket`, `incidentes`.
Todas comparten el CRUD real de `m/[entity]/actions.ts`. Estado: ✅ (10 rutas navegables; en `nav.ts` se enlazan 9, las restantes son alcanzables por URL/listado).

## Conteo

- **Rutas/vistas auditadas: 17** plantillas de ruta (incluye `/`, `/login`, dinámicas y el motor). Si se expanden las dinámicas a destinos concretos del nav: 8 entidades de `/m/*` + 5 secciones de `/usuarios/*` + 14 reportes de `/reportes/*`.
- A nivel de **plantilla de ruta**:
  - ✅ Funcionales: **11** (`/`, `/login`, `/departamentos`, `/usuarios`, `/usuarios/[seccion]`, `/reportes`, `/reportes/[slug]`, `/configuracion`, `/configuracion/campos`, `/m/[entity]`, y por extensión las 8 entidades del motor).
  - 🟡 Parciales: **3** (`/dashboard`, `/visitas`, `/autos`).
  - 🔴 Stub/estático demo: **4** (`/lista-negra`, `/avisos`, `/sugerencias`, `/sedes`).

## Pendientes priorizados

### P0 — Rutas con `mock` directo que deben pasar a datos reales + acciones

1. **`/avisos` → datos reales + alta.** La tabla `notices` ya se consulta en `queries.ts` (`reportNotices`). Crear `getNotices()` en `data.ts`, una `actions.ts` con `createNotice/deleteNotice` (con `residential_id`), y cablear "Nuevo aviso". Es la de mayor valor: hoy es 100% demo y tiene botón muerto.
2. **`/sugerencias` → datos reales + cambio de estatus.** Migrar `tickets` mock a lectura real (tabla de tickets/quejas) y agregar acción de cambio de estatus (open → in_progress → resolved/closed). Hoy es solo lectura mock.
3. **`/lista-negra` → datos reales.** Derivar placas vetadas de la tabla `plates` (lista `blacklist/graylist/report`) vía `data.ts`, y visitantes vetados de `visitors`/`incidents` en vez del arreglo hardcodeado `blockedVisitors`. Idealmente acción para vetar/quitar de lista.
4. **`/sedes` → datos reales + alta.** Migrar `sites` mock a la tabla real (sedes/residenciales-hijas) y cablear "Nueva sede". Hoy demo total con botón muerto.

### P1 — Rutas reales con UI incompleta (botones sin handler / acciones faltantes)

5. **`/autos` → alta/edición de placas + LPR.** La lectura es real pero faltan create/update/delete; los botones "Nueva placa" y "Leer placa (LPR)" no hacen nada. Convendría darle CRUD (incluso reusando el motor declarativo o un client bespoke + `actions.ts`).
6. **`/visitas` → completar header y añadir "Denegar".** Cablear "Nueva visita", "QR Auto" y "QR Caminando" (o retirarlos si aún no aplican). Añadir botón **Denegar** que invoque la acción `denyVisit` ya existente (la action está pero no hay UI que la dispare).
7. **`/dashboard` → gráficas reales.** "Horas pico" (`peak`) y "Tipos de visita" (`visitTypes`) son constantes hardcodeadas. Calcularlas desde `visits` reales (agregación por hora y por `kind`).

### P2 — Chrome / cosméticos (fuera del set de rutas)

8. **Buscador global del shell** (`src/components/shell.tsx`, "Buscar visitas, placas, domicilios…") es un `<input>` sin `onChange`/handler. Decorativo hoy.

## Veredicto general de salud

**Salud buena y consistente en el núcleo transaccional.** El motor declarativo (`/m/*`, 8 entidades), Usuarios, Departamentos, Configuración (incl. campos dinámicos) y Reportes están **correctamente cableados a Supabase con escritura real**, *tenant scoping* por `residential_id` y degradación segura a demo. No se detectaron imports rotos ni acciones referenciadas inexistentes; la arquitectura (capa de datos + server actions + clientes con `useTransition` + `router.refresh()`) es uniforme y sólida.

El **techo de deuda** está en cuatro pantallas "de catálogo/comunidad" que siguen leyendo de `@/lib/mock` directamente (`/avisos`, `/sugerencias`, `/lista-negra`, `/sedes`) y en tres pantallas reales pero con UI a medio cablear (`/autos`, `/visitas` header, `/dashboard` gráficas). Ninguna rompe la app —degradan a demo o muestran datos estáticos— pero impiden declarar el portal "100% funcional con datos reales".

**Prioridad recomendada:** atacar primero `/avisos` y `/sugerencias` (alto valor de comunidad, hoy 100% demo con botones muertos), luego `/lista-negra` y `/sedes`, después CRUD de `/autos` y el botón "Denegar" + header de `/visitas`, y finalmente las gráficas reales del dashboard.
