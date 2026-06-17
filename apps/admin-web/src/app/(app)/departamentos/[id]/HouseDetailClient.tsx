"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import type { HouseDetail } from "@/lib/data";
import type { HouseKind } from "@/lib/types";
import { toggleDefaulter, deleteHouse } from "../actions";

const KIND_LABEL: Record<HouseKind, string> = {
  inhabited: "Habitada", build: "Residencia",
  construction: "En construcción", land: "Terreno", rent: "Renta",
};

export function HouseDetailClient({ house: h }: { house: HouseDetail }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onToggle() {
    setError(null);
    start(async () => {
      const res = await toggleDefaulter(h.id, !h.defaulter);
      if (res && !res.ok) setError(res.error ?? "No se pudo actualizar.");
      else router.refresh();
    });
  }
  function onDelete() {
    if (!confirm(`¿Eliminar "${h.address}"?`)) return;
    setError(null);
    start(async () => {
      const res = await deleteHouse(h.id);
      if (res && !res.ok) setError(res.error ?? "No se pudo eliminar.");
      else router.push("/departamentos");
    });
  }

  return (
    <>
      <Link href="/departamentos" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Volver a departamentos
      </Link>

      <PageHeader
        title={h.address}
        subtitle={`${KIND_LABEL[h.kind]}${h.cluster ? ` · Cluster ${h.cluster}` : ""} · Actualizado ${formatDateTime(h.updatedAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onToggle} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {h.defaulter ? "Quitar moroso" : "Marcar moroso"}
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={pending}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Datos del domicilio</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Dirección" value={h.address} />
              <Row label="Cluster" value={h.cluster ?? "—"} />
              <Row label="Teléfono" value={h.phone ?? "Sin definir"} />
              <Row label="Tipo" value={KIND_LABEL[h.kind]} />
              <Row label="Con licencia" value={<Badge tone={h.paid ? "green" : "slate"}>{h.paid ? "Sí" : "No"}</Badge>} />
              <Row label="Moroso" value={<Badge tone={h.defaulter ? "red" : "green"}>{h.defaulter ? "Sí" : "No"}</Badge>} />
              <Row label="Recibiendo visitas" value={<Badge tone={h.receivingVisits ? "green" : "slate"}>{h.receivingVisits ? "Sí" : "No"}</Badge>} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Límites y bloqueos</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Bloquear QR visitante" value={<Badge tone={h.blockQrVisitor ? "red" : "slate"}>{h.blockQrVisitor ? "Bloqueado" : "Permitido"}</Badge>} />
              <Row label="Bloquear QR empleado" value={<Badge tone={h.blockQrEmployee ? "red" : "slate"}>{h.blockQrEmployee ? "Bloqueado" : "Permitido"}</Badge>} />
              <Row label="Bloquear QR casual" value={<Badge tone={h.blockQrCasual ? "red" : "slate"}>{h.blockQrCasual ? "Bloqueado" : "Permitido"}</Badge>} />
              <Row label="Límite de visitantes" value={h.visitorLimit ?? "Sin límite"} />
              <Row label="Límite de empleados" value={h.employeeLimit ?? "Sin límite"} />
              <Row label="Límite de frecuentes" value={h.frequentlyLimit ?? "Sin límite"} />
              <Row label="Límite de residentes" value={h.residentLimit ?? "Sin límite"} />
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Residentes ({h.residentsList.length})</h3>
            {h.residentsList.length === 0 ? (
              <p className="text-sm text-slate-400">Sin residentes registrados.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {h.residentsList.map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email ?? "Sin email"}</p>
                    </div>
                    <Badge tone="violet">{u.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Placas asociadas ({h.platesList.length})</h3>
            {h.platesList.length === 0 ? (
              <p className="text-sm text-slate-400">Sin placas asociadas.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {h.platesList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-mono font-medium text-slate-800">{p.number}</span>
                    {p.graylist && <Badge tone="amber">Lista gris</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-800">{value}</dd>
    </div>
  );
}
