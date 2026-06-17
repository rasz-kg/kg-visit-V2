"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Power, Loader2 } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import type { UserDetail } from "@/lib/data";
import type { SectionKey } from "@/lib/sections";
import { togglePerson, deletePerson } from "../../actions";

type SectionLite = { key: SectionKey; title: string; singular: string };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

export function UserDetailClient({ user: u, section }: { user: UserDetail; section: SectionLite }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onToggle() {
    setError(null);
    start(async () => {
      const res = await togglePerson(section.key, u.id, !u.status);
      if (res && !res.ok) setError(res.error ?? "No se pudo actualizar.");
      else router.refresh();
    });
  }
  function onDelete() {
    if (!confirm(`¿Eliminar a "${u.name}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    start(async () => {
      const res = await deletePerson(section.key, u.id);
      if (res && !res.ok) setError(res.error ?? "No se pudo eliminar.");
      else router.push(`/usuarios/${section.key}`);
    });
  }

  return (
    <>
      <Link href={`/usuarios/${section.key}`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Volver a {section.title.toLowerCase()}
      </Link>

      <PageHeader
        title={u.name}
        subtitle={u.username ? `@${u.username}` : `Detalle del ${section.singular}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onToggle} disabled={pending} title={u.status ? "Desactivar" : "Activar"}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {u.status ? "Desactivar" : "Activar"}
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={pending}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center gap-3 py-8">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-2xl font-bold text-brand-600">
              {initials(u.name) || "?"}
            </div>
            <p className="text-lg font-semibold text-slate-900">{u.name}</p>
            <Badge tone={u.status ? "green" : "slate"}>{u.status ? "Activo" : "Inactivo"}</Badge>
            <Badge tone="violet">{u.role}</Badge>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Datos de la cuenta</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Usuario" value={u.username ?? "—"} />
              <Row label="Email" value={u.email ?? "—"} />
              <Row label="Teléfono" value={u.phone ?? "—"} />
              <Row label="Rol" value={u.role} />
              <Row label="Domicilio" value={u.houseAddress ?? "Sin asignar"} />
              <Row label="Validado" value={<Badge tone={u.validated ? "green" : "amber"}>{u.validated ? "Sí" : "Pendiente"}</Badge>} />
              <Row label="Alta" value={formatDateTime(u.createdAt)} />
            </dl>
            <p className="mt-4 text-xs text-slate-400">
              La edición de campos se realiza desde el listado (botón Editar). Esta vista es de sólo lectura por ahora.
            </p>
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
