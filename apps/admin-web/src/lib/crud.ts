import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EntityDef, EntityField } from "@/lib/entities";

// Capa de datos genérica del motor declarativo. Usa un cliente sin tipar
// (el esquema es dinámico); RLS en Supabase garantiza el aislamiento por tenant.
export type Row = Record<string, unknown>;
export type FkOption = { value: string; label: string };

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

/** Carga las opciones (value/label) para los campos FK de una entidad.
 *  Devuelve un mapa { fieldKey -> [{value,label}] } para inyectar en el cliente. */
export async function loadFkOptions(def: EntityDef): Promise<Record<string, FkOption[]>> {
  if (!isSupabaseConfigured) return {};
  const out: Record<string, FkOption[]> = {};
  const fkFields: EntityField[] = def.fields.filter((f) => f.type === "fk" && f.fk);
  if (fkFields.length === 0) return out;
  try {
    const sb: any = await createClient();
    await Promise.all(
      fkFields.map(async (f) => {
        const fk = f.fk!;
        let q = sb.from(fk.table).select(`id,${fk.labelKey}`);
        if (fk.filter) q = q.eq(fk.filter.col, fk.filter.val);
        const { data, error } = await q.limit(500);
        if (error || !data) {
          out[f.key] = [];
          return;
        }
        const rows = data as Array<Record<string, unknown>>;
        out[f.key] = rows
          .map((r) => ({
            value: String(r.id ?? ""),
            label: String(r[fk.labelKey] ?? r.id ?? ""),
          }))
          .filter((o) => o.value)
          .sort((a, b) => a.label.localeCompare(b.label));
      })
    );
    return out;
  } catch {
    return out;
  }
}
