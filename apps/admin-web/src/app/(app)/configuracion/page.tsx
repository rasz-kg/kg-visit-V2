import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConfigClient, type TenantConfig, DEFAULT_CONFIG } from "./ConfigClient";

export default async function ConfiguracionPage() {
  let config: TenantConfig = DEFAULT_CONFIG;

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
        const { data: r } = await sb
          .from("residentials")
          .select(
            "qr_enabled, reservations, lpr, repuve, facial, resident_app, company_mode, confirmation_wait_time, visitor_expiration_time, settings"
          )
          .eq("id", rid)
          .maybeSingle();
        if (r) {
          const row = r as Record<string, unknown>;
          const settings = (row.settings ?? {}) as Record<string, unknown>;
          config = {
            qr_enabled: Boolean(row.qr_enabled),
            reservations: Boolean(row.reservations),
            lpr: Boolean(row.lpr),
            repuve: Boolean(row.repuve),
            facial: Boolean(row.facial),
            resident_app: Boolean(row.resident_app),
            company_mode: Boolean(row.company_mode),
            confirmation_wait_time: Number(row.confirmation_wait_time ?? 0),
            visitor_expiration_time:
              row.visitor_expiration_time == null ? 24 : Number(row.visitor_expiration_time),
            settings,
          };
        }
      }
    }
  }

  return <ConfigClient initial={config} />;
}
