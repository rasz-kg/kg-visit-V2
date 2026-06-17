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
