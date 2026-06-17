import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageHeader } from "@/components/ui";
import { EmuladorClient } from "./EmuladorClient";

/* eslint-disable @typescript-eslint/no-explicit-any */
type FieldCfg = { key: string; label: string; type: string; required: boolean; applies_to: string };

const DEMO_FIELDS: FieldCfg[] = [
  { key: "company", label: "Empresa", type: "text", required: false, applies_to: "all" },
  { key: "driver", label: "Nombre del conductor", type: "text", required: true, applies_to: "all" },
  { key: "subject", label: "Asunto de la visita", type: "text", required: true, applies_to: "all" },
  { key: "host", label: "A quién visita", type: "text", required: true, applies_to: "all" },
  { key: "plates", label: "Placas", type: "text", required: false, applies_to: "visitor" },
  { key: "vehicle", label: "Tipo de vehículo", type: "select", required: false, applies_to: "visitor" },
];

export default async function EmuladorPage() {
  let fields: FieldCfg[] = DEMO_FIELDS;
  if (isSupabaseConfigured) {
    try {
      const sb: any = await createClient();
      const { data: auth } = await sb.auth.getUser();
      if (auth?.user) {
        const { data: u } = await sb.from("users").select("residential_id").eq("auth_user_id", auth.user.id).maybeSingle();
        const rid = u?.residential_id;
        if (rid) {
          const { data } = await sb.from("visit_field_configs").select("key,label,type,required,applies_to")
            .eq("residential_id", rid).eq("visible", true).order("sort_order");
          if (data && data.length) fields = data as FieldCfg[];
        }
      }
    } catch { /* usa DEMO_FIELDS */ }
  }

  return (
    <>
      <PageHeader
        title="Emulador de apps"
        subtitle="Simulación interactiva de las apps móviles (residente y caseta) dentro del portal."
      />
      <EmuladorClient fields={fields} />
    </>
  );
}
