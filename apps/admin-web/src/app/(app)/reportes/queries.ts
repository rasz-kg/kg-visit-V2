import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Capa de lectura de los sub-reportes. Mismo patrón que src/lib/data.ts:
// - lee de Supabase con createClient() cuando isSupabaseConfigured
// - tipa filas explícitamente con casts `as unknown as Tipo[]`
// - degrada a un resultado vacío ante error de red/permiso/no-config (nunca lanza)
// Cada query acepta un rango de fechas opcional (ISO yyyy-mm-dd) y devuelve
// una estructura uniforme {columns, rows, total, totalLabel} para render genérico.

export interface ReportColumn {
  key: string;
  label: string;
  mono?: boolean;
}

export type ReportCell = string | number | null | undefined;
export type ReportRowData = Record<string, ReportCell>;

export interface ReportResult {
  columns: ReportColumn[];
  rows: ReportRowData[];
  total: number;
  totalLabel: string;
}

export interface ReportFilters {
  /** Fecha inicial ISO (yyyy-mm-dd) — incluida. */
  from?: string;
  /** Fecha final ISO (yyyy-mm-dd) — incluida (se expande al fin del día). */
  to?: string;
}

const EMPTY = (columns: ReportColumn[], totalLabel: string): ReportResult => ({
  columns,
  rows: [],
  total: 0,
  totalLabel,
});

// Normaliza el rango a timestamptz utilizable en filtros gte/lte.
function range(filters: ReportFilters): { fromTs?: string; toTs?: string } {
  const fromTs = filters.from ? `${filters.from}T00:00:00` : undefined;
  const toTs = filters.to ? `${filters.to}T23:59:59` : undefined;
  return { fromTs, toTs };
}

type Rel = { name?: string | null; address?: string | null; number?: string | null } | null;

const dt = (v?: string | null) => (v ? new Date(v).toLocaleString("es-MX") : "—");
const d = (v?: string | null) => (v ? new Date(v).toLocaleDateString("es-MX") : "—");

/* ====================================================================== */
/*  ACCESOS                                                                */
/* ====================================================================== */

// Visitas por guardia: agrupa visitas por usuario creador (created_by).
export async function reportByGuard(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "guard", label: "Guardia" },
    { key: "kind", label: "Tipo" },
    { key: "house", label: "Domicilio" },
    { key: "status", label: "Estatus" },
    { key: "arrive", label: "Llegada" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "accesos");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("visits")
      .select("id,kind,status,arrive_date,houses(address),created_by_user:users!visits_created_by_fkey(name)")
      .order("arrive_date", { ascending: false, nullsFirst: false })
      .limit(200);
    if (fromTs) q = q.gte("arrive_date", fromTs);
    if (toTs) q = q.lte("arrive_date", toTs);
    const res = await q;
    interface Row { id: string; kind: string; status: string; arrive_date: string | null; houses: Rel; created_by_user: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "accesos");
    return {
      columns,
      rows: data.map((v) => ({
        guard: v.created_by_user?.name ?? "Sin guardia",
        kind: v.kind,
        house: v.houses?.address ?? "—",
        status: v.status,
        arrive: dt(v.arrive_date),
      })),
      total: data.length,
      totalLabel: "accesos",
    };
  } catch {
    return EMPTY(columns, "accesos");
  }
}

// Visitas por domicilio: lista visitas con su casa.
export async function reportHouseVisits(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "house", label: "Domicilio" },
    { key: "folio", label: "Folio", mono: true },
    { key: "kind", label: "Tipo" },
    { key: "status", label: "Estatus" },
    { key: "arrive", label: "Llegada" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "visitas");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("visits")
      .select("id,folio,kind,status,arrive_date,houses(address)")
      .order("arrive_date", { ascending: false, nullsFirst: false })
      .limit(200);
    if (fromTs) q = q.gte("arrive_date", fromTs);
    if (toTs) q = q.lte("arrive_date", toTs);
    const res = await q;
    interface Row { id: string; folio: string | null; kind: string; status: string; arrive_date: string | null; houses: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "visitas");
    return {
      columns,
      rows: data.map((v) => ({
        house: v.houses?.address ?? "—",
        folio: v.folio ?? "—",
        kind: v.kind,
        status: v.status,
        arrive: dt(v.arrive_date),
      })),
      total: data.length,
      totalLabel: "visitas",
    };
  } catch {
    return EMPTY(columns, "visitas");
  }
}

// Visitas por estatus: lista visitas mostrando su estatus.
export async function reportVisitsInside(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "status", label: "Estatus" },
    { key: "folio", label: "Folio", mono: true },
    { key: "kind", label: "Tipo" },
    { key: "house", label: "Domicilio" },
    { key: "arrive", label: "Llegada" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "visitas");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("visits")
      .select("id,folio,kind,status,arrive_date,houses(address)")
      .order("status", { ascending: true })
      .limit(200);
    if (fromTs) q = q.gte("arrive_date", fromTs);
    if (toTs) q = q.lte("arrive_date", toTs);
    const res = await q;
    interface Row { id: string; folio: string | null; kind: string; status: string; arrive_date: string | null; houses: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "visitas");
    return {
      columns,
      rows: data.map((v) => ({
        status: v.status,
        folio: v.folio ?? "—",
        kind: v.kind,
        house: v.houses?.address ?? "—",
        arrive: dt(v.arrive_date),
      })),
      total: data.length,
      totalLabel: "visitas",
    };
  } catch {
    return EMPTY(columns, "visitas");
  }
}

// Visitas por placa: visitas que traen placa asociada.
export async function reportByPlate(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "plate", label: "Placa", mono: true },
    { key: "kind", label: "Tipo" },
    { key: "house", label: "Domicilio" },
    { key: "status", label: "Estatus" },
    { key: "arrive", label: "Llegada" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "accesos con placa");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("visits")
      .select("id,kind,status,arrive_date,houses(address),plates(number)")
      .not("plate_id", "is", null)
      .order("arrive_date", { ascending: false, nullsFirst: false })
      .limit(200);
    if (fromTs) q = q.gte("arrive_date", fromTs);
    if (toTs) q = q.lte("arrive_date", toTs);
    const res = await q;
    interface Row { id: string; kind: string; status: string; arrive_date: string | null; houses: Rel; plates: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "accesos con placa");
    return {
      columns,
      rows: data.map((v) => ({
        plate: v.plates?.number ?? "—",
        kind: v.kind,
        house: v.houses?.address ?? "—",
        status: v.status,
        arrive: dt(v.arrive_date),
      })),
      total: data.length,
      totalLabel: "accesos con placa",
    };
  } catch {
    return EMPTY(columns, "accesos con placa");
  }
}

// Visitas con QR: accesos cuyo access_kind indica QR.
export async function reportQrVisits(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "folio", label: "Folio", mono: true },
    { key: "access", label: "Acceso" },
    { key: "kind", label: "Tipo" },
    { key: "house", label: "Domicilio" },
    { key: "arrive", label: "Llegada" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "visitas con QR");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("visits")
      .select("id,folio,kind,access_kind,arrive_date,houses(address)")
      .ilike("access_kind", "%qr%")
      .order("arrive_date", { ascending: false, nullsFirst: false })
      .limit(200);
    if (fromTs) q = q.gte("arrive_date", fromTs);
    if (toTs) q = q.lte("arrive_date", toTs);
    const res = await q;
    interface Row { id: string; folio: string | null; kind: string; access_kind: string | null; arrive_date: string | null; houses: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "visitas con QR");
    return {
      columns,
      rows: data.map((v) => ({
        folio: v.folio ?? "—",
        access: v.access_kind ?? "—",
        kind: v.kind,
        house: v.houses?.address ?? "—",
        arrive: dt(v.arrive_date),
      })),
      total: data.length,
      totalLabel: "visitas con QR",
    };
  } catch {
    return EMPTY(columns, "visitas con QR");
  }
}

// Visitas de evento: invitados de eventos (event_visitors) con su evento.
export async function reportEventVisits(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "event", label: "Evento" },
    { key: "guest", label: "Invitado" },
    { key: "folio", label: "Folio", mono: true },
    { key: "due", label: "Fecha evento" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "invitados de evento");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("event_visitors")
      .select("id,name,folio,events(name,due_date),visitors(name)")
      .limit(200);
    if (fromTs) q = q.gte("events.due_date", fromTs);
    if (toTs) q = q.lte("events.due_date", toTs);
    const res = await q;
    interface EvRel { name?: string | null; due_date?: string | null }
    interface Row { id: string; name: string | null; folio: string | null; events: EvRel | null; visitors: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "invitados de evento");
    return {
      columns,
      rows: data.map((e) => ({
        event: e.events?.name ?? "—",
        guest: e.visitors?.name ?? e.name ?? "—",
        folio: e.folio ?? "—",
        due: d(e.events?.due_date),
      })),
      total: data.length,
      totalLabel: "invitados de evento",
    };
  } catch {
    return EMPTY(columns, "invitados de evento");
  }
}

/* ====================================================================== */
/*  SEGURIDAD                                                              */
/* ====================================================================== */

// Autos: placas registradas.
export async function reportAutos(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "number", label: "Placa", mono: true },
    { key: "state", label: "Estado" },
    { key: "vehicle", label: "Vehículo" },
    { key: "list", label: "Lista" },
    { key: "resident", label: "Residente" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "placas");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("plates")
      .select("id,number,state,brand,model,color,list,resident,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromTs) q = q.gte("created_at", fromTs);
    if (toTs) q = q.lte("created_at", toTs);
    const res = await q;
    interface Row { id: string; number: string; state: string | null; brand: string | null; model: string | null; color: string | null; list: string; resident: boolean }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "placas");
    return {
      columns,
      rows: data.map((p) => ({
        number: p.number,
        state: p.state ?? "—",
        vehicle: [p.brand, p.model, p.color].filter(Boolean).join(" · ") || "—",
        list: p.list,
        resident: p.resident ? "Sí" : "No",
      })),
      total: data.length,
      totalLabel: "placas",
    };
  } catch {
    return EMPTY(columns, "placas");
  }
}

// Incidentes: reportes/incidencias con motivo.
export async function reportIncidentes(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "reason", label: "Motivo" },
    { key: "user", label: "Reportó" },
    { key: "blacklist", label: "Lista negra" },
    { key: "created", label: "Fecha" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "incidentes");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("incidents")
      .select("id,reason,blacklist,created_at,users(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromTs) q = q.gte("created_at", fromTs);
    if (toTs) q = q.lte("created_at", toTs);
    const res = await q;
    interface Row { id: string; reason: string | null; blacklist: boolean; created_at: string; users: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "incidentes");
    return {
      columns,
      rows: data.map((i) => ({
        reason: i.reason ?? "—",
        user: i.users?.name ?? "—",
        blacklist: i.blacklist ? "Sí" : "No",
        created: dt(i.created_at),
      })),
      total: data.length,
      totalLabel: "incidentes",
    };
  } catch {
    return EMPTY(columns, "incidentes");
  }
}

/* ====================================================================== */
/*  OPERACIÓN                                                              */
/* ====================================================================== */

// Total de QRs: usuarios con qr_code asignado.
export async function reportTotalQrs(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "name", label: "Usuario" },
    { key: "email", label: "Correo" },
    { key: "qr", label: "Código QR", mono: true },
    { key: "created", label: "Alta" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "usuarios con QR");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("users")
      .select("id,name,email,qr_code,created_at")
      .not("qr_code", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromTs) q = q.gte("created_at", fromTs);
    if (toTs) q = q.lte("created_at", toTs);
    const res = await q;
    interface Row { id: string; name: string; email: string | null; qr_code: string | null; created_at: string }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "usuarios con QR");
    return {
      columns,
      rows: data.map((u) => ({
        name: u.name,
        email: u.email ?? "—",
        qr: u.qr_code ?? "—",
        created: d(u.created_at),
      })),
      total: data.length,
      totalLabel: "usuarios con QR",
    };
  } catch {
    return EMPTY(columns, "usuarios con QR");
  }
}

// Paquetería: visitas de tipo provider/service que típicamente son envíos.
export async function reportShipping(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "folio", label: "Folio", mono: true },
    { key: "carrier", label: "Paquetería" },
    { key: "house", label: "Domicilio" },
    { key: "status", label: "Estatus" },
    { key: "arrive", label: "Llegada" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "paquetes");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("visits")
      .select("id,folio,kind,status,arrive_date,subject,houses(address),providers(name),services(name)")
      .in("kind", ["provider", "service"])
      .order("arrive_date", { ascending: false, nullsFirst: false })
      .limit(200);
    if (fromTs) q = q.gte("arrive_date", fromTs);
    if (toTs) q = q.lte("arrive_date", toTs);
    const res = await q;
    interface Row { id: string; folio: string | null; kind: string; status: string; arrive_date: string | null; subject: string | null; houses: Rel; providers: Rel; services: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "paquetes");
    return {
      columns,
      rows: data.map((v) => ({
        folio: v.folio ?? "—",
        carrier: v.providers?.name ?? v.services?.name ?? v.subject ?? "—",
        house: v.houses?.address ?? "—",
        status: v.status,
        arrive: dt(v.arrive_date),
      })),
      total: data.length,
      totalLabel: "paquetes",
    };
  } catch {
    return EMPTY(columns, "paquetes");
  }
}

// Uso de la app: colonos (rol resident) validados / con activación de correo.
export async function reportAppUse(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "name", label: "Colono" },
    { key: "email", label: "Correo" },
    { key: "validated", label: "Validado" },
    { key: "activation", label: "Activó correo" },
    { key: "created", label: "Alta" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "colonos");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("users")
      .select("id,name,email,validated,email_activation,created_at,rols(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromTs) q = q.gte("created_at", fromTs);
    if (toTs) q = q.lte("created_at", toTs);
    const res = await q;
    interface Row { id: string; name: string; email: string | null; validated: boolean; email_activation: boolean; created_at: string; rols: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "colonos");
    const activated = data.filter((u) => u.email_activation || u.validated);
    return {
      columns,
      rows: activated.map((u) => ({
        name: u.name,
        email: u.email ?? "—",
        validated: u.validated ? "Sí" : "No",
        activation: u.email_activation ? "Sí" : "No",
        created: d(u.created_at),
      })),
      total: activated.length,
      totalLabel: "colonos usando la app",
    };
  } catch {
    return EMPTY(columns, "colonos");
  }
}

// Usuarios activos: status = true.
export async function reportActiveUsers(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "name", label: "Usuario" },
    { key: "username", label: "Usuario (login)" },
    { key: "email", label: "Correo" },
    { key: "role", label: "Rol" },
    { key: "created", label: "Alta" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "usuarios activos");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("users")
      .select("id,name,username,email,created_at,status,rols(name)")
      .eq("status", true)
      .order("name")
      .limit(200);
    if (fromTs) q = q.gte("created_at", fromTs);
    if (toTs) q = q.lte("created_at", toTs);
    const res = await q;
    interface Row { id: string; name: string; username: string | null; email: string | null; created_at: string; status: boolean; rols: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "usuarios activos");
    return {
      columns,
      rows: data.map((u) => ({
        name: u.name,
        username: u.username ?? "—",
        email: u.email ?? "—",
        role: u.rols?.name ?? "—",
        created: d(u.created_at),
      })),
      total: data.length,
      totalLabel: "usuarios activos",
    };
  } catch {
    return EMPTY(columns, "usuarios activos");
  }
}

// Usuarios eliminados: status = false (baja lógica).
export async function reportDeletedUsers(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "name", label: "Usuario" },
    { key: "username", label: "Usuario (login)" },
    { key: "email", label: "Correo" },
    { key: "role", label: "Rol" },
    { key: "updated", label: "Baja" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "usuarios eliminados");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("users")
      .select("id,name,username,email,updated_at,status,rols(name)")
      .eq("status", false)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (fromTs) q = q.gte("updated_at", fromTs);
    if (toTs) q = q.lte("updated_at", toTs);
    const res = await q;
    interface Row { id: string; name: string; username: string | null; email: string | null; updated_at: string; status: boolean; rols: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "usuarios eliminados");
    return {
      columns,
      rows: data.map((u) => ({
        name: u.name,
        username: u.username ?? "—",
        email: u.email ?? "—",
        role: u.rols?.name ?? "—",
        updated: d(u.updated_at),
      })),
      total: data.length,
      totalLabel: "usuarios eliminados",
    };
  } catch {
    return EMPTY(columns, "usuarios eliminados");
  }
}

/* ====================================================================== */
/*  COMUNIDAD                                                              */
/* ====================================================================== */

// Avisos: comunicados publicados.
export async function reportNotices(filters: ReportFilters): Promise<ReportResult> {
  const columns: ReportColumn[] = [
    { key: "description", label: "Aviso" },
    { key: "kind", label: "Tipo" },
    { key: "house", label: "Domicilio" },
    { key: "status", label: "Estatus" },
    { key: "created", label: "Publicado" },
  ];
  if (!isSupabaseConfigured) return EMPTY(columns, "avisos");
  try {
    const sb = await createClient();
    const { fromTs, toTs } = range(filters);
    let q = sb
      .from("notices")
      .select("id,description,kind,status,created_at,houses(address)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromTs) q = q.gte("created_at", fromTs);
    if (toTs) q = q.lte("created_at", toTs);
    const res = await q;
    interface Row { id: string; description: string; kind: string; status: string; created_at: string; houses: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return EMPTY(columns, "avisos");
    return {
      columns,
      rows: data.map((n) => ({
        description: n.description,
        kind: n.kind,
        house: n.houses?.address ?? "Toda la comunidad",
        status: n.status,
        created: dt(n.created_at),
      })),
      total: data.length,
      totalLabel: "avisos",
    };
  } catch {
    return EMPTY(columns, "avisos");
  }
}

/* ====================================================================== */
/*  Mapa slug -> query                                                     */
/* ====================================================================== */

export type ReportQuery = (filters: ReportFilters) => Promise<ReportResult>;

export const REPORTS: Record<string, ReportQuery> = {
  "by-guard": reportByGuard,
  "house-visits": reportHouseVisits,
  "visits-inside": reportVisitsInside,
  "by-plate": reportByPlate,
  "qr-visits": reportQrVisits,
  "event-visits": reportEventVisits,
  "autos": reportAutos,
  "incidentes": reportIncidentes,
  "total-qrs": reportTotalQrs,
  "shipping": reportShipping,
  "app-use": reportAppUse,
  "active-users": reportActiveUsers,
  "deleted-users": reportDeletedUsers,
  "notices": reportNotices,
};
