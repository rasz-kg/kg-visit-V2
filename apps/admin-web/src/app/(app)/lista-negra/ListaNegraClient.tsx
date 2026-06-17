"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Car, User, Loader2, RotateCcw } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import type { Plate } from "@/lib/types";
import type { BlockedIncident } from "@/lib/data";
import { setPlateList } from "../autos/actions";

export function ListaNegraClient({ plates, incidents }: { plates: Plate[]; incidents: BlockedIncident[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function clearPlate(p: Plate) {
    if (!confirm(`¿Quitar ${p.number} de la lista?`)) return;
    setBusyId(p.id); setError(null);
    start(async () => {
      const res = await setPlateList(p.id, "none");
      if (res && !res.ok) setError(res.error ?? "Error.");
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader title="Lista negra" subtitle="Autos y visitantes vetados o en lista gris. Bloqueo de acceso automático en caseta." />

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Car className="h-4 w-4 text-red-500" /> Placas</CardTitle><Badge tone="red">{plates.length}</Badge></CardHeader>
          <div className="divide-y divide-slate-50">
            {plates.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-mono font-semibold text-slate-800">{p.number}</p>
                  <p className="text-xs text-slate-400">{[p.brand, p.model, p.color, p.state].filter(Boolean).join(" · ") || "Sin datos del vehículo"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={p.list === "graylist" ? "amber" : "red"}>{p.list === "graylist" ? "Lista gris" : p.list === "report" ? "Reportada" : "Lista negra"}</Badge>
                  <Button variant="outline" className="px-2 py-1.5" onClick={() => clearPlate(p)} disabled={pending && busyId === p.id} title="Quitar de la lista">
                    {pending && busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
            {plates.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">Sin placas vetadas. Marca una desde Autos y placas.</div>}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-red-500" /> Incidentes con veto</CardTitle><Badge tone="red">{incidents.length}</Badge></CardHeader>
          <div className="divide-y divide-slate-50">
            {incidents.map((i) => (
              <div key={i.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500"><Ban className="h-4 w-4" /></div>
                <div>
                  <p className="font-medium text-slate-800">{i.reason}</p>
                  <p className="text-xs text-slate-400">Reportó: {i.reporter} · {formatDateTime(i.date)}</p>
                </div>
              </div>
            ))}
            {incidents.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">Sin incidentes marcados para lista negra.</div>}
          </div>
        </Card>
      </div>
    </>
  );
}
