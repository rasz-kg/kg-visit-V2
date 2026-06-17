// Modelo de dominio KG-Visit V2 (derivado de docs/05-modelo-datos.md)
// Tipos compartidos por toda la app web. Alineados al esquema en /supabase.

export type Role = "admin" | "supervisor" | "staff" | "guard" | "resident";

export type HouseKind = "land" | "construction" | "build" | "inhabited" | "rent";

export type VisitKind = "visitor" | "employee" | "service" | "resident" | "provider" | "event";

export type VisitStatus =
  | "pending"
  | "authorized"
  | "denied"
  | "inside"
  | "finished"
  | "canceled"
  | "expired";

export type PlateList = "none" | "blacklist" | "graylist" | "report" | "recuperate";

/** Modo de operación del tenant: define etiquetas/flujos (residencial vs corporativo). */
export type TenantMode = "residential" | "corporate" | "industrial";

export interface House {
  id: string;
  address: string;
  cluster?: string;
  phone?: string;
  kind: HouseKind;
  paid: boolean;
  defaulter: boolean;
  receivingVisits: boolean;
  residents: number;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role: Role;
  houseId?: string;
  status: boolean;
}

export interface Plate {
  id: string;
  number: string;
  state?: string;
  brand?: string;
  model?: string;
  color?: string;
  list: PlateList;
  resident: boolean;
}

export interface Visit {
  id: string;
  folio: string;
  kind: VisitKind;
  status: VisitStatus;
  title: string; // "Visita familiar", "Visita de CFE", etc.
  who: string; // nombre del visitante / conductor / empresa
  houseAddress: string;
  site?: string; // sede (corporativo)
  plate?: string;
  arriveDate?: string;
  leaveDate?: string;
  createdByGuard?: boolean;
  walking?: boolean;
}

export type NoticeKind = "general" | "house" | "emergency" | "payment";

export interface Notice {
  id: string;
  kind: NoticeKind;
  description: string;
  status: string; // 'active' | 'inactive' (texto en BD)
  houseAddress?: string; // domicilio destino (si es aviso dirigido)
  createdAt: string;
}

export interface Reservation {
  id: string;
  space: string;
  user: string;
  start: string;
  end: string;
  status: "pending" | "authorized" | "denied" | "canceled" | "finished";
  price: number;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Ticket {
  id: string;
  subject: string;
  description?: string;
  category: string;
  user: string;
  status: TicketStatus;
  createdAt: string;
}

export interface ReportDef {
  id: string;
  name: string;
  description: string;
  group: string;
}

/** Persona genérica para el módulo Usuarios (users o visitors). */
export interface Person {
  id: string;
  name: string;
  secondary?: string; // username (users) o empresa (visitors)
  contact?: string; // email (users) o teléfono (visitors)
  status: boolean;
}
