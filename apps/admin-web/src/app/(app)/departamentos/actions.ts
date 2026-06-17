"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActionState = { ok: boolean; error?: string } | null;
type SB = Awaited<ReturnType<typeof createClient>>;

const KINDS = ["land", "construction", "build", "inhabited", "rent"];

async function tenantId(sb: SB): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  return (data as { residential_id: string } | null)?.residential_id ?? null;
}

function s(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

export async function createHouse(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const address = s(fd, "address");
  if (!address) return { ok: false, error: "La dirección es obligatoria." };
  const kind = KINDS.includes(s(fd, "kind")) ? s(fd, "kind") : "inhabited";
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };
    const payload = {
      residential_id: rid, address,
      cluster: s(fd, "cluster") || null, phone: s(fd, "phone") || null,
      kind, paid: fd.get("paid") === "on", defaulter: fd.get("defaulter") === "on",
    };
    const { error } = await sb.from("houses").insert(payload as never);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/departamentos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo guardar." }; }
}

export async function updateHouse(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = s(fd, "id");
  const address = s(fd, "address");
  if (!id || !address) return { ok: false, error: "Datos incompletos." };
  const kind = KINDS.includes(s(fd, "kind")) ? s(fd, "kind") : "inhabited";
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const payload = {
      address, cluster: s(fd, "cluster") || null, phone: s(fd, "phone") || null,
      kind, paid: fd.get("paid") === "on", defaulter: fd.get("defaulter") === "on",
    };
    const { error } = await sb.from("houses").update(payload as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/departamentos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar." }; }
}

export async function toggleDefaulter(id: string, next: boolean): Promise<ActionState> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("houses").update({ defaulter: next } as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/departamentos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar." }; }
}

export async function deleteHouse(id: string): Promise<ActionState> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("houses").update({ deleted: true, status: false } as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/departamentos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo eliminar." }; }
}
