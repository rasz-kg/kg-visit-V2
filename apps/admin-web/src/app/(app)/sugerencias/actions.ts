"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActionState = { ok: boolean; error?: string } | null;

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export async function setTicketStatus(id: string, status: string): Promise<ActionState> {
  if (!id || !STATUSES.includes(status)) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("tickets").update({ status } as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/sugerencias");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo actualizar el ticket." }; }
}

export async function deleteTicket(id: string): Promise<ActionState> {
  if (!id || !isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("tickets").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/sugerencias");
    return { ok: true };
  } catch { return { ok: false, error: "No se pudo eliminar el ticket." }; }
}
