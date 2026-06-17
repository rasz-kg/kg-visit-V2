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

// ----------------------------------------------------------------------------
// Detalle de visita (pantalla 5)
// ----------------------------------------------------------------------------
export interface VisitDetail {
  id: string;
  folio: string | null;
  subject: string | null;
  kind: string;
  status: string;
  accessKind: string | null;
  notes: string | null;
  details: string | null;
  reason: string | null;
  quick: boolean | null;
  private: boolean | null;
  guardReport: boolean | null;
  arriveDate: string | null;
  enterDate: string | null;
  leaveDate: string | null;
  dueDate: string | null;
  who: string;
  houseAddress: string | null;
  houseCluster: string | null;
  plate: string | null;
  serviceName: string | null;
  employeeName: string | null;
  transportName: string | null;
  boothName: string | null;
  visitorPhone: string | null;
  visitorCompany: string | null;
  visitorCurp: string | null;
  photos: { id: string; url: string }[];
}

export async function getVisitById(id: string): Promise<VisitDetail | null> {
  const res = await supabase
    .from("visits")
    .select(
      "id,folio,subject,kind,status,access_kind,notes,details,reason," +
        "quick,private,guard_report,arrive_date,enter_date,leave_date,due_date," +
        "visitors(name,phone,company,curp)," +
        "services(name),employees(name),transports(name)," +
        "houses(address,cluster),plates(number)," +
        "security_booths(name)," +
        "visit_photos(id,url)",
    )
    .eq("id", id)
    .maybeSingle();
  if (res.error || !res.data) return null;
  const v = res.data as unknown as {
    id: string; folio: string | null; subject: string | null; kind: string; status: string;
    access_kind: string | null; notes: string | null; details: string | null; reason: string | null;
    quick: boolean | null; private: boolean | null; guard_report: boolean | null;
    arrive_date: string | null; enter_date: string | null; leave_date: string | null; due_date: string | null;
    visitors: { name?: string | null; phone?: string | null; company?: string | null; curp?: string | null } | null;
    services: { name?: string | null } | null;
    employees: { name?: string | null } | null;
    transports: { name?: string | null } | null;
    houses: { address?: string | null; cluster?: string | null } | null;
    plates: { number?: string | null } | null;
    security_booths: { name?: string | null } | null;
    visit_photos: { id: string; url: string }[] | null;
  };
  return {
    id: v.id,
    folio: v.folio,
    subject: v.subject,
    kind: v.kind,
    status: v.status,
    accessKind: v.access_kind,
    notes: v.notes,
    details: v.details,
    reason: v.reason,
    quick: v.quick,
    private: v.private,
    guardReport: v.guard_report,
    arriveDate: v.arrive_date,
    enterDate: v.enter_date,
    leaveDate: v.leave_date,
    dueDate: v.due_date,
    who: v.visitors?.name ?? v.services?.name ?? v.employees?.name ?? "—",
    houseAddress: v.houses?.address ?? null,
    houseCluster: v.houses?.cluster ?? null,
    plate: v.plates?.number ?? null,
    serviceName: v.services?.name ?? null,
    employeeName: v.employees?.name ?? null,
    transportName: v.transports?.name ?? null,
    boothName: v.security_booths?.name ?? null,
    visitorPhone: v.visitors?.phone ?? null,
    visitorCompany: v.visitors?.company ?? null,
    visitorCurp: v.visitors?.curp ?? null,
    photos: v.visit_photos ?? [],
  };
}

// Crea un incidente (pantalla 5 → "Crear incidente"). La RLS (0006) exige que
// el guardia pertenezca al tenant; obtenemos el residential_id desde la visita.
export async function createIncident(
  visitId: string,
  reason: string,
): Promise<{ error?: string }> {
  const v = await supabase.from("visits").select("residential_id").eq("id", visitId).maybeSingle();
  if (v.error || !v.data) return { error: v.error?.message ?? "Visita no encontrada" };
  const residentialId = (v.data as { residential_id: string }).residential_id;
  const userId = await currentUserId();
  if (!userId) return { error: "Sin sesión activa" };
  const { error } = await supabase.from("incidents").insert({
    visit_id: visitId,
    residential_id: residentialId,
    user_id: userId,
    reason,
  } as never);
  return error ? { error: error.message } : {};
}

// ----------------------------------------------------------------------------
// Catálogos públicos (wizard de Nueva visita)
// ----------------------------------------------------------------------------
export interface HouseRow { id: string; address: string; cluster: string | null; defaulter: boolean | null; }
export interface ServiceRow { id: string; name: string; hasDetails: boolean | null; }
export interface TransportRow { id: string; name: string; plates: boolean | null; }
export interface EmployeeRow { id: string; name: string; folio: string | null; }

export async function getHouses(search?: string): Promise<HouseRow[]> {
  let q = supabase
    .from("houses")
    .select("id,address,cluster,defaulter,status,deleted")
    .eq("status", true)
    .eq("deleted", false)
    .order("address", { ascending: true })
    .limit(200);
  if (search && search.trim()) q = q.ilike("address", `%${search.trim()}%`);
  const res = await q;
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; address: string; cluster: string | null; defaulter: boolean | null;
  }[];
  return rows.map((h) => ({ id: h.id, address: h.address, cluster: h.cluster, defaulter: h.defaulter }));
}

export async function getServices(): Promise<ServiceRow[]> {
  const res = await supabase
    .from("services")
    .select("id,name,has_details,status")
    .eq("status", true)
    .order("name", { ascending: true });
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as { id: string; name: string; has_details: boolean | null }[];
  return rows.map((s) => ({ id: s.id, name: s.name, hasDetails: s.has_details }));
}

export async function getTransports(): Promise<TransportRow[]> {
  const res = await supabase
    .from("transports")
    .select("id,name,plates,status")
    .eq("status", true)
    .order("name", { ascending: true });
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as { id: string; name: string; plates: boolean | null }[];
  return rows.map((t) => ({ id: t.id, name: t.name, plates: t.plates }));
}

export async function getEmployeesByHouse(houseId: string): Promise<EmployeeRow[]> {
  const res = await supabase
    .from("employees")
    .select("id,name,folio,status,deleted")
    .eq("house_id", houseId)
    .eq("status", true)
    .eq("deleted", false)
    .order("name", { ascending: true });
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as { id: string; name: string; folio: string | null }[];
  return rows.map((e) => ({ id: e.id, name: e.name, folio: e.folio }));
}

// ----------------------------------------------------------------------------
// Crear visita desde caseta (pantalla 12)
// ----------------------------------------------------------------------------
async function currentUserId(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const r = await supabase.from("users").select("id").eq("auth_user_id", auth.user.id).maybeSingle();
  if (r.error || !r.data) return null;
  return (r.data as { id: string }).id;
}

async function currentResidentialId(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const r = await supabase
    .from("users")
    .select("residential_id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (r.error || !r.data) return null;
  return (r.data as { residential_id: string | null }).residential_id;
}

// Sube una placa (text) a la tabla `plates` del tenant y devuelve su id. La RLS
// de plates permite escritura al guardia (la cubre admin/guardia según 0006).
async function upsertPlate(number: string, residentialId: string): Promise<string | null> {
  const trimmed = number.trim().toUpperCase();
  if (!trimmed) return null;
  // Buscar existente
  const existing = await supabase
    .from("plates").select("id").eq("residential_id", residentialId).eq("number", trimmed).maybeSingle();
  if (existing.data) return (existing.data as { id: string }).id;
  const { data, error } = await supabase
    .from("plates")
    .insert({ residential_id: residentialId, number: trimmed } as never)
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

export interface NewVisitInput {
  kind: "visitor" | "service" | "employee" | "resident";
  houseId: string;
  visitorName?: string;
  visitorCurp?: string | null;
  visitorPhone?: string | null;
  serviceId?: string | null;
  employeeId?: string | null;
  transportId?: string | null;
  plateNumber?: string | null;
  subject?: string | null;
  details?: string | null;
  notes?: string | null;
  giveAccessNow: boolean;
}

export async function createGuardVisit(
  input: NewVisitInput,
  boothId: string,
): Promise<{ error?: string; visitId?: string }> {
  const userId = await currentUserId();
  const residentialId = await currentResidentialId();
  if (!userId || !residentialId) return { error: "Sin sesión activa" };

  // 1. Si es visitante, crear (unexpected=false en visitors — el flag `unexpected`
  // vive en visitor_houses, no en visitors). Sólo guardamos nombre/CURP/teléfono.
  let visitorId: string | null = null;
  if (input.kind === "visitor") {
    if (!input.visitorName || !input.visitorName.trim()) return { error: "Falta nombre del visitante" };
    const { data, error } = await supabase
      .from("visitors")
      .insert({
        residential_id: residentialId,
        name: input.visitorName.trim(),
        curp: input.visitorCurp?.trim() || null,
        phone: input.visitorPhone?.trim() || null,
      } as never)
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "No se pudo crear el visitante" };
    visitorId = (data as { id: string }).id;
  }

  // 2. Placa opcional.
  let plateId: string | null = null;
  if (input.plateNumber && input.plateNumber.trim()) {
    plateId = await upsertPlate(input.plateNumber, residentialId);
  }

  // 3. Crear la visita. Si el guardia da acceso directo → status=inside, si no → authorized.
  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    residential_id: residentialId,
    house_id: input.houseId,
    kind: input.kind,
    status: input.giveAccessNow ? "inside" : "authorized",
    subject: input.subject?.trim() || null,
    details: input.details?.trim() || null,
    notes: input.notes?.trim() || null,
    visitor_id: visitorId,
    service_id: input.serviceId ?? null,
    employee_id: input.employeeId ?? null,
    transport_id: input.transportId ?? null,
    plate_id: plateId,
    security_booth_id: boothId,
    created_by: userId,
    arrive_date: nowIso,
    enter_date: input.giveAccessNow ? nowIso : null,
    guard_report: true,
  };
  const { data, error } = await supabase
    .from("visits")
    .insert(payload as never)
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "No se pudo crear la visita" };
  return { visitId: (data as { id: string }).id };
}

// ----------------------------------------------------------------------------
// QR / Folio manual (pantalla 13)
// ----------------------------------------------------------------------------
export async function getVisitByFolio(folio: string): Promise<VisitItem | null> {
  const res = await supabase
    .from("visits")
    .select(
      "id,folio,subject,kind,status,arrive_date," +
        "visitors(name),services(name),employees(name)," +
        "houses(address),plates(number)",
    )
    .eq("folio", folio.trim())
    .maybeSingle();
  if (res.error || !res.data) return null;
  const v = res.data as unknown as {
    id: string; folio: string | null; subject: string | null; kind: string; status: string;
    arrive_date: string | null;
    visitors: Rel; services: Rel; employees: Rel;
    houses: { address?: string | null } | null;
    plates: { number?: string | null } | null;
  };
  return {
    id: v.id,
    folio: v.folio,
    subject: v.subject,
    kind: v.kind,
    status: v.status,
    who: v.visitors?.name ?? v.services?.name ?? v.employees?.name ?? "—",
    houseAddress: v.houses?.address ?? null,
    arriveDate: v.arrive_date,
    plate: v.plates?.number ?? null,
  };
}

// ----------------------------------------------------------------------------
// Alertas de pánico (pantalla 14)
// ----------------------------------------------------------------------------
export interface PanicAlertRow {
  id: string;
  kind: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  status: boolean;
  houseAddress: string | null;
  userName: string | null;
  userPhone: string | null;
}

// Las alertas "activas" son las que aún no han sido atendidas (status=true).
export async function getActivePanicAlerts(): Promise<PanicAlertRow[]> {
  const res = await supabase
    .from("panic_alerts")
    .select("id,kind,lat,lng,status,created_at,houses(address),users(name,phone)")
    .eq("status", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; kind: string | null; lat: number | null; lng: number | null;
    status: boolean; created_at: string;
    houses: { address?: string | null } | null;
    users: { name?: string | null; phone?: string | null } | null;
  }[];
  return rows.map((p) => ({
    id: p.id,
    kind: p.kind,
    lat: p.lat,
    lng: p.lng,
    status: p.status,
    createdAt: p.created_at,
    houseAddress: p.houses?.address ?? null,
    userName: p.users?.name ?? null,
    userPhone: p.users?.phone ?? null,
  }));
}

export async function countActivePanicAlerts(): Promise<number> {
  const res = await supabase
    .from("panic_alerts")
    .select("id", { count: "exact", head: true })
    .eq("status", true);
  return res.count ?? 0;
}

// Marca la alerta como atendida (status=false). La RLS de guardia (0006) permite el UPDATE.
export async function markPanicAttended(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("panic_alerts")
    .update({ status: false } as never)
    .eq("id", id);
  return error ? { error: error.message } : {};
}
