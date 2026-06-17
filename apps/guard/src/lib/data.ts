import { supabase } from "./supabase";

// Caseta (security_booths) del tenant.
export interface Booth {
  id: string;
  name: string;
  main: boolean | null;
  channel: string | null;
  color: string | null;
  doubleCheck: boolean | null;
}

// Visita del día mapeada a la fila del listado de caseta.
export interface VisitItem {
  id: string;
  folio: string | null;
  subject: string | null;
  kind: string;
  status: string;
  who: string;
  houseAddress: string | null;
  arriveDate: string | null;
  plate: string | null;
}

type Rel = { name?: string | null } | null;

// Lista las casetas del residencial. RLS (0006) ya acota al tenant del guardia.
export async function getBooths(): Promise<Booth[]> {
  const res = await supabase
    .from("security_booths")
    .select("id,name,main,channel,color,double_check,status")
    .order("main", { ascending: false })
    .order("name", { ascending: true });
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; name: string; main: boolean | null; channel: string | null;
    color: string | null; double_check: boolean | null; status: boolean | null;
  }[];
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    main: b.main,
    channel: b.channel,
    color: b.color,
    doubleCheck: b.double_check,
  }));
}

// Visitas del día del tenant, con filtros opcionales. RLS (0006) acota al tenant del guardia.
export async function getTodayVisits(
  search?: string,
  kind?: string,
  status?: string,
): Promise<VisitItem[]> {
  let query = supabase
    .from("visits")
    .select(
      "id,folio,subject,kind,status,arrive_date," +
        "visitors(name),services(name),employees(name)," +
        "houses(address),plates(number)",
    )
    .order("arrive_date", { ascending: false, nullsFirst: false })
    .limit(100);

  if (kind) query = query.eq("kind", kind);
  if (status) query = query.eq("status", status);
  // Búsqueda por asunto o folio (ILIKE). El "quién" se filtra en cliente más abajo.
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`subject.ilike.${term},folio.ilike.${term}`);
  }

  const res = await query;
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; folio: string | null; subject: string | null; kind: string; status: string;
    arrive_date: string | null;
    visitors: Rel; services: Rel; employees: Rel;
    houses: { address?: string | null } | null;
    plates: { number?: string | null } | null;
  }[];
  return rows.map((v) => ({
    id: v.id,
    folio: v.folio,
    subject: v.subject,
    kind: v.kind,
    status: v.status,
    who: v.visitors?.name ?? v.services?.name ?? v.employees?.name ?? "—",
    houseAddress: v.houses?.address ?? null,
    arriveDate: v.arrive_date,
    plate: v.plates?.number ?? null,
  }));
}

// Cambia el estatus de una visita; `extra` permite marcar enter_date/leave_date u otras columnas.
export async function setVisitStatus(
  id: string,
  status: string,
  extra?: Record<string, unknown>,
): Promise<{ error?: string }> {
  const payload = { status, ...(extra ?? {}) };
  const { error } = await supabase.from("visits").update(payload as never).eq("id", id);
  return error ? { error: error.message } : {};
}

// Atajos de acción según la spec (docs/13 §4).
export const authorizeVisit = (id: string) => setVisitStatus(id, "authorized");
export const denyVisit = (id: string) => setVisitStatus(id, "denied");
export const giveAccess = (id: string) =>
  setVisitStatus(id, "inside", { enter_date: new Date().toISOString() });
export const leaveVisit = (id: string) =>
  setVisitStatus(id, "finished", { leave_date: new Date().toISOString() });

// Marca la visita como reportada por el guardia (guard_report=true).
export async function reportVisit(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("visits")
    .update({ guard_report: true } as never)
    .eq("id", id);
  return error ? { error: error.message } : {};
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
