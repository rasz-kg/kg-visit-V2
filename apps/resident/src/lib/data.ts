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

/* --------------------------- Detalle de visita --------------------------- */
export interface VisitDetail {
  id: string;
  folio: string | null;
  subject: string | null;
  details: string | null;
  kind: string;
  status: string;
  private: boolean | null;
  validity: number | null;
  arriveDate: string | null;
  enterDate: string | null;
  leaveDate: string | null;
  dueDate: string | null;
  guardReport: boolean | null;
  visitorName: string | null;
  serviceName: string | null;
  employeeName: string | null;
  transportName: string | null;
  plateNumber: string | null;
  houseAddress: string | null;
}

export async function getVisitDetail(id: string): Promise<VisitDetail | null> {
  const res = await supabase
    .from("visits")
    .select(
      "id,folio,subject,details,kind,status,private,validity,arrive_date,enter_date,leave_date,due_date,guard_report,visitors(name),services(name),employees(name),transports(name),plates(number),houses(address)",
    )
    .eq("id", id)
    .maybeSingle();
  if (res.error || !res.data) return null;
  const row = res.data as unknown as {
    id: string; folio: string | null; subject: string | null; details: string | null;
    kind: string; status: string; private: boolean | null; validity: number | null;
    arrive_date: string | null; enter_date: string | null; leave_date: string | null;
    due_date: string | null; guard_report: boolean | null;
    visitors: Rel; services: Rel; employees: Rel; transports: Rel;
    plates: { number?: string | null } | null;
    houses: { address?: string | null } | null;
  };
  return {
    id: row.id,
    folio: row.folio,
    subject: row.subject,
    details: row.details,
    kind: row.kind,
    status: row.status,
    private: row.private,
    validity: row.validity,
    arriveDate: row.arrive_date,
    enterDate: row.enter_date,
    leaveDate: row.leave_date,
    dueDate: row.due_date,
    guardReport: row.guard_report,
    visitorName: row.visitors?.name ?? null,
    serviceName: row.services?.name ?? null,
    employeeName: row.employees?.name ?? null,
    transportName: row.transports?.name ?? null,
    plateNumber: row.plates?.number ?? null,
    houseAddress: row.houses?.address ?? null,
  };
}

export async function cancelVisit(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("visits").update({ status: "canceled" } as never).eq("id", id);
  return error ? { error: error.message } : {};
}

export async function reportVisit(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("visits").update({ guard_report: true } as never).eq("id", id);
  return error ? { error: error.message } : {};
}

/* ------------------------ Visitantes frecuentes -------------------------- */
export interface FrequentVisitor {
  id: string; // visitor_houses.id
  visitorId: string;
  name: string;
  phone: string | null;
  curp: string | null;
  frequently: boolean;
}

export async function getFrequentVisitors(houseId: string | null): Promise<FrequentVisitor[]> {
  if (!houseId) return [];
  const res = await supabase
    .from("visitor_houses")
    .select("id,visitor_id,frequently,visitors(name,phone,curp)")
    .eq("house_id", houseId)
    .eq("status", true)
    .order("frequently", { ascending: false });
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; visitor_id: string; frequently: boolean | null;
    visitors: { name?: string | null; phone?: string | null; curp?: string | null } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    visitorId: r.visitor_id,
    name: r.visitors?.name ?? "—",
    phone: r.visitors?.phone ?? null,
    curp: r.visitors?.curp ?? null,
    frequently: !!r.frequently,
  }));
}

export interface NewVisitorInput {
  name: string;
  phone?: string;
  curp?: string;
  frequently: boolean;
}

export async function createFrequentVisitor(
  p: NewVisitorInput,
  ctx: { residentialId: string | null; houseId: string | null },
): Promise<{ error?: string }> {
  if (!ctx.residentialId || !ctx.houseId) return { error: "Sin domicilio asignado." };
  if (!p.name.trim()) return { error: "El nombre es obligatorio." };
  const ins = await supabase
    .from("visitors")
    .insert({
      residential_id: ctx.residentialId,
      name: p.name.trim(),
      phone: p.phone?.trim() || null,
      curp: p.curp?.trim() || null,
    } as never)
    .select("id")
    .maybeSingle();
  if (ins.error) return { error: ins.error.message };
  const visitorId = (ins.data as { id: string } | null)?.id;
  if (!visitorId) return { error: "No se pudo crear el visitante." };
  const link = await supabase.from("visitor_houses").insert({
    house_id: ctx.houseId,
    visitor_id: visitorId,
    frequently: p.frequently,
    status: true,
  } as never);
  if (link.error) return { error: link.error.message };
  return {};
}

export async function removeFrequentVisitor(visitorHouseId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("visitor_houses")
    .update({ status: false } as never)
    .eq("id", visitorHouseId);
  return error ? { error: error.message } : {};
}

/* ----------------------------- Empleados --------------------------------- */
export interface Employee {
  id: string;
  name: string;
  days: string | null;
  timeStart: string | null;
  timeEnd: string | null;
  folio: string | null;
  credential: string | null;
}

export async function getEmployees(houseId: string | null): Promise<Employee[]> {
  if (!houseId) return [];
  const res = await supabase
    .from("employees")
    .select("id,name,days,time_start,time_end,folio,credential")
    .eq("house_id", houseId)
    .neq("deleted", true)
    .order("name");
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; name: string; days: string | null;
    time_start: string | null; time_end: string | null;
    folio: string | null; credential: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    days: r.days,
    timeStart: r.time_start,
    timeEnd: r.time_end,
    folio: r.folio,
    credential: r.credential,
  }));
}

export interface EmployeeInput {
  name: string;
  days: string;
  timeStart: string;
  timeEnd: string;
  folio?: string;
  credential?: string;
}

export async function createEmployee(
  p: EmployeeInput,
  ctx: { residentialId: string | null; houseId: string | null },
): Promise<{ error?: string }> {
  if (!ctx.residentialId || !ctx.houseId) return { error: "Sin domicilio asignado." };
  if (!p.name.trim()) return { error: "El nombre es obligatorio." };
  const { error } = await supabase.from("employees").insert({
    residential_id: ctx.residentialId,
    house_id: ctx.houseId,
    name: p.name.trim(),
    days: p.days.trim() || null,
    time_start: p.timeStart.trim() || null,
    time_end: p.timeEnd.trim() || null,
    folio: p.folio?.trim() || null,
    credential: p.credential?.trim() || null,
    status: true,
  } as never);
  return error ? { error: error.message } : {};
}

export async function updateEmployee(id: string, p: EmployeeInput): Promise<{ error?: string }> {
  if (!p.name.trim()) return { error: "El nombre es obligatorio." };
  const { error } = await supabase
    .from("employees")
    .update({
      name: p.name.trim(),
      days: p.days.trim() || null,
      time_start: p.timeStart.trim() || null,
      time_end: p.timeEnd.trim() || null,
      folio: p.folio?.trim() || null,
      credential: p.credential?.trim() || null,
    } as never)
    .eq("id", id);
  return error ? { error: error.message } : {};
}

export async function deleteEmployee(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("employees").update({ deleted: true } as never).eq("id", id);
  return error ? { error: error.message } : {};
}

/* --------------------------- Notificaciones ------------------------------ */
export interface NotificationItem {
  id: string;
  message: string;
  viewed: boolean;
  createdAt: string;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const res = await supabase
    .from("notifications")
    .select("id,message,viewed,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; message: string; viewed: boolean | null; created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    viewed: !!r.viewed,
    createdAt: r.created_at,
  }));
}

export async function markNotificationViewed(id: string): Promise<void> {
  await supabase.from("notifications").update({ viewed: true } as never).eq("id", id);
}

/* ------------------------------ Tickets ---------------------------------- */
export interface TicketItem {
  id: string;
  subject: string;
  description: string | null;
  status: string | null;
  categoryName: string | null;
  createdAt: string;
}

export async function getTickets(userId: string): Promise<TicketItem[]> {
  const res = await supabase
    .from("tickets")
    .select("id,subject,description,status,created_at,ticket_categories(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; subject: string; description: string | null; status: string | null;
    created_at: string; ticket_categories: { name?: string | null } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    description: r.description,
    status: r.status,
    categoryName: r.ticket_categories?.name ?? null,
    createdAt: r.created_at,
  }));
}

export async function getTicketCategories(): Promise<Catalog[]> {
  const res = await supabase
    .from("ticket_categories")
    .select("id,name")
    .eq("status", true)
    .order("name");
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as { id: string; name: string }[];
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function createTicket(
  p: { subject: string; description: string; categoryId: string },
  ctx: { residentialId: string | null; userId: string },
): Promise<{ error?: string }> {
  if (!ctx.residentialId) return { error: "Sin residencial asignado." };
  if (!p.subject.trim()) return { error: "El asunto es obligatorio." };
  if (!p.categoryId) return { error: "Selecciona una categoría." };
  const { error } = await supabase.from("tickets").insert({
    residential_id: ctx.residentialId,
    user_id: ctx.userId,
    ticket_category_id: p.categoryId,
    subject: p.subject.trim(),
    description: p.description.trim() || null,
    status: "open",
  } as never);
  return error ? { error: error.message } : {};
}

/* --------------------------- Reservaciones ------------------------------- */
export interface Space {
  id: string;
  name: string;
  price: number | null;
  pay: boolean | null;
}

export async function getSpaces(): Promise<Space[]> {
  const res = await supabase
    .from("spaces")
    .select("id,name,price,pay")
    .eq("status", true)
    .order("name");
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; name: string; price: number | null; pay: boolean | null;
  }[];
  return rows.map((r) => ({ id: r.id, name: r.name, price: r.price, pay: r.pay }));
}

export interface ReservationItem {
  id: string;
  spaceName: string | null;
  startDate: string | null;
  endDate: string | null;
  reason: string | null;
  status: string | null;
  price: number | null;
  pay: boolean | null;
}

export async function getReservations(userId: string): Promise<ReservationItem[]> {
  const res = await supabase
    .from("reservations")
    .select("id,start_date,end_date,reason,status,price,spaces(name,pay)")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .limit(100);
  if (res.error) return [];
  const rows = (res.data ?? []) as unknown as {
    id: string; start_date: string | null; end_date: string | null;
    reason: string | null; status: string | null; price: number | null;
    spaces: { name?: string | null; pay?: boolean | null } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    spaceName: r.spaces?.name ?? null,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    status: r.status,
    price: r.price,
    pay: r.spaces?.pay ?? null,
  }));
}

export async function createReservation(
  p: { spaceId: string; startDate: string; endDate: string; reason: string },
  ctx: { residentialId: string | null; userId: string },
): Promise<{ error?: string }> {
  if (!ctx.residentialId) return { error: "Sin residencial asignado." };
  if (!p.spaceId) return { error: "Selecciona una amenidad." };
  if (!p.reason.trim()) return { error: "Indica el motivo." };
  if (!p.startDate || !p.endDate) return { error: "Fechas requeridas." };
  const { error } = await supabase.from("reservations").insert({
    residential_id: ctx.residentialId,
    user_id: ctx.userId,
    space_id: p.spaceId,
    start_date: p.startDate,
    end_date: p.endDate,
    reason: p.reason.trim(),
    status: "pending",
  } as never);
  return error ? { error: error.message } : {};
}

/* --------------------------- Perfil (update) ----------------------------- */
export interface ProfileUpdate {
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export async function updateMyProfile(userId: string, p: ProfileUpdate): Promise<{ error?: string }> {
  if (!p.name.trim()) return { error: "El nombre es obligatorio." };
  const { error } = await supabase
    .from("users")
    .update({
      name: p.name.trim(),
      email: p.email?.trim() || null,
      phone: p.phone?.trim() || null,
      avatar: p.avatar?.trim() || null,
    } as never)
    .eq("id", userId);
  return error ? { error: error.message } : {};
}
