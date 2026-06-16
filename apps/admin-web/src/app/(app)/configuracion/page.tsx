"use client";

import * as React from "react";
import { Building2, Home, Factory } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type Flag = { key: string; label: string; desc: string; on: boolean };
const GROUPS: { title: string; flags: Flag[] }[] = [
  {
    title: "Accesos y QR",
    flags: [
      { key: "qr", label: "Acceso por QR", desc: "Visitantes ingresan mostrando código QR.", on: true },
      { key: "qrEmployees", label: "QR para empleados", desc: "Empleados domésticos / staff con QR.", on: true },
      { key: "walkingQr", label: "QR peatonal", desc: "Acceso caminando sin vehículo.", on: true },
      { key: "secretCode", label: "Código secreto", desc: "Alternativa al QR mediante código.", on: false },
      { key: "visitorExpiration", label: "Expiración de visitas", desc: "Las visitas caducan tras un tiempo.", on: true },
    ],
  },
  {
    title: "Seguridad y hardware",
    flags: [
      { key: "lpr", label: "Lectura de placas (LPR)", desc: "Reconocimiento automático de placas.", on: true },
      { key: "repuve", label: "Validación REPUVE", desc: "Consulta de reporte de robo.", on: true },
      { key: "facial", label: "Reconocimiento facial", desc: "Hikvision / ZKTeco / Alocity.", on: false },
      { key: "blacklist", label: "Lista negra", desc: "Bloqueo automático de vetados.", on: true },
    ],
  },
  {
    title: "Comunidad y módulos",
    flags: [
      { key: "reservations", label: "Reservación de amenidades", desc: "Espacios reservables con pago.", on: true },
      { key: "packages", label: "Paquetería", desc: "Notificación de paquetes por unidad.", on: true },
      { key: "suggestions", label: "Sugerencias y quejas", desc: "Buzón de la comunidad.", on: true },
      { key: "chat", label: "Chat staff ↔ guardia", desc: "Mensajería en tiempo real.", on: true },
    ],
  },
];

const MODES = [
  { id: "residential", label: "Residencial", icon: Home, desc: "Fraccionamientos y condominios." },
  { id: "corporate", label: "Corporativo", icon: Building2, desc: "Oficinas y campus empresariales." },
  { id: "industrial", label: "Industrial", icon: Factory, desc: "Plantas y parques industriales." },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-brand-500" : "bg-slate-300")}
      aria-pressed={on}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export default function ConfiguracionPage() {
  const [mode, setMode] = React.useState("residential");
  const [state, setState] = React.useState(() =>
    Object.fromEntries(GROUPS.flatMap((g) => g.flags.map((f) => [f.key, f.on])))
  );

  return (
    <>
      <PageHeader title="Configuración" subtitle="Modo de operación y módulos activos del tenant (equivale a los feature flags de V1)." />

      <Card className="mb-6">
        <CardHeader><CardTitle>Modo de operación</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <Card key={g.title}>
            <CardHeader><CardTitle>{g.title}</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              {g.flags.map((f) => (
                <div key={f.key} className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-medium text-slate-800">{f.label}</p><p className="text-xs text-slate-500">{f.desc}</p></div>
                  <Toggle on={!!state[f.key]} onClick={() => setState((s) => ({ ...s, [f.key]: !s[f.key] }))} />
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
