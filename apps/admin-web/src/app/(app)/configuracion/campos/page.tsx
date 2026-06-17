import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CamposClient, type VisitField } from "./CamposClient";

export default async function CamposPage() {
  let fields: VisitField[] = [];

  if (isSupabaseConfigured) {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (auth.user) {
      const { data: u } = await sb
        .from("users")
        .select("residential_id")
        .eq("auth_user_id", auth.user.id)
        .maybeSingle();
      const rid = (u as { residential_id: string } | null)?.residential_id ?? null;
      if (rid) {
        // visit_field_configs no está en los tipos generados (tabla propuesta): casteamos en el borde.
        const { data } = await (sb.from("visit_field_configs" as never) as any)
          .select("id, key, label, type, required, visible, sort_order, applies_to, options")
          .eq("residential_id", rid)
          .order("sort_order", { ascending: true });
        fields = ((data ?? []) as VisitField[]).map((f) => ({
          ...f,
          options: Array.isArray(f.options) ? f.options : [],
        }));
      }
    }
  }

  return <CamposClient fields={fields} />;
}
