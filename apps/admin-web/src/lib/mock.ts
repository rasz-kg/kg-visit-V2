import type {
  House,
  User,
  Plate,
  Visit,
  Notice,
  Reservation,
  Ticket,
  ReportDef,
} from "./types";

// Datos demo en memoria. En producción se reemplazan por el cliente de Supabase.
// Alineados con /supabase/seed.sql.

export const houses: House[] = [
  { id: "1", address: "Cobra 101", cluster: "A", kind: "inhabited", paid: true, defaulter: false, receivingVisits: true, residents: 3, updatedAt: "2026-01-23T18:05:00Z" },
  { id: "2", address: "Empleado 1", cluster: "A", kind: "inhabited", paid: true, defaulter: false, receivingVisits: true, residents: 2, updatedAt: "2026-01-23T18:15:00Z" },
  { id: "3", address: "Escorpión 22", cluster: "B", kind: "inhabited", paid: true, defaulter: false, receivingVisits: true, residents: 4, updatedAt: "2026-01-23T18:05:00Z" },
  { id: "4", address: "Lote 14", cluster: "C", kind: "construction", paid: false, defaulter: true, receivingVisits: false, residents: 0, updatedAt: "2026-02-01T10:00:00Z" },
  { id: "5", address: "Terreno 7", cluster: "C", kind: "land", paid: false, defaulter: false, receivingVisits: false, residents: 0, updatedAt: "2026-02-01T10:00:00Z" },
];

export const users: User[] = [
  { id: "u1", name: "Administrador General", username: "admin", email: "admin@kg-demo.mx", role: "admin", status: true },
  { id: "u2", name: "Miguel López Araujo", username: "guardia", email: "guardia@kg-demo.mx", role: "guard", status: true },
  { id: "u3", name: "Supervisor Turno A", username: "supervisor", email: "sup@kg-demo.mx", role: "supervisor", status: true },
  { id: "u4", name: "Juan Pérez", username: "jperez", email: "jperez@kg-demo.mx", role: "resident", houseId: "1", status: true },
  { id: "u5", name: "RH Corporativo", username: "staff", email: "staff@kg-demo.mx", role: "staff", status: true },
];

export const plates: Plate[] = [
  { id: "p1", number: "ABC-12-34", state: "CDMX", brand: "Nissan", color: "Blanco", list: "none", resident: true },
  { id: "p2", number: "XYZ-98-76", state: "EdoMex", brand: "Mazda", color: "Gris", list: "none", resident: false },
  { id: "p3", number: "GKX-315-A", state: "Gto", brand: "Nissan", color: "Gris", list: "graylist", resident: false },
  { id: "p4", number: "ROB-00-99", state: "CDMX", brand: "VW", color: "Negro", list: "blacklist", resident: false },
];

export const visits: Visit[] = [
  { id: "v1", folio: "F-0001", kind: "visitor", status: "inside", title: "Visita familiar", who: "Aarón Wallet", houseAddress: "Cobra 101", site: "Sede Norte", plate: "XYZ-98-76", arriveDate: "2026-06-16T13:44:00Z", createdByGuard: true },
  { id: "v2", folio: "F-0002", kind: "service", status: "finished", title: "Visita de CFE — Corte de servicio", who: "CFE", houseAddress: "Escorpión 22", site: "Sede Norte", arriveDate: "2026-06-15T11:10:00Z", leaveDate: "2026-06-15T12:00:00Z" },
  { id: "v3", folio: "F-0003", kind: "provider", status: "authorized", title: "Proveedor — Paquetería", who: "Amazon", houseAddress: "Empleado 1", site: "Sede Norte", plate: "GKX-315-A", arriveDate: "2026-06-16T09:30:00Z" },
  { id: "v4", folio: "F-0004", kind: "employee", status: "pending", title: "Empleado doméstico", who: "Ana (limpieza)", houseAddress: "Cobra 101", site: "Sede Norte" },
  { id: "v5", folio: "F-0005", kind: "visitor", status: "denied", title: "Visita peatonal", who: "Desconocido", houseAddress: "Escorpión 22", site: "Sede Sur", walking: true },
];

export const notices: Notice[] = [
  { id: "n1", kind: "general", description: "Corte de agua programado: sábado 9:00–12:00 en todo el fraccionamiento.", status: "active", createdAt: "2026-06-12T08:00:00Z" },
  { id: "n2", kind: "payment", description: "Cuota de mantenimiento: vence el 30 de junio.", status: "active", createdAt: "2026-06-10T08:00:00Z" },
];

export const reservations: Reservation[] = [
  { id: "r1", space: "Salón de Eventos", user: "Juan Pérez", start: "2026-06-19T17:00:00Z", end: "2026-06-19T22:00:00Z", status: "pending", price: 1500 },
];

export const tickets: Ticket[] = [
  { id: "t1", subject: "Luminaria fundida", description: "Poste de la entrada principal sin luz.", category: "Mantenimiento", user: "Juan Pérez", status: "open", createdAt: "2026-06-14T20:00:00Z" },
  { id: "t2", subject: "Sugerencia de áreas verdes", description: "Agregar más jardineras en el parque central.", category: "Limpieza", user: "Vecino B", status: "in_progress", createdAt: "2026-06-13T20:00:00Z" },
];

// Los "15 reportes" mencionados en el brochure corporativo.
export const reports: ReportDef[] = [
  { id: "rep-accesos", name: "Accesos por periodo", description: "Entradas y salidas en el rango seleccionado.", group: "Accesos" },
  { id: "rep-visitas-tipo", name: "Visitas por tipo", description: "Servicio, empleados, visitantes, residentes.", group: "Accesos" },
  { id: "rep-horas-pico", name: "Horas pico", description: "Distribución de accesos por hora del día.", group: "Accesos" },
  { id: "rep-por-domicilio", name: "Visitas por domicilio", description: "Ranking de unidades con más visitas.", group: "Accesos" },
  { id: "rep-por-caseta", name: "Actividad por caseta", description: "Accesos gestionados en cada caseta.", group: "Accesos" },
  { id: "rep-por-guardia", name: "Productividad por guardia", description: "Accesos por usuario de seguridad.", group: "Seguridad" },
  { id: "rep-incidentes", name: "Incidentes reportados", description: "Reportes de visitas e incidencias.", group: "Seguridad" },
  { id: "rep-panico", name: "Alertas de pánico", description: "Historial de botones de pánico.", group: "Seguridad" },
  { id: "rep-lista-negra", name: "Lista negra", description: "Autos y visitantes vetados.", group: "Seguridad" },
  { id: "rep-placas", name: "Lecturas de placas (LPR)", description: "Reconocimiento de placas y REPUVE.", group: "Seguridad" },
  { id: "rep-paqueteria", name: "Paquetería", description: "Notificaciones de paquetes por unidad.", group: "Operación" },
  { id: "rep-morosos", name: "Morosidad", description: "Unidades con adeudo y bloqueos.", group: "Cobranza" },
  { id: "rep-reservaciones", name: "Reservaciones de amenidades", description: "Uso y pagos de espacios.", group: "Operación" },
  { id: "rep-sugerencias", name: "Sugerencias y quejas", description: "Tickets de la comunidad por estatus.", group: "Comunidad" },
  { id: "rep-uso-app", name: "Adopción de la app", description: "Colonos activados y usando la app.", group: "Operación" },
];

export const sites = [
  { id: "s1", name: "Sede Norte", booths: 2, houses: 3 },
  { id: "s2", name: "Sede Sur", booths: 1, houses: 2 },
];

export const booths = [
  { id: "b1", name: "Caseta Principal", site: "Sede Norte", main: true, printer: true, status: true },
  { id: "b2", name: "Caseta Virtual Peatonal", site: "Sede Norte", main: false, printer: false, status: true },
  { id: "b3", name: "Salida Principal", site: "Sede Sur", main: false, printer: false, status: true },
];

export const services = [
  { id: "sv1", name: "Paquetería", hasDetails: true, status: true },
  { id: "sv2", name: "Gas", hasDetails: false, status: true },
  { id: "sv3", name: "Agua", hasDetails: false, status: true },
  { id: "sv4", name: "Comida a domicilio", hasDetails: false, status: true },
  { id: "sv5", name: "Mantenimiento", hasDetails: true, status: true },
  { id: "sv6", name: "Jardinería", hasDetails: false, status: true },
  { id: "sv7", name: "Mensajería", hasDetails: false, status: true },
];
