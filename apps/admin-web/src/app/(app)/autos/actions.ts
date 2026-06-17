"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActionState = { ok: boolean; error?: string } | null;
type SB = Awaited<ReturnType<typeof createClient>>;

const LISTS = ["none", "blacklist", "graylist", "report", "recuperate"];

async function tenantId(sb: SB): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  return (data as { residential_id: string } | null)?.residential_id ?? null;
}

function s(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

function platePayload(fd: FormData) {
  const list = LISTS.includes(s(fd, "list")) ? s(fd, "list") : "none";
  return {
    number: s(fd, "number").toUpperCase(),
    state: s(fd, "state") || null,
    brand: s(fd, "brand") || null,
    model: s(fd, "model") || null,
    color: s(fd, "color") || null,
    list,
    resident: fd.get("resident") === "on",
  };
}

export async function createPlate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const number = s(fd, "number");
  if (!number) return { ok: false, error: "El número de placa es obligatorio." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };
    const payload = { residential_id: rid, ...platePayload(fd) };
    const { error } = await sb.from("plates").insert(payload as never);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/autos");
    revalidatePath("/lista-negra");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo registrar la placa." }; }
}

export async function updatePlate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = s(fd, "id");
  const number = s(fd, "number");
  if (!id || !number) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("plates").update(platePayload(fd) as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/autos");
    revalidatePath("/lista-negra");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar la placa." }; }
}

export async function setPlateList(id: string, list: string): Promise<ActionState> {
  if (!id || !LISTS.includes(list)) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("plates").update({ list } as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/autos");
    revalidatePath("/lista-negra");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar la lista." }; }
}

export async function deletePlate(id: string): Promise<ActionState> {
  if (!id || !isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("plates").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/autos");
    revalidatePath("/lista-negra");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo eliminar la placa." }; }
}
