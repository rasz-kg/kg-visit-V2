import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EntityDef } from "@/lib/entities";

// Capa de datos genérica del motor declarativo. Usa un cliente sin tipar
// (el esquema es dinámico); RLS en Supabase garantiza el aislamiento por tenant.
export type Row = Record<string, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getTenantId(sb: any): Promise<string | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return null;
  const { data } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
  return data?.residential_id ?? null;
}

export async function listEntity(def: EntityDef): Promise<Row[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const sb: any = await createClient();
    let q = sb.from(def.table).select("*");
    if (def.softDelete) q = q.eq("deleted", false);
    const { data, error } = await q.limit(500);
    if (error) return [];
    const rows = (data ?? []) as Row[];
    const sortKey = def.columns[0]?.key ?? "id";
    return rows.sort((a, b) => String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")));
  } catch {
    return [];
  }
}
