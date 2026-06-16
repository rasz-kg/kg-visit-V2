import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import * as mock from "@/lib/mock";
import type {
  House, Plate, User, Visit, Role, HouseKind, VisitKind, VisitStatus, PlateList,
} from "@/lib/types";

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
