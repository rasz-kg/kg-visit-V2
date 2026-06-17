"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Footprints, QrCode, Package, Flag, Search, Filter, Loader2,
} from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { formatDateTime } from "@/lib/utils";
import type { Visit, VisitKind, VisitStatus } from "@/lib/types";
import {
  authorizeVisit, denyVisit, giveAccess, markLeave, reportVisit, notifyPackage, createVisit, type ActionState,
} from "./actions";

interface HouseOption { id: string; address: string }

const KIND_LABEL: Record<VisitKind, string> = {
  visitor: "Visitante", employee: "Empleado", service: "Servicio",
  resident: "Residente", provider: "Proveedor", event: "Evento",
};
const STATUS_LABEL: Record<VisitStatus, string> = {
  pending: "Pendiente", authorized: "Autorizado", denied: "Denegado",
  inside: "Dentro", finished: "Salió", canceled: "Cancelado", expired: "Expirado",
};
const STATUS_TONE: Record<VisitStatus, "amber" | "blue" | "red" | "green" | "slate"> = {
  pending: "amber", authorized: "blue", denied: "red", inside: "green",
  finished: "slate", canceled: "slate", expired: "slate",
};

export function VisitasClient({ visits: allVisits, houses, initialQuery = "" }: { visits: Visit[]; houses: HouseOption[]; initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState(initialQuery);
  const [kind, setKind] = React.useState<string>("all");
  const [status, setStatus] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const visits = allVisits.filter(
    (v) =>
      (kind === "all" || v.kind === kind) &&
      (status === "all" || v.status === status) &&
      (q === "" || `${v.title} ${v.who} ${v.houseAddress} ${v.plate ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createVisit(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); } else setError(res?.error ?? "Error.");
    });
  }

  return (
    <>
      <PageHeader
        title="Visitas"
        subtitle="Control de accesos en tiempo real — autoriza, registra entrada/salida y reporta."
        actions={
          <>
            <Button variant="outline" title="La generación de QR Auto/Caminando se realiza desde la app de caseta o residente." disabled><QrCode className="h-4 w-4" /> QR Auto</Button>
            <Button variant="outline" title="La generación de QR Auto/Caminando se realiza desde la app de caseta o residente." disabled><Footprints className="h-4 w-4" /> QR Caminando</Button>
            <Button onClick={() => { setError(null); setOpen(true); }}><Plus className="h-4 w-4" /> Nueva visita</Button>
          </>
        }
      />

      <Card className="mb-5 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por visita, persona, domicilio o placa…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <option value="all">Tipo de visita</option>
              {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <option value="all">Estatus</option>
              {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {visits.map((v) => <VisitRowCard key={v.id} v={v} />)}
        {visits.length === 0 && (
          <Card className="p-10 text-center text-sm text-slate-500">Sin visitas que coincidan con los filtros.</Card>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva visita">
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de visita</label>
            <select name="kind" defaultValue="visitor" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
              {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del visitante</label>
            <input name="who" placeholder="Ej. María López"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Domicilio destino</label>
            <select name="house_id" defaultValue="" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
              <option value="">— Sin asignar —</option>
              {houses.map((h) => <option key={h.id} value={h.id}>{h.address}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Asunto / motivo</label>
            <input name="subject" placeholder="Ej. Visita familiar"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
          </div>
          <p className="text-xs text-slate-400">Se registra como <strong>pendiente</strong>; podrás autorizarla y darle acceso desde la lista.</p>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Registrar visita</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function VisitRowCard({ v }: { v: Visit }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function run(action: (id: string) => Promise<ActionState>) {
    setError(null);
    startTransition(async () => {
      const res = await action(v.id);
      if (res && !res.ok) {
        setError(res.error ?? "No se pudo completar la acción.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href={`/visitas/${v.id}`} className="min-w-0 flex-1 cursor-pointer rounded-md -m-1 p-1 hover:bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 hover:text-brand-600">{v.title}</span>
            <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
            <Badge tone="violet">{KIND_LABEL[v.kind]}</Badge>
            {v.createdByGuard && <Badge tone="slate">Creada por guardia</Badge>}
            {v.walking && <Badge tone="blue">Caminando</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {v.who} · {v.houseAddress}{v.site ? ` · ${v.site}` : ""}{v.plate ? ` · 🚗 ${v.plate}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Llegada: {formatDateTime(v.arriveDate)} · Salida: {formatDateTime(v.leaveDate)}
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </Link>
        <div className="flex flex-wrap gap-2">
          {v.status === "pending" && (
            <>
              <Button disabled={pending} onClick={() => run(authorizeVisit)}>Autorizar</Button>
              <Button variant="outline" disabled={pending} onClick={() => run(denyVisit)}>Denegar</Button>
            </>
          )}
          {v.status === "authorized" && (
            <Button variant="dark" disabled={pending} onClick={() => run(giveAccess)}>Dar acceso</Button>
          )}
          {v.status === "inside" && (
            <Button variant="dark" disabled={pending} onClick={() => run(markLeave)}>Salida</Button>
          )}
          <Button variant="outline" disabled={pending} onClick={() => run(notifyPackage)}>
            <Package className="h-4 w-4" /> Paquetería
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => run(reportVisit)}>
            <Flag className="h-4 w-4" /> Reportar
          </Button>
        </div>
      </div>
    </Card>
  );
}
