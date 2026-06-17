import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import * as mock from "@/lib/mock";
import type {
  House, Plate, User, Visit, Role, HouseKind, VisitKind, VisitStatus, PlateList, Person,
  Notice, NoticeKind, Ticket, TicketStatus,
} from "@/lib/types";
import type { SectionDef } from "@/lib/sections";

// Capa de acceso a datos. Lee de Supabase cuando está configurado; si no, usa datos demo.
// Toda función es null-safe y nunca lanza: ante error de red/permiso, degrada a demo.
// Se tipan las filas explícitamente para no depender de la inferencia genérica de Supabase.

function titleForVisit(kind: string, who: string): string {
  switch (kind) {
    case "service": return `Servicio — ${who}`;
    case "employee": return "Empleado";
    case "provider": return `Proveedor — ${who}`;
    case "resident": return "Ingreso de residente";
    case "event": return "Evento";
    default: return "Visita";
  }
}

type Rel = { name?: string | null; address?: string | null; number?: string | null } | null;
interface HouseRow {
  id: string; address: string; cluster: string | null; phone: string | null;
  kind: string; paid: boolean; defaulter: boolean; block_qr_visitor: boolean;
  status: boolean; updated_at: string;
}
interface VisitRow {
  id: string; folio: string | null; kind: string; status: string; subject: string | null;
  access_kind: string | null; guard_report: boolean | null;
  arrive_date: string | null; leave_date: string | null;
  houses: Rel; visitors: Rel; employees: Rel; services: Rel; providers: Rel;
  plates: Rel; security_booths: Rel;
}
interface UserRow {
  id: string; name: string; username: string | null; email: string | null;
  phone: string | null; house_id: string | null; status: boolean; rols: Rel;
}
interface PlateRow {
  id: string; number: string; state: string | null; brand: string | null;
  model: string | null; color: string | null; list: string; resident: boolean;
}

export async function getHouses(): Promise<House[]> {
  if (!isSupabaseConfigured) return mock.houses;
  try {
    const sb = await createClient();
    const [housesRes, usersRes] = await Promise.all([
      sb.from("houses").select("id,address,cluster,phone,kind,paid,defaulter,block_qr_visitor,status,updated_at").eq("deleted", false).order("address"),
      sb.from("users").select("house_id"),
    ]);
    const rows = (housesRes.data ?? []) as unknown as HouseRow[];
    if (housesRes.error || rows.length === 0) return mock.houses;
    const us = (usersRes.data ?? []) as unknown as { house_id: string | null }[];
    const count = new Map<string, number>();
    us.forEach((u) => { if (u.house_id) count.set(u.house_id, (count.get(u.house_id) ?? 0) + 1); });
    return rows.map((h) => ({
      id: h.id,
      address: h.address,
      cluster: h.cluster ?? undefined,
      phone: h.phone ?? undefined,
      kind: h.kind as HouseKind,
      paid: h.paid,
      defaulter: h.defaulter,
      receivingVisits: !h.block_qr_visitor && h.status,
      residents: count.get(h.id) ?? 0,
      updatedAt: h.updated_at,
    }));
  } catch {
    return mock.houses;
  }
}

export async function getVisits(): Promise<Visit[]> {
  if (!isSupabaseConfigured) return mock.visits;
  try {
    const sb = await createClient();
    const res = await sb
      .from("visits")
      .select("id,folio,kind,status,subject,access_kind,guard_report,arrive_date,leave_date,houses(address),visitors(name),employees(name),services(name),providers(name),plates(number),security_booths(name)")
      .order("arrive_date", { ascending: false, nullsFirst: false })
      .limit(50);
    const data = (res.data ?? []) as unknown as VisitRow[];
    if (res.error || data.length === 0) return mock.visits;
    return data.map((v): Visit => {
      const who = v.visitors?.name ?? v.employees?.name ?? v.services?.name ?? v.providers?.name ?? "—";
      return {
        id: v.id,
        folio: v.folio ?? "—",
        kind: v.kind as VisitKind,
        status: v.status as VisitStatus,
        title: v.subject || titleForVisit(v.kind, who),
        who,
        houseAddress: v.houses?.address ?? "—",
        site: v.security_booths?.name ?? undefined,
        plate: v.plates?.number ?? undefined,
        arriveDate: v.arrive_date ?? undefined,
        leaveDate: v.leave_date ?? undefined,
        createdByGuard: v.guard_report ?? false,
        walking: v.access_kind === "walking",
      };
    });
  } catch {
    return mock.visits;
  }
}

export async function getUsers(): Promise<User[]> {
  if (!isSupabaseConfigured) return mock.users;
  try {
    const sb = await createClient();
    const res = await sb.from("users").select("id,name,username,email,phone,house_id,status,rols(name)").order("name");
    const data = (res.data ?? []) as unknown as UserRow[];
    if (res.error || data.length === 0) return mock.users;
    return data.map((u): User => ({
      id: u.id,
      name: u.name,
      username: u.username ?? undefined,
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      role: (u.rols?.name ?? "resident") as Role,
      houseId: u.house_id ?? undefined,
      status: u.status,
    }));
  } catch {
    return mock.users;
  }
}

export async function getPlates(): Promise<Plate[]> {
  if (!isSupabaseConfigured) return mock.plates;
  try {
    const sb = await createClient();
    const res = await sb.from("plates").select("id,number,state,brand,model,color,list,resident").order("number");
    const data = (res.data ?? []) as unknown as PlateRow[];
    if (res.error || data.length === 0) return mock.plates;
    return data.map((p): Plate => ({
      id: p.id,
      number: p.number,
      state: p.state ?? undefined,
      brand: p.brand ?? undefined,
      model: p.model ?? undefined,
      color: p.color ?? undefined,
      list: p.list as PlateList,
      resident: p.resident,
    }));
  } catch {
    return mock.plates;
  }
}

export async function getPeople(section: SectionDef): Promise<Person[]> {
  if (!isSupabaseConfigured) {
    if (section.source === "visitors") {
      return [
        { id: "mv1", name: "María López", contact: "55 1111 1111", status: true },
        { id: "mv2", name: "Repartidor Amazon", secondary: "Amazon", contact: "55 2222 2222", status: true },
      ];
    }
    return mock.users
      .filter((u) => u.role === section.role)
      .map((u) => ({ id: u.id, name: u.name, secondary: u.username, contact: u.email, status: u.status }));
  }
  try {
    const sb = await createClient();
    if (section.source === "visitors") {
      const res = await sb.from("visitors").select("id,name,company,phone,status").eq("deleted", false).order("name");
      const rows = (res.data ?? []) as unknown as { id: string; name: string; company: string | null; phone: string | null; status: boolean }[];
      return rows.map((v) => ({ id: v.id, name: v.name, secondary: v.company ?? undefined, contact: v.phone ?? undefined, status: v.status }));
    }
    const rolRes = await sb.from("rols").select("id").eq("name", section.role!);
    const ids = ((rolRes.data ?? []) as unknown as { id: string }[]).map((r) => r.id);
    if (ids.length === 0) return [];
    const res = await sb
      .from("users")
      .select("id,name,username,email,status")
      .in("rol_id", ids)
      .order("name");
    const rows = (res.data ?? []) as unknown as { id: string; name: string; username: string | null; email: string | null; status: boolean }[];
    return rows.map((u) => ({ id: u.id, name: u.name, secondary: u.username ?? undefined, contact: u.email ?? undefined, status: u.status }));
  } catch {
    return [];
  }
}

export interface DashboardStats {
  visits: number; houses: number; services: number;
  visitors: number; activated: number; usingApp: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const fallback: DashboardStats = { visits: 128, houses: 8, services: 7, visitors: 60, activated: 8, usingApp: 8 };
  if (!isSupabaseConfigured) return fallback;
  try {
    const sb = await createClient();
    const head = { count: "exact" as const, head: true };
    const [visits, houses, services, visitors, residents] = await Promise.all([
      sb.from("visits").select("*", head),
      sb.from("houses").select("*", head).eq("deleted", false),
      sb.from("services").select("*", head),
      sb.from("visitors").select("*", head).eq("deleted", false),
      sb.from("users").select("*", head),
    ]);
    return {
      visits: visits.count ?? 0,
      houses: houses.count ?? 0,
      services: services.count ?? 0,
      visitors: visitors.count ?? 0,
      activated: residents.count ?? 0,
      usingApp: residents.count ?? 0,
    };
  } catch {
    return fallback;
  }
}

/* ---------------------------- Gráficas del dashboard --------------------- */
export interface DashboardCharts {
  peak: { h: string; v: number }[];
  types: { key: string; label: string; value: number }[];
  real: boolean; // true si proviene de Supabase con datos
}

const DEMO_CHARTS: DashboardCharts = {
  peak: [
    { h: "06", v: 4 }, { h: "08", v: 12 }, { h: "10", v: 9 }, { h: "12", v: 14 },
    { h: "14", v: 18 }, { h: "16", v: 22 }, { h: "18", v: 27 }, { h: "20", v: 16 }, { h: "22", v: 6 },
  ],
  types: [
    { key: "service", label: "Servicio", value: 38 },
    { key: "employee", label: "Empleados", value: 22 },
    { key: "visitor", label: "Visitantes", value: 51 },
    { key: "resident", label: "Residentes", value: 17 },
  ],
  real: false,
};

const KIND_LABELS: Record<string, string> = {
  visitor: "Visitantes", service: "Servicio", employee: "Empleados",
  resident: "Residentes", provider: "Proveedores", event: "Eventos",
};

export async function getDashboardCharts(): Promise<DashboardCharts> {
  if (!isSupabaseConfigured) return DEMO_CHARTS;
  try {
    const sb = await createClient();
    const res = await sb.from("visits").select("kind,arrive_date,created_at").limit(2000);
    const rows = (res.data ?? []) as unknown as { kind: string; arrive_date: string | null; created_at: string }[];
    if (res.error || rows.length === 0) return DEMO_CHARTS;

    // Horas pico: cuenta por hora del día (0–23) sobre la fecha de llegada (o alta).
    const byHour = new Array(24).fill(0) as number[];
    rows.forEach((r) => {
      const iso = r.arrive_date ?? r.created_at;
      if (!iso) return;
      const h = new Date(iso).getHours();
      if (h >= 0 && h < 24) byHour[h] += 1;
    });
    const peak = byHour.map((v, i) => ({ h: String(i).padStart(2, "0"), v }));

    // Tipos de visita: cuenta por kind.
    const byKind = new Map<string, number>();
    rows.forEach((r) => byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1));
    const types = Array.from(byKind.entries())
      .map(([key, value]) => ({ key, label: KIND_LABELS[key] ?? key, value }))
      .sort((a, b) => b.value - a.value);

    return { peak, types, real: true };
  } catch {
    return DEMO_CHARTS;
  }
}

/* --------------------------------- Avisos -------------------------------- */
export async function getNotices(): Promise<Notice[]> {
  if (!isSupabaseConfigured) return mock.notices;
  try {
    const sb = await createClient();
    const res = await sb
      .from("notices")
      .select("id,kind,description,status,created_at,houses(address)")
      .order("created_at", { ascending: false })
      .limit(100);
    interface Row { id: string; kind: string; description: string; status: string; created_at: string; houses: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return mock.notices;
    return data.map((n): Notice => ({
      id: n.id,
      kind: n.kind as NoticeKind,
      description: n.description,
      status: n.status,
      houseAddress: n.houses?.address ?? undefined,
      createdAt: n.created_at,
    }));
  } catch {
    return mock.notices;
  }
}

/* ----------------------------- Sugerencias ------------------------------- */
export async function getTickets(): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return mock.tickets;
  try {
    const sb = await createClient();
    const res = await sb
      .from("tickets")
      .select("id,subject,description,status,created_at,ticket_categories(name),users(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    interface Row {
      id: string; subject: string; description: string | null; status: string; created_at: string;
      ticket_categories: { name?: string | null } | null; users: Rel;
    }
    const data = (res.data ?? []) as unknown as Row[];
    if (res.error) return mock.tickets;
    return data.map((t): Ticket => ({
      id: t.id,
      subject: t.subject,
      description: t.description ?? undefined,
      category: t.ticket_categories?.name ?? "Sin categoría",
      user: t.users?.name ?? "—",
      status: t.status as TicketStatus,
      createdAt: t.created_at,
    }));
  } catch {
    return mock.tickets;
  }
}

/* ------------------------------ Lista negra ------------------------------ */
export interface BlockedIncident {
  id: string;
  reason: string;
  reporter: string;
  date: string;
}
export interface Blacklist {
  plates: Plate[];
  incidents: BlockedIncident[];
}

export async function getBlacklist(): Promise<Blacklist> {
  const plates = (await getPlates()).filter((p) => p.list === "blacklist" || p.list === "graylist" || p.list === "report");
  if (!isSupabaseConfigured) {
    return {
      plates,
      incidents: [{ id: "bi1", reason: "Incidente reportado por guardia", reporter: "Caseta principal", date: "2026-05-02T10:00:00Z" }],
    };
  }
  try {
    const sb = await createClient();
    const res = await sb
      .from("incidents")
      .select("id,reason,created_at,users(name)")
      .eq("blacklist", true)
      .order("created_at", { ascending: false })
      .limit(100);
    interface Row { id: string; reason: string | null; created_at: string; users: Rel }
    const data = (res.data ?? []) as unknown as Row[];
    const incidents = res.error ? [] : data.map((i): BlockedIncident => ({
      id: i.id,
      reason: i.reason ?? "Sin motivo registrado",
      reporter: i.users?.name ?? "—",
      date: i.created_at,
    }));
    return { plates, incidents };
  } catch {
    return { plates, incidents: [] };
  }
}

/* --------------------------------- Sedes --------------------------------- */
export interface SiteInfo {
  id: string;
  name: string;
  booths: number;
  houses: number;
  multiSite: boolean; // false: el tenant opera como sede única (no hay tabla sites aún)
}

export async function getSites(): Promise<SiteInfo[]> {
  if (!isSupabaseConfigured) {
    return mock.sites.map((s) => ({ ...s, multiSite: true }));
  }
  try {
    const sb = await createClient();
    const head = { count: "exact" as const, head: true };
    const [resRes, boothsRes, housesRes] = await Promise.all([
      sb.from("residentials").select("id,name").limit(1).maybeSingle(),
      sb.from("security_booths").select("*", head),
      sb.from("houses").select("*", head).eq("deleted", false),
    ]);
    const r = resRes.data as { id: string; name: string } | null;
    if (!r) return [];
    return [{
      id: r.id,
      name: r.name,
      booths: boothsRes.count ?? 0,
      houses: housesRes.count ?? 0,
      multiSite: false,
    }];
  } catch {
    return [];
  }
}

export async function getResidentialName(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const sb = await createClient();
    const { data } = await sb.from("residentials").select("name").limit(1).maybeSingle();
    return (data as { name: string } | null)?.name ?? null;
  } catch {
    return null;
  }
}
