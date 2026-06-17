"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActionState = { ok: boolean; error?: string } | null;
type SB = Awaited<ReturnType<typeof createClient>>;

async function tenantId(sb: SB): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  return (data as { residential_id: string } | null)?.residential_id ?? null;
}

/** Identidad del admin en sesión: residential_id + id de su fila en `users`. */
async function currentUser(sb: SB): Promise<{ residentialId: string; userId: string } | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("users").select("id,residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  const row = data as { id: string; residential_id: string } | null;
  if (!row) return null;
  return { residentialId: row.residential_id, userId: row.id };
}

const VISIT_KINDS = ["visitor", "employee", "service", "resident", "provider", "event"];

function s(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

/** Pre-registra una visita desde el portal: crea (o reutiliza) un visitante y la visita en estado pendiente. */
export async function createVisit(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const kind = VISIT_KINDS.includes(s(fd, "kind")) ? s(fd, "kind") : "visitor";
  const houseId = s(fd, "house_id") || null;
  const who = s(fd, "who");
  const subject = s(fd, "subject");
  if (!who && !subject) return { ok: false, error: "Indica el nombre del visitante o el asunto." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const me = await currentUser(sb);
    if (!me) return { ok: false, error: "Tu sesión no permite esta acción." };

    // Crea un visitante con el nombre capturado para que la visita muestre "quién".
    let visitorId: string | null = null;
    if (who) {
      const { data: v, error: vErr } = await sb
        .from("visitors")
        .insert({ residential_id: me.residentialId, name: who } as never)
        .select("id")
        .maybeSingle();
      if (vErr) return { ok: false, error: vErr.message };
      visitorId = (v as { id: string } | null)?.id ?? null;
    }

    const payload = {
      residential_id: me.residentialId,
      kind,
      status: "pending",
      house_id: houseId,
      subject: subject || null,
      visitor_id: visitorId,
      created_by: me.userId,
      arrive_date: new Date().toISOString(),
    };
    const { error } = await sb.from("visits").insert(payload as never);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/visitas");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo registrar la visita." }; }
}

/** Update genérico de una visita por id (RLS admin). */
async function updateVisit(id: string, patch: Record<string, unknown>): Promise<ActionState> {
  if (!id) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("visits").update(patch as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/visitas");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar." }; }
}

export async function authorizeVisit(id: string): Promise<ActionState> {
  return updateVisit(id, { status: "authorized" });
}

export async function denyVisit(id: string): Promise<ActionState> {
  return updateVisit(id, { status: "denied" });
}

export async function giveAccess(id: string): Promise<ActionState> {
  return updateVisit(id, { status: "inside", enter_date: new Date().toISOString() });
}

export async function markLeave(id: string): Promise<ActionState> {
  return updateVisit(id, { status: "finished", leave_date: new Date().toISOString() });
}

export async function reportVisit(id: string): Promise<ActionState> {
  return updateVisit(id, { guard_report: true });
}

export async function notifyPackage(id: string): Promise<ActionState> {
  if (!id) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };
    // Localiza el house de la visita y un residente al cual notificar (no-op seguro si falta info).
    const { data: visit } = await sb.from("visits").select("house_id").eq("id", id).maybeSingle();
    const houseId = (visit as { house_id: string | null } | null)?.house_id ?? null;
    let userId: string | null = null;
    if (houseId) {
      const { data: resident } = await sb.from("users").select("id").eq("house_id", houseId).limit(1).maybeSingle();
      userId = (resident as { id: string } | null)?.id ?? null;
    }
    const payload = {
      residential_id: rid,
      user_id: userId,
      message: "Tienes un paquete en recepción.",
    };
    const { error } = await sb.from("notifications").insert(payload as never);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/visitas");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo notificar el paquete." }; }
}
