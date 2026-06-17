"use client";

import * as React from "react";
import {
  QrCode, DoorOpen, Bell, Users, Megaphone, Building2, Home, MapPin, UserCircle,
  AlertTriangle, Search, Plus, Car, Footprints, ChevronLeft, ShieldCheck, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FieldCfg = { key: string; label: string; type: string; required: boolean; applies_to: string };

/* ============================ Marco de teléfono ============================ */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[760px] w-[380px] rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="absolute left-1/2 top-0 z-20 h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
      <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] bg-slate-50">
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ============================ App RESIDENTE ============================ */
function ResidentApp({ fields }: { fields: FieldCfg[] }) {
  const [screen, setScreen] = React.useState<"home" | "visitas" | "nueva" | "panico" | "perfil">("home");

  const tabs = [
    { k: "home", label: "Inicio", icon: Home },
    { k: "visitas", label: "Visitas", icon: DoorOpen },
    { k: "panico", label: "Pánico", icon: AlertTriangle },
    { k: "perfil", label: "Perfil", icon: UserCircle },
  ] as const;

  const homeCards = [
    { label: "QR", icon: QrCode }, { label: "Visitas", icon: DoorOpen }, { label: "Notificaciones", icon: Bell },
    { label: "Visitantes", icon: Users }, { label: "Avisos", icon: Megaphone }, { label: "Staff", icon: Building2 },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="bg-slate-800 px-5 pb-4 pt-6 text-white">
        <p className="text-lg font-extrabold">KG-<span className="text-brand-400">Visit</span></p>
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Residente · Sede Norte</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {screen === "home" && (
          <div className="grid grid-cols-2 gap-3">
            {homeCards.map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.label} onClick={() => c.label === "Visitas" && setScreen("visitas")}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-white shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></div>
                  <span className="text-xs font-medium text-slate-700">{c.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {screen === "visitas" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-slate-800">Mis visitas</p>
              <button onClick={() => setScreen("nueva")} className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Nueva</button>
            </div>
            {[{ n: "Visita familiar", s: "Autorizada", t: "amber" }, { n: "Repartidor Amazon", s: "Dentro", t: "green" }].map((v, i) => (
              <div key={i} className="mb-2 rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{v.n}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", v.t === "green" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{v.s}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Folio F-000{i + 1} · Transporte: Auto</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1 text-[11px] font-semibold text-white"><QrCode className="h-3 w-3" /> Ver QR</div>
              </div>
            ))}
          </div>
        )}

        {screen === "nueva" && (
          <div>
            <button onClick={() => setScreen("visitas")} className="mb-2 flex items-center gap-1 text-xs text-slate-500"><ChevronLeft className="h-4 w-4" /> Volver</button>
            <p className="mb-1 font-bold text-slate-800">Nueva visita</p>
            <p className="mb-3 rounded-lg bg-brand-50 px-2 py-1 text-[10px] text-brand-700">Formulario dinámico — definido por el administrador ({fields.length} campos activos)</p>
            <div className="space-y-3">
              {fields.length === 0 && <p className="text-xs text-slate-400">Sin campos configurados.</p>}
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">{f.label} {f.required && <span className="text-brand-500">*</span>}</label>
                  {f.type === "select"
                    ? <div className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-400">Seleccionar…</div>
                    : <div className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-300">{f.label}</div>}
                </div>
              ))}
              <button className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white">Generar QR</button>
            </div>
          </div>
        )}

        {screen === "panico" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 pt-16">
            <button className="grid h-40 w-40 place-items-center rounded-full bg-red-500 text-white shadow-lg active:scale-95">
              <div className="text-center"><AlertTriangle className="mx-auto h-12 w-12" /><span className="mt-1 block text-sm font-bold">PÁNICO</span></div>
            </button>
            <p className="text-xs text-slate-500">Mantén presionado para enviar alerta a caseta</p>
          </div>
        )}

        {screen === "perfil" && (
          <div className="space-y-2">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-500 font-bold text-white">JP</div>
              <div><p className="text-sm font-semibold text-slate-800">Juan Pérez</p><p className="text-[11px] text-slate-400">Cobra 101</p></div>
            </div>
            {["Actualizar perfil", "Cambiar contraseña", "Sonido de notificaciones", "Aviso de privacidad", "Sugerencias y quejas", "Chat de soporte", "Cerrar sesión"].map((o) => (
              <div key={o} className="rounded-lg bg-white px-3 py-2.5 text-xs text-slate-600 shadow-sm">{o}</div>
            ))}
          </div>
        )}
      </div>

      {/* bottom nav */}
      <div className="grid grid-cols-4 border-t border-slate-200 bg-white">
        {tabs.map((t) => {
          const Icon = t.icon; const active = screen === t.k || (t.k === "visitas" && screen === "nueva");
          return (
            <button key={t.k} onClick={() => setScreen(t.k)} className={cn("flex flex-col items-center gap-0.5 py-2", active ? "text-brand-500" : "text-slate-400")}>
              <Icon className="h-5 w-5" /><span className="text-[10px]">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ App CASETA ============================ */
function GuardApp() {
  const [screen, setScreen] = React.useState<"caseta" | "main" | "nueva">("caseta");
  return (
    <div className="flex h-full flex-col">
      {screen === "caseta" && (
        <div className="flex h-full flex-col items-center justify-center gap-6 bg-brand-500 p-6 text-white">
          <p className="text-center text-lg font-bold">¿En qué caseta te encuentras?</p>
          <button onClick={() => setScreen("main")} className="flex w-48 flex-col items-center gap-2 rounded-2xl bg-white/15 p-6">
            <ShieldCheck className="h-10 w-10" /><span className="font-semibold">Caseta Principal</span>
          </button>
        </div>
      )}
      {screen !== "caseta" && (
        <>
          <div className="bg-brand-500 px-4 pb-3 pt-6 text-white">
            <div className="flex items-center justify-between">
              <p className="font-extrabold">KG-Visit <span className="text-[10px] font-normal opacity-80">Caseta</span></p>
              <button onClick={() => setScreen("caseta")} className="text-[10px] opacity-80">Cambiar caseta</button>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs"><Search className="h-3.5 w-3.5" /> Buscar visita…</div>
            <div className="mt-2 flex gap-2">
              <span className="flex-1 rounded-lg bg-white/15 py-1.5 text-center text-[11px]"><Car className="mr-1 inline h-3 w-3" />QR Auto</span>
              <span className="flex-1 rounded-lg bg-white/15 py-1.5 text-center text-[11px]"><Footprints className="mr-1 inline h-3 w-3" />QR Caminando</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <button onClick={() => setScreen("nueva")} className="mb-3 flex w-full items-center justify-center gap-1 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Nueva visita</button>
            {screen === "main" && [{ n: "Visita familiar", d: "Cobra 101", s: "Dentro" }, { n: "CFE — Corte", d: "Escorpión 22", s: "Salió" }].map((v, i) => (
              <div key={i} className="mb-2 rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">{v.n}</span><span className="text-[10px] text-slate-400">{v.s}</span></div>
                <p className="text-[11px] text-slate-400">{v.d}</p>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded bg-ink-900 px-2 py-1 text-[10px] text-white">Dar acceso</span>
                  <span className="rounded bg-blue-500 px-2 py-1 text-[10px] text-white">Paquetería</span>
                  <span className="rounded bg-red-500 px-2 py-1 text-[10px] text-white">Reportar</span>
                </div>
              </div>
            ))}
            {screen === "nueva" && (
              <div>
                <button onClick={() => setScreen("main")} className="mb-2 flex items-center gap-1 text-xs text-slate-500"><ChevronLeft className="h-4 w-4" /> Volver</button>
                <p className="mb-3 text-sm font-bold text-slate-800">Tipo de ingreso</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ l: "Visita Vehícular", i: Car }, { l: "Visita Peatonal", i: Footprints }, { l: "Multidomicilio", i: Building2 }, { l: "Ingreso de colono", i: UserCircle }].map((t) => {
                    const Icon = t.i;
                    return <div key={t.l} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-white shadow-sm"><Icon className="h-7 w-7 text-brand-500" /><span className="px-1 text-center text-[11px] font-medium text-slate-700">{t.l}</span></div>;
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ Emulador ============================ */
export function EmuladorClient({ fields }: { fields: FieldCfg[] }) {
  const [app, setApp] = React.useState<"residente" | "caseta">("residente");
  return (
    <div>
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-fit">
        {([["residente", "App Residente", Smartphone], ["caseta", "App Caseta", ShieldCheck]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setApp(k)}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors", app === k ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100")}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <Phone>{app === "residente" ? <ResidentApp fields={fields} /> : <GuardApp />}</Phone>
        <p className="max-w-md text-center text-xs text-slate-400">
          Simulación interactiva de las apps móviles dentro del portal. El formulario de “Nueva visita”
          del residente se arma con los <strong>campos configurables</strong> del administrador (Configuración → Campos de visita).
        </p>
      </div>
    </div>
  );
}
