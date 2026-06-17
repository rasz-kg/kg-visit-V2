"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getEntity, type EntityField } from "@/lib/entities";
import { getTenantId } from "@/lib/crud";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ActionState = { ok: boolean; error?: string } | null;

function coerce(field: EntityField, raw: FormDataEntryValue | null): unknown {
  if (field.type === "boolean") return raw === "on" || raw === "true";
  if (field.type === "number") {
    const s = String(raw ?? "").trim();
    return s === "" ? null : Number(s);
  }
  // FK / select / date / text / textarea / phone: tratar como string (vacío → null).
  const s = String(raw ?? "").trim();
  return s === "" ? null : s;
}

export async function saveEntity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const def = getEntity(String(formData.get("__entity")));
  if (!def) return { ok: false, error: "Entidad inválida." };
  const id = String(formData.get("__id") ?? "");

  const payload: Record<string, unknown> = {};
  for (const f of def.fields) {
    const v = coerce(f, formData.get(f.key));
    if (f.required && (v === null || v === "")) return { ok: false, error: `${f.label} es obligatorio.` };
    payload[f.key] = v;
  }
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const sb: any = await createClient();
    if (id) {
      const { error } = await sb.from(def.table).update(payload).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const rid = await getTenantId(sb);
      if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };
      payload.residential_id = rid;
      const { error } = await sb.from(def.table).insert(payload);
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath(`/m/${def.key}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar." };
  }
}

export async function toggleEntity(entityKey: string, id: string, field: string, next: boolean): Promise<ActionState> {
  const def = getEntity(entityKey);
  if (!def || !isSupabaseConfigured) return { ok: true };
  try {
    const sb: any = await createClient();
    const { error } = await sb.from(def.table).update({ [field]: next }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/m/${entityKey}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function deleteEntity(entityKey: string, id: string): Promise<ActionState> {
  const def = getEntity(entityKey);
  if (!def || !isSupabaseConfigured) return { ok: true };
  try {
    const sb: any = await createClient();
    if (def.softDelete) {
      const { error } = await sb.from(def.table).update({ deleted: true }).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await sb.from(def.table).delete().eq("id", id);
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath(`/m/${entityKey}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}
