import {
  Wrench, Truck, Building, MapPin, ShieldCheck, Video, Tag, Tags, AlertTriangle,
  CalendarDays, BookOpenCheck, UserCog, MessageSquare, type LucideIcon,
} from "lucide-react";

// Motor declarativo: cada entidad se define una vez y el engine genérico
// (lista + alta/edición/baja) la renderiza en /m/[entity]. DRY y configurable.

export type FieldType = "text" | "number" | "boolean" | "select" | "date" | "textarea" | "phone" | "fk";

export interface EntityField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
  /** Para type="fk": configura la relación. */
  fk?: {
    table: string;
    labelKey: string;
    /** Filtro extra opcional (p.ej. status=true o role=admin). */
    filter?: { col: string; val: string | number | boolean };
  };
}

export interface EntityColumn {
  key: string;
  label: string;
  kind?: "text" | "bool" | "money" | "date";
}

export interface EntityDef {
  key: string;
  label: string;       // plural
  singular: string;
  table: string;
  group: string;
  icon: LucideIcon;
  columns: EntityColumn[];
  fields: EntityField[];
  searchKeys: string[];
  hasStatus?: boolean; // columna `status` boolean → toggle activar/desactivar
  softDelete?: boolean; // si la tabla tiene columna `deleted`
}

export const ENTITIES: Record<string, EntityDef> = {
  servicios: {
    key: "servicios", label: "Servicios", singular: "servicio", table: "services",
    group: "Catálogos", icon: Wrench, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "has_details", label: "Pide detalles", kind: "bool" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "has_details", label: "Solicita detalles", type: "boolean" },
    ],
  },
  transportes: {
    key: "transportes", label: "Transportes", singular: "transporte", table: "transports",
    group: "Catálogos", icon: Truck, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "plates", label: "Usa placas", kind: "bool" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "plates", label: "Requiere placas", type: "boolean" },
    ],
  },
  proveedores: {
    key: "proveedores", label: "Proveedores", singular: "proveedor", table: "providers",
    group: "Catálogos", icon: Building, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "logo", label: "Logo" }],
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "logo", label: "URL del logo", type: "text" },
    ],
  },
  espacios: {
    key: "espacios", label: "Amenidades", singular: "amenidad", table: "spaces",
    group: "Comunidad", icon: MapPin, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "price", label: "Precio", kind: "money" }, { key: "guests_limit", label: "Aforo" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "price", label: "Precio", type: "number" },
      { key: "deposit", label: "Depósito", type: "number" },
      { key: "guests_limit", label: "Aforo (invitados)", type: "number" },
      { key: "pay", label: "Requiere pago", type: "boolean" },
      { key: "qr_access", label: "Acceso por QR", type: "boolean" },
      { key: "facial_access", label: "Acceso facial", type: "boolean" },
    ],
  },
  casetas: {
    key: "casetas", label: "Casetas", singular: "caseta", table: "security_booths",
    group: "Configuración", icon: ShieldCheck, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "main", label: "Principal", kind: "bool" }, { key: "printer", label: "Impresora", kind: "bool" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "channel", label: "Canal", type: "text" },
      { key: "main", label: "Es caseta principal", type: "boolean" },
      { key: "printer", label: "Tiene impresora", type: "boolean" },
      { key: "double_check", label: "Doble verificación", type: "boolean" },
    ],
  },
  camaras: {
    key: "camaras", label: "Cámaras IP", singular: "cámara", table: "cameras",
    group: "Configuración", icon: Video, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "camera_type", label: "Tipo" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "kind", label: "Uso", type: "select", options: [
        { value: "entrada", label: "Entrada" }, { value: "salida", label: "Salida" }, { value: "lpr", label: "LPR (placas)" },
      ] },
      { key: "camera_type", label: "Marca/Tipo", type: "select", options: [
        { value: "hikvision", label: "Hikvision" }, { value: "axis", label: "Axis" }, { value: "zkteco", label: "ZKTeco" }, { value: "other", label: "Otra" },
      ] },
      { key: "url", label: "URL/RTSP", type: "text" },
      { key: "automatic", label: "Captura automática", type: "boolean" },
    ],
  },
  etiquetas: {
    key: "etiquetas", label: "Etiquetas (TAGs)", singular: "TAG", table: "tags",
    group: "Catálogos", icon: Tag, hasStatus: true, searchKeys: ["tag_number", "car", "plates"],
    columns: [{ key: "tag_number", label: "TAG" }, { key: "car", label: "Auto" }, { key: "plates", label: "Placas" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "tag_number", label: "Número de TAG", type: "text", required: true },
      { key: "car", label: "Vehículo", type: "text" },
      { key: "plates", label: "Placas", type: "text" },
      { key: "kind", label: "Tipo", type: "text" },
    ],
  },
  "categorias-ticket": {
    key: "categorias-ticket", label: "Categorías de tickets", singular: "categoría", table: "ticket_categories",
    group: "Comunidad", icon: Tags, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [{ key: "name", label: "Nombre", type: "text", required: true }],
  },
  incidentes: {
    key: "incidentes", label: "Incidentes", singular: "incidente", table: "incidents",
    group: "Comunidad", icon: AlertTriangle, softDelete: false, searchKeys: ["reason"],
    columns: [{ key: "reason", label: "Motivo" }, { key: "blacklist", label: "Lista negra", kind: "bool" }, { key: "created_at", label: "Fecha", kind: "date" }],
    fields: [
      { key: "reason", label: "Motivo", type: "textarea", required: true },
      { key: "blacklist", label: "Agregar a lista negra", type: "boolean" },
    ],
  },
  // ---- Módulos nuevos (Fase 3) -----------------------------------------
  eventos: {
    key: "eventos", label: "Eventos", singular: "evento", table: "events",
    group: "Comunidad", icon: CalendarDays, searchKeys: ["name", "folio"],
    columns: [
      { key: "name", label: "Nombre" },
      { key: "folio", label: "Folio" },
      { key: "due_date", label: "Fecha", kind: "date" },
      { key: "open", label: "Abierto", kind: "bool" },
      { key: "cars", label: "Autos" },
    ],
    fields: [
      { key: "name", label: "Nombre del evento", type: "text", required: true },
      { key: "due_date", label: "Fecha y hora", type: "date" },
      { key: "open", label: "Evento abierto (sin lista de invitados)", type: "boolean" },
      { key: "cars", label: "Cupo de autos", type: "number" },
      { key: "house_id", label: "Domicilio", type: "fk", fk: { table: "houses", labelKey: "address" } },
      { key: "space_id", label: "Amenidad / espacio", type: "fk", fk: { table: "spaces", labelKey: "name" } },
    ],
  },
  reservaciones: {
    key: "reservaciones", label: "Reservaciones", singular: "reservación", table: "reservations",
    group: "Comunidad", icon: BookOpenCheck, searchKeys: ["reason"],
    columns: [
      { key: "start_date", label: "Inicio", kind: "date" },
      { key: "end_date", label: "Fin", kind: "date" },
      { key: "status", label: "Estatus" },
      { key: "price", label: "Precio", kind: "money" },
      { key: "paid", label: "Pagada", kind: "bool" },
    ],
    fields: [
      { key: "space_id", label: "Amenidad", type: "fk", required: true, fk: { table: "spaces", labelKey: "name" } },
      { key: "start_date", label: "Fecha de inicio", type: "date", required: true },
      { key: "end_date", label: "Fecha de fin", type: "date", required: true },
      { key: "reason", label: "Motivo / detalle", type: "textarea" },
      { key: "price", label: "Precio", type: "number" },
    ],
  },
  roles: {
    key: "roles", label: "Roles", singular: "rol", table: "rols",
    group: "Configuración", icon: UserCog, hasStatus: true, searchKeys: ["name"],
    columns: [{ key: "name", label: "Nombre" }, { key: "status", label: "Estatus", kind: "bool" }],
    fields: [
      { key: "name", label: "Nombre del rol", type: "text", required: true },
    ],
  },
  "respuestas-ticket": {
    key: "respuestas-ticket", label: "Respuestas de tickets", singular: "respuesta", table: "ticket_responses",
    group: "Comunidad", icon: MessageSquare, softDelete: false, searchKeys: ["message"],
    columns: [
      { key: "message", label: "Mensaje" },
      { key: "created_at", label: "Fecha", kind: "date" },
    ],
    fields: [
      { key: "ticket_id", label: "Ticket", type: "fk", required: true, fk: { table: "tickets", labelKey: "subject" } },
      { key: "user_id", label: "Autor (usuario)", type: "fk", required: true, fk: { table: "users", labelKey: "name" } },
      { key: "message", label: "Mensaje", type: "textarea", required: true },
    ],
  },
};

export const ENTITY_LIST = Object.values(ENTITIES);
export function getEntity(key: string): EntityDef | undefined {
  return ENTITIES[key];
}

/** Devuelve los campos FK de una entidad (utilidad para precargar opciones). */
export function getFkFields(def: EntityDef): EntityField[] {
  return def.fields.filter((f) => f.type === "fk" && f.fk);
}
