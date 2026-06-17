"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActionState = { ok: boolean; error?: string } | null;

type SB = Awaited<ReturnType<typeof createClient>>;

// Columnas tipadas que existen en `residentials` y se actualizan directamente.
// El resto de flags (~138) se persisten en `residentials.settings jsonb` (merge).
const COLUMN_BOOLS = [
  "qr_enabled",
  "reservations",
  "lpr",
  "repuve",
  "facial",
  "resident_app",
  "company_mode",
] as const;

const COLUMN_INTS = ["confirmation_wait_time", "visitor_expiration_time"] as const;

// Los tipos de insert/update de supabase-js pueden degradar a `never` con esquemas grandes;
// los payloads se validan como objetos TS y se castean en el borde de la llamada.
async function tenantId(sb: SB): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb
    .from("users")
    .select("residential_id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  return (data as { residential_id: string } | null)?.residential_id ?? null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/* -------------------------------------------------------------------------- */
/*  Configuración del tenant (residentials: columnas + settings jsonb)        */
/* -------------------------------------------------------------------------- */
export async function saveConfig(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };

    // 1) Columnas tipadas conocidas.
    const update: Record<string, unknown> = {};
    for (const key of COLUMN_BOOLS) update[key] = formData.get(key) === "on";
    for (const key of COLUMN_INTS) {
      const raw = str(formData, key);
      const n = Number(raw);
      update[key] = raw === "" || Number.isNaN(n) ? null : n;
    }

    // 2) El resto de flags se serializan en el campo "settings_json" del form.
    let settings: Record<string, unknown> = {};
    const rawSettings = str(formData, "settings_json");
    if (rawSettings) {
      try {
        settings = JSON.parse(rawSettings) as Record<string, unknown>;
      } catch {
        return { ok: false, error: "No se pudo leer la configuración avanzada." };
      }
    }

    // Merge no destructivo sobre el settings actual del tenant.
    const { data: current } = await sb
      .from("residentials")
      .select("settings")
      .eq("id", rid)
      .maybeSingle();
    const prevSettings = ((current as { settings: unknown } | null)?.settings ?? {}) as Record<string, unknown>;
    update.settings = { ...prevSettings, ...settings };

    const { error } = await sb.from("residentials").update(update as never).eq("id", rid);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/configuracion");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la configuración." };
  }
}

/* -------------------------------------------------------------------------- */
/*  Campos dinámicos del formulario de visita (visit_field_configs)           */
/* -------------------------------------------------------------------------- */
const FIELD_TYPES = ["text", "number", "select", "date", "phone", "photo"] as const;
const APPLIES_TO = ["visitor", "employee", "service", "all"] as const;

function parseOptions(raw: string): { value: string; label: string }[] {
  // Acepta una opción por línea (o separadas por coma). "valor=Etiqueta" o sólo "Etiqueta".
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.includes("=") ? line.split("=") : [line, line];
      return { value: value.trim(), label: (label ?? value).trim() };
    });
}

export async function saveField(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = str(formData, "id");
  const key = str(formData, "key");
  const label = str(formData, "label");
  if (!key) return { ok: false, error: "La clave (key) es obligatoria." };
  if (!label) return { ok: false, error: "La etiqueta es obligatoria." };

  const type = (str(formData, "type") || "text") as (typeof FIELD_TYPES)[number];
  if (!FIELD_TYPES.includes(type)) return { ok: false, error: "Tipo de campo inválido." };
  const applies_to = (str(formData, "applies_to") || "visitor") as (typeof APPLIES_TO)[number];
  if (!APPLIES_TO.includes(applies_to)) return { ok: false, error: "Destino inválido." };

  if (!isSupabaseConfigured) return { ok: true };

  try {
    const sb = await createClient();
    const rid = await tenantId(sb);
    if (!rid) return { ok: false, error: "Tu sesión no permite esta acción." };

    const sortRaw = Number(str(formData, "sort_order"));
    const payload = {
      key,
      label,
      type,
      applies_to,
      required: formData.get("required") === "on",
      visible: formData.get("visible") === "on",
      sort_order: Number.isNaN(sortRaw) ? 0 : sortRaw,
      options: type === "select" ? parseOptions(str(formData, "options")) : [],
    };

    if (id) {
      const { error } = await sb
        .from("visit_field_configs" as never)
        .update(payload as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await sb
        .from("visit_field_configs" as never)
        .insert({ ...payload, residential_id: rid } as never);
      if (error) {
        return { ok: false, error: error.code === "23505" ? "Ya existe un campo con esa clave para ese destino." : error.message };
      }
    }

    revalidatePath("/configuracion/campos");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el campo." };
  }
}

export async function toggleField(id: string, column: "visible" | "required", next: boolean): Promise<ActionState> {
  if (!id || (column !== "visible" && column !== "required")) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb
      .from("visit_field_configs" as never)
      .update({ [column]: next } as never)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/configuracion/campos");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el campo." };
  }
}

export async function deleteField(id: string): Promise<ActionState> {
  if (!id) return { ok: false, error: "Datos incompletos." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createClient();
    const { error } = await sb.from("visit_field_configs" as never).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/configuracion/campos");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el campo." };
  }
}
