"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActionState = { ok: boolean; error?: string } | null;
type SB = Awaited<ReturnType<typeof createClient>>;

const KINDS = ["general", "house", "emergency", "payment"];

async function tenantId(sb: SB): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  return (data as { residential_id: string } | null)?.residential_id ?? null;
}

function s(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

export async function createNotice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const description = s(fd, "description");
  if (!description) return { ok: false, error: "El mensaje del aviso es obligatorio." };
  const kind = KINDS.includes(s(fd, "kind")) ? s(fd, "kind") : "general";
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };
    const payload = { residential_id: rid, kind, description, status: "active" };
    const { error } = await sb.from("notices").insert(payload as never);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/avisos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo publicar el aviso." }; }
}

export async function toggleNotice(id: string, active: boolean): Promise<ActionState> {
  if (!id || !isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("notices").update({ status: active ? "active" : "inactive" } as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/avisos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar el aviso." }; }
}

export async function deleteNotice(id: string): Promise<ActionState> {
  if (!id || !isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("notices").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/avisos");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo eliminar el aviso." }; }
}
