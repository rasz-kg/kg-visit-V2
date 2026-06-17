"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSection, type SectionKey } from "@/lib/sections";

export type ActionState = { ok: boolean; error?: string } | null;

type SB = Awaited<ReturnType<typeof createClient>>;

// Los tipos de insert/update de supabase-js pueden degradar a `never` con esquemas grandes;
// los payloads se validan como objetos TS y se castean en el borde de la llamada.
async function tenantId(sb: SB): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  return (data as { residential_id: string } | null)?.residential_id ?? null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createPerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const section = getSection(String(formData.get("section")));
  if (!section) return { ok: false, error: "Sección inválida." };
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "El nombre completo es obligatorio." };
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };

    if (section.source === "visitors") {
      const payload = { residential_id: rid, name, company: str(formData, "secondary") || null, phone: str(formData, "contact") || null };
      const { error } = await sb.from("visitors").insert(payload as never);
      if (error) return { ok: false, error: error.message };
    } else {
      const username = str(formData, "username");
      if (!username) return { ok: false, error: "El usuario es obligatorio." };
      const { data: rol } = await sb.from("rols").select("id").eq("residential_id", rid).eq("name", section.role!).maybeSingle();
      const payload = {
        residential_id: rid,
        rol_id: (rol as { id: string } | null)?.id ?? null,
        name, username, email: str(formData, "contact") || null, status: true,
      };
      const { error } = await sb.from("users").insert(payload as never);
      if (error) return { ok: false, error: error.code === "23505" ? "Ese nombre de usuario ya existe." : error.message };
    }
    revalidatePath(`/usuarios/${section.key}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
}

export async function updatePerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const section = getSection(String(formData.get("section")));
  const id = String(formData.get("id") ?? "");
  if (!section || !id) return { ok: false, error: "Datos incompletos." };
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "El nombre completo es obligatorio." };
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const sb = await createClient();
    if (section.source === "visitors") {
      const payload = { name, company: str(formData, "secondary") || null, phone: str(formData, "contact") || null };
      const { error } = await sb.from("visitors").update(payload as never).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const payload = { name, username: str(formData, "username") || null, email: str(formData, "contact") || null };
      const { error } = await sb.from("users").update(payload as never).eq("id", id);
      if (error) return { ok: false, error: error.code === "23505" ? "Ese nombre de usuario ya existe." : error.message };
    }
    revalidatePath(`/usuarios/${section.key}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function togglePerson(sectionKey: SectionKey, id: string, nextStatus: boolean): Promise<ActionState> {
  const section = getSection(sectionKey);
  if (!section || !isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const table = section.source === "visitors" ? "visitors" : "users";
    const { error } = await sb.from(table).update({ status: nextStatus } as never).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/usuarios/${sectionKey}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el estatus." };
  }
}

export async function deletePerson(sectionKey: SectionKey, id: string): Promise<ActionState> {
  const section = getSection(sectionKey);
  if (!section || !isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    if (section.source === "visitors") {
      const { error } = await sb.from("visitors").update({ deleted: true, status: false } as never).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await sb.from("users").delete().eq("id", id);
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath(`/usuarios/${sectionKey}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}
