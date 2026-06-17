import { supabase } from "./supabase";

export interface VisitItem {
  id: string;
  folio: string | null;
  subject: string | null;
  kind: string;
  status: string;
  who: string;
  arriveDate: string | null;
}

type Rel = { name?: string | null } | null;

// Visitas de la casa del residente. RLS (0006) ya acota a su `house_id`.
export async function getVisits(houseId: string | null): Promise<VisitItem[]> {
  if (!houseId) return [];
  const res = await supabase
    .from("visits")
    .select("id,folio,subject,kind,status,arrive_date,visitors(name),services(name),employees(name)")
    .eq("house_id", houseId)
    .order("arrive_date", { ascending: false, nullsFirst: false })
    .limit(50);
  const rows = (res.data ?? []) as unknown as {
    id: string; folio: string | null; subject: string | null; kind: string; status: string;
    arrive_date: string | null; visitors: Rel; services: Rel; employees: Rel;
  }[];
  if (res.error) return [];
  return rows.map((v) => ({
    id: v.id,
    folio: v.folio,
    subject: v.subject,
    kind: v.kind,
    status: v.status,
    who: v.visitors?.name ?? v.services?.name ?? v.employees?.name ?? "—",
    arriveDate: v.arrive_date,
  }));
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/* --------------------------------- Avisos -------------------------------- */
export interface NoticeItem { id: string; kind: string; description: string; createdAt: string }

export async function getNotices(): Promise<NoticeItem[]> {
  const res = await supabase
    .from("notices")
    .select("id,kind,description,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (res.data ?? []) as unknown as { id: string; kind: string; description: string; created_at: string }[];
  return res.error ? [] : rows.map((n) => ({ id: n.id, kind: n.kind, description: n.description, createdAt: n.created_at }));
}

/* --------------------------- Catálogos del wizard ------------------------ */
export interface Catalog { id: string; name: string; plates?: boolean; hasDetails?: boolean }

export async function getTransports(): Promise<Catalog[]> {
  const res = await supabase.from("transports").select("id,name,plates").eq("status", true).order("name");
  const rows = (res.data ?? []) as unknown as { id: string; name: string; plates: boolean }[];
  return res.error ? [] : rows.map((t) => ({ id: t.id, name: t.name, plates: t.plates }));
}

export async function getServices(): Promise<Catalog[]> {
  const res = await supabase.from("services").select("id,name,has_details").eq("status", true).order("name");
  const rows = (res.data ?? []) as unknown as { id: string; name: string; has_details: boolean }[];
  return res.error ? [] : rows.map((s) => ({ id: s.id, name: s.name, hasDetails: s.has_details }));
}

/* ------------------------- Crear visita (residente) ---------------------- */
export interface NewVisitInput {
  kind: "visitor" | "service";
  subject: string;
  visitorName?: string; // para kind=visitor
  serviceId?: string | null; // para kind=service
  transportId?: string | null;
  validity: number; // horas
  dueDate: string; // ISO
}
interface ProfileLike {
  id: string; residentialId: string | null; houseId: string | null;
}

// Crea (si aplica) un visitante y la visita en estado pendiente. RLS (0006) la acota a la casa del residente.
export async function createResidentVisit(p: NewVisitInput, profile: ProfileLike): Promise<{ error?: string }> {
  if (!profile.residentialId || !profile.houseId) return { error: "Tu perfil no tiene un domicilio asignado." };
  let visitorId: string | null = null;
  if (p.kind === "visitor") {
    if (!p.visitorName?.trim()) return { error: "Indica el nombre del visitante." };
    const { data, error } = await supabase
      .from("visitors")
      .insert({ residential_id: profile.residentialId, name: p.visitorName.trim() } as never)
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    visitorId = (data as { id: string } | null)?.id ?? null;
  }
  const payload = {
    residential_id: profile.residentialId,
    house_id: profile.houseId,
    kind: p.kind,
    status: "pending",
    subject: p.subject.trim() || null,
    visitor_id: visitorId,
    service_id: p.kind === "service" ? p.serviceId ?? null : null,
    transport_id: p.transportId ?? null,
    validity: p.validity,
    due_date: p.dueDate,
    arrive_date: p.dueDate,
    created_by: profile.id,
  };
  const { error } = await supabase.from("visits").insert(payload as never);
  if (error) return { error: error.message };
  return {};
}
