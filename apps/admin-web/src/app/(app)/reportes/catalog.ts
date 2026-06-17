// Catálogo de los 14 sub-reportes del hub de Reportes.
// Compartido por la tarjeta (page.tsx) y la ruta dinámica ([slug]/page.tsx).
// Mantener este orden de grupos para la presentación.

export type ReportGroup = "Accesos" | "Seguridad" | "Operación" | "Comunidad";

export const REPORT_GROUPS: ReportGroup[] = ["Accesos", "Seguridad", "Operación", "Comunidad"];

export interface ReportMeta {
  slug: string;
  title: string;
  description: string;
  group: ReportGroup;
}

export const REPORTS_CATALOG: ReportMeta[] = [
  // ── Accesos ──────────────────────────────────────────────────────────────
  { slug: "by-guard",      title: "Visitas por guardia",       description: "Accesos registrados por cada usuario de seguridad.", group: "Accesos" },
  { slug: "house-visits",  title: "Visitas por domicilio",     description: "Ranking de unidades con más accesos.",              group: "Accesos" },
  { slug: "visits-inside", title: "Visitas por estatus",       description: "Distribución de visitas según su estatus actual.",  group: "Accesos" },
  { slug: "by-plate",      title: "Visitas por placa",         description: "Accesos asociados a una placa vehicular.",          group: "Accesos" },
  { slug: "qr-visits",     title: "Visitas con QR",            description: "Accesos generados mediante código QR.",            group: "Accesos" },
  { slug: "event-visits",  title: "Visitas de evento",         description: "Invitados de eventos con QR.",                     group: "Accesos" },
  // ── Seguridad ────────────────────────────────────────────────────────────
  { slug: "autos",         title: "Autos y placas",            description: "Vehículos registrados y su lista.",                group: "Seguridad" },
  { slug: "incidentes",    title: "Incidentes",                description: "Reportes e incidencias de visitas.",               group: "Seguridad" },
  // ── Operación ────────────────────────────────────────────────────────────
  { slug: "total-qrs",     title: "Total de QRs",              description: "Usuarios con código QR asignado.",                 group: "Operación" },
  { slug: "shipping",      title: "Paquetería",                description: "Notificaciones de paquetes por unidad.",           group: "Operación" },
  { slug: "app-use",       title: "Uso de la aplicación",      description: "Colonos activados y usando la app.",               group: "Operación" },
  { slug: "active-users",  title: "Usuarios activos",          description: "Usuarios con cuenta activa.",                      group: "Operación" },
  { slug: "deleted-users", title: "Usuarios eliminados",       description: "Usuarios dados de baja.",                          group: "Operación" },
  // ── Comunidad ────────────────────────────────────────────────────────────
  { slug: "notices",       title: "Avisos",                    description: "Comunicados publicados a la comunidad.",            group: "Comunidad" },
];

export const REPORT_SLUGS = REPORTS_CATALOG.map((r) => r.slug);
