"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Flag } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import type { VisitDetail } from "@/lib/data";
import type { VisitKind, VisitStatus } from "@/lib/types";
import {
  authorizeVisit, denyVisit, giveAccess, markLeave, reportVisit, notifyPackage, type ActionState,
} from "../actions";

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

export function VisitDetailClient({ visit: v }: { visit: VisitDetail }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function run(action: (id: string) => Promise<ActionState>) {
    setError(null);
    start(async () => {
      const res = await action(v.id);
      if (res && !res.ok) {
        setError(res.error ?? "No se pudo completar la acción.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Link href="/visitas" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Volver a visitas
      </Link>

      <PageHeader
        title={v.title}
        subtitle={`Folio ${v.folio} · ${KIND_LABEL[v.kind]}`}
        actions={
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
              <Button variant="dark" disabled={pending} onClick={() => run(markLeave)}>Marcar salida</Button>
            )}
            <Button variant="outline" disabled={pending} onClick={() => run(notifyPackage)}>
              <Package className="h-4 w-4" /> Paquetería
            </Button>
            <Button variant="danger" disabled={pending} onClick={() => run(reportVisit)}>
              <Flag className="h-4 w-4" /> Reportar
            </Button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
        <Badge tone="violet">{KIND_LABEL[v.kind]}</Badge>
        {v.createdByGuard && <Badge tone="slate">Creada por guardia</Badge>}
        {v.walking && <Badge tone="blue">Caminando</Badge>}
        {v.privateFlag && <Badge tone="slate">Privada</Badge>}
        {v.quick && <Badge tone="amber">Rápida</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Datos de la visita</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Quién" value={v.who} />
              <Row label="Domicilio" value={v.houseAddress} />
              {v.plate && <Row label="Placa" value={v.plate} />}
              {v.boothName && <Row label="Caseta" value={v.boothName} />}
              {v.serviceName && <Row label="Servicio" value={v.serviceName} />}
              {v.employeeName && <Row label="Empleado" value={v.employeeName} />}
              {v.providerName && <Row label="Proveedor" value={v.providerName} />}
              {v.transportName && <Row label="Transporte" value={v.transportName} />}
              {v.subject && <Row label="Asunto" value={v.subject} />}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Fechas y reporte</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Llegada" value={formatDateTime(v.arriveDate)} />
              <Row label="Entrada" value={formatDateTime(v.enterDate)} />
              <Row label="Salida" value={formatDateTime(v.leaveDate)} />
              <Row label="Vigencia" value={formatDateTime(v.dueDate)} />
              <Row label="Reporte de guardia" value={v.guardReport ? "Sí" : "No"} />
            </dl>
          </CardBody>
        </Card>

        {(v.details || v.notes || v.reason) && (
          <Card className="lg:col-span-2">
            <CardBody>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Notas y detalles</h3>
              <div className="space-y-3 text-sm">
                {v.details && <Block title="Detalles" body={v.details} />}
                {v.notes && <Block title="Notas" body={v.notes} />}
                {v.reason && <Block title="Motivo" body={v.reason} />}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate-700">{body}</p>
    </div>
  );
}
