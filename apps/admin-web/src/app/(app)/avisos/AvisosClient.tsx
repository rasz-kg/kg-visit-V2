"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Megaphone, Trash2, Power, Loader2, Search } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { formatDateTime } from "@/lib/utils";
import type { Notice, NoticeKind } from "@/lib/types";
import { createNotice, toggleNotice, deleteNotice } from "./actions";

const KIND_TONE: Record<NoticeKind, "blue" | "amber" | "red" | "slate"> = {
  general: "blue", payment: "amber", emergency: "red", house: "slate",
};
const KIND_LABEL: Record<NoticeKind, string> = {
  general: "General", payment: "Cobranza", emergency: "Emergencia", house: "Domicilio",
};
const KIND_OPTIONS: { value: NoticeKind; label: string }[] = [
  { value: "general", label: "General (toda la comunidad)" },
  { value: "payment", label: "Cobranza" },
  { value: "emergency", label: "Emergencia" },
  { value: "house", label: "Domicilio" },
];

export function AvisosClient({ notices }: { notices: Notice[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const list = notices.filter((n) => q === "" || n.description.toLowerCase().includes(q.toLowerCase()));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createNotice(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); } else setError(res?.error ?? "Error.");
    });
  }
  function onToggle(n: Notice) {
    setBusyId(n.id);
    start(async () => { await toggleNotice(n.id, n.status !== "active"); setBusyId(null); router.refresh(); });
  }
  function onDelete(n: Notice) {
    if (!confirm("¿Eliminar este aviso?")) return;
    setBusyId(n.id);
    start(async () => { await deleteNotice(n.id); setBusyId(null); router.refresh(); });
  }

  return (
    <>
      <PageHeader
        title="Avisos"
        subtitle="Comunicados a toda la empresa/fraccionamiento o a un departamento."
        actions={<Button onClick={() => { setError(null); setOpen(true); }}><Plus className="h-4 w-4" /> Nuevo aviso</Button>}
      />

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar aviso…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>
      </div>

      <div className="space-y-3">
        {list.map((n) => {
          const inactive = n.status !== "active";
          return (
            <Card key={n.id} className={inactive ? "opacity-60" : undefined}>
              <CardBody className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Megaphone className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={KIND_TONE[n.kind]}>{KIND_LABEL[n.kind]}</Badge>
                    {n.houseAddress && <Badge tone="slate">{n.houseAddress}</Badge>}
                    {inactive && <Badge tone="slate">Inactivo</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">{n.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <Button variant="outline" className="px-2 py-1.5" onClick={() => onToggle(n)} disabled={pending && busyId === n.id} title={inactive ? "Reactivar" : "Desactivar"}>
                    {pending && busyId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  </Button>
                  <Button variant="danger" className="px-2 py-1.5" onClick={() => onDelete(n)} disabled={pending && busyId === n.id} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {list.length === 0 && (
          <Card className="p-12 text-center text-sm text-slate-500">Sin avisos. Publica el primero con “Nuevo aviso”.</Card>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo aviso">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
            <select name="kind" defaultValue="general" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
              {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mensaje <span className="text-brand-500">*</span></label>
            <textarea name="description" rows={4} placeholder="Ej. Corte de agua programado el sábado de 9:00 a 12:00…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Publicar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
