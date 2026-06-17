"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Home,
  Factory,
  Loader2,
  Check,
  SlidersHorizontal,
  ListChecks,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { saveConfig, type ActionState } from "./actions";

/* -------------------------------------------------------------------------- */
/*  Tipos y defaults compartidos con el server component                      */
/* -------------------------------------------------------------------------- */
export type TenantConfig = {
  qr_enabled: boolean;
  reservations: boolean;
  lpr: boolean;
  repuve: boolean;
  facial: boolean;
  resident_app: boolean;
  company_mode: boolean;
  confirmation_wait_time: number;
  visitor_expiration_time: number;
  settings: Record<string, unknown>;
};

export const DEFAULT_CONFIG: TenantConfig = {
  qr_enabled: true,
  reservations: false,
  lpr: false,
  repuve: false,
  facial: false,
  resident_app: true,
  company_mode: false,
  confirmation_wait_time: 0,
  visitor_expiration_time: 24,
  settings: {},
};

/* -------------------------------------------------------------------------- */
/*  Catálogo de flags (selección amplia y representativa de docs/14)          */
/*  source: "col" = columna tipada de residentials; "set" = settings jsonb.   */
/* -------------------------------------------------------------------------- */
type Flag = { key: string; label: string; desc: string; source: "col" | "set"; def?: boolean };
type Group = { title: string; icon: typeof Home; flags: Flag[] };

const GROUPS: Group[] = [
  {
    title: "Accesos / QR",
    icon: ListChecks,
    flags: [
      { key: "qr_enabled", label: "Acceso por QR", desc: "Habilita el módulo de QR (maestro).", source: "col", def: true },
      { key: "qr_visitors", label: "QR para visitantes", desc: "Permite generar QR de visitantes.", source: "set", def: true },
      { key: "qr_employees", label: "QR para empleados", desc: "QR para empleados / personal.", source: "set" },
      { key: "qr_numeric", label: "QR numérico", desc: "Código corto tecleable en vez de gráfico.", source: "set" },
      { key: "walking_qr", label: "QR peatonal", desc: "Acceso caminando sin vehículo.", source: "set" },
      { key: "secret_code", label: "Código secreto", desc: "Código adicional para validar el acceso.", source: "set" },
      { key: "frequently_by_plate", label: "Frecuentes por placa", desc: "Identifica visitantes frecuentes por placa.", source: "set" },
      { key: "hide_qr_for_construction", label: "Ocultar QR en construcción", desc: "Sin QR en casas de tipo construcción.", source: "set" },
      { key: "camera_qr_reader", label: "Lector QR por cámara", desc: "Usa la cámara como lector en caseta.", source: "set" },
    ],
  },
  {
    title: "Facial / Hardware",
    icon: SlidersHorizontal,
    flags: [
      { key: "lpr", label: "Lectura de placas (LPR)", desc: "Reconocimiento automático de placas.", source: "col" },
      { key: "repuve", label: "Validación REPUVE", desc: "Consulta de placas contra REPUVE.", source: "col" },
      { key: "facial", label: "Reconocimiento facial", desc: "Facial maestro (Hikvision / ZKTeco / Alocity).", source: "col" },
      { key: "facial_hikvision", label: "Facial Hikvision", desc: "Reconocimiento facial vía Hikvision.", source: "set" },
      { key: "facial_zkteco", label: "Facial ZKTeco", desc: "Reconocimiento facial vía ZKTeco.", source: "set" },
      { key: "facial_blacklist", label: "Lista negra facial", desc: "Bloquea rostros vetados.", source: "set" },
      { key: "visitor_facial", label: "Facial de visitantes", desc: "Captura / valida rostro de visitantes.", source: "set" },
      { key: "employee_facial", label: "Facial de empleados", desc: "Captura / valida rostro de empleados.", source: "set" },
      { key: "resident_facial", label: "Facial de residentes", desc: "Captura / valida rostro de residentes.", source: "set" },
    ],
  },
  {
    title: "Fotos",
    icon: ListChecks,
    flags: [
      { key: "manual_visit_photos", label: "Fotos manuales de visita", desc: "El guardia toma fotos de la visita.", source: "set", def: true },
      { key: "employee_tablet_photo", label: "Foto de empleado en tablet", desc: "Foto del empleado desde la tablet de caseta.", source: "set" },
      { key: "autoservice_tablet", label: "Tablet autoservicio", desc: "El visitante se registra y fotografía.", source: "set" },
      { key: "leave_vouchers_visit", label: "Comprobantes al salir", desc: "Adjuntar fotos al dar salida a la visita.", source: "set" },
    ],
  },
  {
    title: "Reservaciones / Amenidades",
    icon: ListChecks,
    flags: [
      { key: "reservations", label: "Reservación de amenidades", desc: "Activa el módulo de reservaciones.", source: "col" },
      { key: "reservation_facial_auth", label: "Facial en amenidad", desc: "Facial para acceder a la amenidad reservada.", source: "set" },
      { key: "amenity_guests", label: "Invitados a amenidades", desc: "Permite invitados a amenidades.", source: "set" },
      { key: "amenity_upload_payment_receipt", label: "Comprobante de pago", desc: "Subir comprobante de pago de la amenidad.", source: "set" },
      { key: "open_events", label: "Eventos abiertos", desc: "Habilita eventos abiertos.", source: "set" },
    ],
  },
  {
    title: "Empresa / Corporativo",
    icon: Building2,
    flags: [
      { key: "company_mode", label: "Modo corporativo", desc: "Activa el modo empresa (maestro).", source: "col" },
      { key: "company_auto_authorize", label: "Autoautorizar visitas", desc: "Autoriza visitas automáticamente.", source: "set" },
      { key: "company_staff_qr", label: "QR de staff", desc: "QR para el staff de la empresa.", source: "set" },
      { key: "company_recurrent_qrs", label: "QR recurrentes", desc: "QR reutilizables para visitas.", source: "set" },
      { key: "company_show_address_on_qr", label: "Dirección en el QR", desc: "Muestra la dirección en el QR.", source: "set" },
      { key: "pre_register_manual_authorization", label: "Pre-registro con autorización", desc: "El pre-registro requiere aprobación manual.", source: "set" },
      { key: "airbnb", label: "Módulo Airbnb", desc: "Gestión de huéspedes Airbnb.", source: "set" },
    ],
  },
  {
    title: "Residentes / App",
    icon: Home,
    flags: [
      { key: "resident_app", label: "App del residente", desc: "Habilita la app del residente (maestro).", source: "col", def: true },
      { key: "resident_visits", label: "Residente crea visitas", desc: "El residente registra visitas desde la app.", source: "set", def: true },
      { key: "resident_update_visitors", label: "Editar visitantes", desc: "El residente puede editar sus visitantes.", source: "set", def: true },
      { key: "resident_access_by_plate", label: "Acceso por placa", desc: "Acceso del residente por placa.", source: "set" },
      { key: "show_qr_folio_to_residents", label: "Folio del QR visible", desc: "Muestra el folio del QR a los residentes.", source: "set" },
      { key: "access_chat", label: "Chat de acceso", desc: "Chat residente ↔ caseta.", source: "set" },
      { key: "admin_chat", label: "Chat con administración", desc: "Mensajería con administración.", source: "set" },
      { key: "surveys", label: "Encuestas", desc: "Módulo de encuestas a residentes.", source: "set" },
      { key: "suggestions", label: "Sugerencias y quejas", desc: "Buzón de la comunidad.", source: "set" },
    ],
  },
  {
    title: "Operación / Caseta",
    icon: SlidersHorizontal,
    flags: [
      { key: "guard_create_visits", label: "Guardia crea visitas", desc: "El guardia puede crear visitas.", source: "set", def: true },
      { key: "guard_in_visits", label: "Guardia da acceso", desc: "El guardia puede dar entrada.", source: "set", def: true },
      { key: "guard_shipping_notification", label: "Notif. de paquetería", desc: "Notificación de paquetería desde caseta.", source: "set" },
      { key: "dashboard_employees", label: "Empleados en dashboard", desc: "Muestra empleados en el dashboard.", source: "set" },
      { key: "timeline_custom_visit_types", label: "Tipos de visita propios", desc: "Tipos de visita personalizados en el timeline.", source: "set" },
      { key: "timeline_hide_service", label: "Ocultar servicio", desc: "Oculta visitas de servicio en el timeline.", source: "set" },
    ],
  },
];

const COLUMN_INTS: { key: "confirmation_wait_time" | "visitor_expiration_time"; label: string; suffix: string }[] = [
  { key: "confirmation_wait_time", label: "Espera de confirmación", suffix: "min" },
  { key: "visitor_expiration_time", label: "Expiración de visita", suffix: "h" },
];

const MODES = [
  { id: "residential", label: "Residencial", icon: Home, desc: "Fraccionamientos y condominios." },
  { id: "corporate", label: "Corporativo", icon: Building2, desc: "Oficinas y campus empresariales." },
  { id: "industrial", label: "Industrial", icon: Factory, desc: "Plantas y parques industriales." },
];

// Total de flags booleanos expuestos (columnas + settings).
const FLAG_COUNT = GROUPS.reduce((acc, g) => acc + g.flags.length, 0);

/* -------------------------------------------------------------------------- */
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-brand-500" : "bg-slate-300")}
      aria-pressed={on}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function ConfigClient({ initial }: { initial: TenantConfig }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Estado unificado de todos los flags booleanos (col + set), por su key.
  const [flags, setFlags] = React.useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const g of GROUPS) {
      for (const f of g.flags) {
        if (f.source === "col") {
          out[f.key] = Boolean((initial as Record<string, unknown>)[f.key]);
        } else {
          const v = initial.settings[f.key];
          out[f.key] = v == null ? Boolean(f.def) : Boolean(v);
        }
      }
    }
    return out;
  });

  const [ints, setInts] = React.useState<Record<string, number>>({
    confirmation_wait_time: initial.confirmation_wait_time,
    visitor_expiration_time: initial.visitor_expiration_time,
  });

  const [mode, setMode] = React.useState<string>(() => {
    const m = initial.settings.operation_mode;
    if (m === "corporate" || m === "industrial") return m;
    return initial.company_mode ? "corporate" : "residential";
  });

  function setFlag(key: string) {
    setSaved(false);
    setFlags((s) => ({ ...s, [key]: !s[key] }));
  }

  function onSave() {
    setError(null);
    setSaved(false);

    const fd = new FormData();
    // Columnas tipadas booleanas.
    for (const g of GROUPS) {
      for (const f of g.flags) {
        if (f.source === "col" && flags[f.key]) fd.set(f.key, "on");
      }
    }
    // company_mode también se deriva del modo de operación seleccionado.
    if (mode === "corporate") fd.set("company_mode", "on");
    else fd.delete("company_mode");

    // Columnas enteras.
    fd.set("confirmation_wait_time", String(ints.confirmation_wait_time ?? 0));
    fd.set("visitor_expiration_time", String(ints.visitor_expiration_time ?? 0));

    // Resto de flags → settings jsonb.
    const settings: Record<string, unknown> = { operation_mode: mode };
    for (const g of GROUPS) {
      for (const f of g.flags) {
        if (f.source === "set") settings[f.key] = !!flags[f.key];
      }
    }
    fd.set("settings_json", JSON.stringify(settings));

    start(async () => {
      const res: ActionState = await saveConfig(null, fd);
      if (res?.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res?.error ?? "No se pudo guardar.");
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Personaliza módulos, formularios y comportamiento de las apps de este administrador."
        actions={
          <div className="flex items-center gap-2">
            {saved && (
              <Badge tone="green">
                <Check className="h-3.5 w-3.5" /> Guardado
              </Badge>
            )}
            <Button onClick={onSave} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </div>
        }
      />

      {/* Tabs / navegación */}
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200">
        <span className="border-b-2 border-brand-500 px-1 pb-2 text-sm font-semibold text-brand-700">
          Módulos y flags
        </span>
        <Link
          href="/configuracion/campos"
          className="px-1 pb-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Campos de visita
        </Link>
      </div>

      {/* Modo de operación */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Modo de operación</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); setSaved(false); }}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  active ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-slate-400")} />
                <div>
                  <p className="font-semibold text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </CardBody>
      </Card>

      {/* Parámetros numéricos */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Parámetros de operación</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COLUMN_INTS.map((p) => (
            <div key={p.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{p.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={ints[p.key]}
                  onChange={(e) => { setInts((s) => ({ ...s, [p.key]: Number(e.target.value) })); setSaved(false); }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                <span className="text-xs text-slate-400">{p.suffix}</span>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Toggles agrupados por categoría */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <Card key={g.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-brand-500" /> {g.title}
                </CardTitle>
                <Badge tone="slate">{g.flags.length}</Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                {g.flags.map((f) => (
                  <div key={f.key} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                    <Toggle on={!!flags[f.key]} onClick={() => setFlag(f.key)} />
                  </div>
                ))}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {FLAG_COUNT} opciones configurables en esta vista. El resto se conserva en <code>settings</code>.
        </p>
        <Button onClick={onSave} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar cambios
        </Button>
      </div>
    </>
  );
}
