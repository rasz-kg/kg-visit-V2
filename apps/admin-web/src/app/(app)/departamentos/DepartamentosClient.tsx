"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Phone, Home, Hammer, Trees, Building, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { formatDateTime } from "@/lib/utils";
import type { House, HouseKind } from "@/lib/types";
import { createHouse, updateHouse, toggleDefaulter, deleteHouse } from "./actions";

const KIND: Record<HouseKind, { label: string; icon: typeof Home; tone: "green" | "amber" | "slate" | "blue" }> = {
  inhabited: { label: "Habitada", icon: Home, tone: "green" },
  build: { label: "Residencia", icon: Building, tone: "blue" },
  construction: { label: "En construcción", icon: Hammer, tone: "amber" },
  land: { label: "Terreno", icon: Trees, tone: "slate" },
  rent: { label: "Renta", icon: Home, tone: "blue" },
};
const KIND_OPTIONS: { value: HouseKind; label: string }[] = [
  { value: "inhabited", label: "Habitada" }, { value: "build", label: "Residencia" },
  { value: "construction", label: "En construcción" }, { value: "land", label: "Terreno" }, { value: "rent", label: "Renta" },
];

export function DepartamentosClient({ houses }: { houses: House[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<House | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const list = houses.filter((h) => q === "" || `${h.address} ${h.cluster ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const total = houses.length, paid = houses.filter((h) => h.paid).length, usingApp = houses.filter((h) => h.residents > 0).length;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = editing ? await updateHouse(null, fd) : await createHouse(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); } else setError(res?.error ?? "Error.");
    });
  }
  function onToggle(h: House) { setBusyId(h.id); start(async () => { await toggleDefaulter(h.id, !h.defaulter); setBusyId(null); router.refresh(); }); }
  function onDelete(h: House) {
    if (!confirm(`¿Eliminar "${h.address}"?`)) return;
    setBusyId(h.id); start(async () => { await deleteHouse(h.id); setBusyId(null); router.refresh(); });
  }

  return (
    <>
      <PageHeader
        title="Departamentos"
        subtitle="Unidades, domicilios y su estatus de cobranza y accesos."
        actions={<Button onClick={() => { setEditing(null); setError(null); setOpen(true); }}><Plus className="h-4 w-4" /> Nuevo</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        {[{ label: "Total", value: total }, { label: "Con licencia", value: paid }, { label: "Usando la App", value: usingApp }].map((st) => (
          <Card key={st.label}><CardBody className="p-4"><p className="text-2xl font-bold text-slate-900">{st.value}</p><p className="text-xs text-slate-500">{st.label}</p></CardBody></Card>
        ))}
      </div>

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar domicilio…" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((h) => {
          const k = KIND[h.kind]; const Icon = k.icon;
          return (
            <Card key={h.id}>
              <Link href={`/departamentos/${h.id}`} className="block hover:bg-slate-50/40">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></div>
                      <div><p className="font-semibold text-slate-900">{h.address}</p><p className="text-xs text-slate-400">{h.cluster ? `Cluster ${h.cluster} · ` : ""}{h.residents} residentes</p></div>
                    </div>
                    <Badge tone={k.tone}>{k.label}</Badge>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-slate-500"><Phone className="h-3.5 w-3.5" /> Teléfono</dt><dd className="text-slate-700">{h.phone ?? "Sin definir"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-slate-500">Moroso</dt><dd><Badge tone={h.defaulter ? "red" : "green"}>{h.defaulter ? "Sí" : "No"}</Badge></dd></div>
                    <div className="flex items-center justify-between"><dt className="text-slate-500">Recibiendo visitas</dt><dd><Badge tone={h.receivingVisits ? "green" : "slate"}>{h.receivingVisits ? "Sí" : "No"}</Badge></dd></div>
                  </dl>
                  <p className="mt-3 text-[11px] text-slate-400">Actualizado: {formatDateTime(h.updatedAt)}</p>
                </CardBody>
              </Link>
              <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                <Button variant="outline" className="px-2.5 py-1.5" onClick={() => { setEditing(h); setError(null); setOpen(true); }} title="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" className="px-2.5 py-1.5 text-xs" onClick={() => onToggle(h)} disabled={pending && busyId === h.id} title="Marcar morosidad">
                  {pending && busyId === h.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (h.defaulter ? "Quitar moroso" : "Marcar moroso")}
                </Button>
                <Button variant="danger" className="ml-auto px-2.5 py-1.5" onClick={() => onDelete(h)} disabled={pending && busyId === h.id} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <Card className="col-span-full p-12 text-center text-sm text-slate-500">Sin domicilios. Crea el primero con “Nuevo”.</Card>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar domicilio" : "Nuevo domicilio"}>
        <form onSubmit={onSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Dirección" name="address" required defaultValue={editing?.address} placeholder="Cobra 101" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cluster" name="cluster" defaultValue={editing?.cluster} placeholder="A" />
            <Field label="Teléfono" name="phone" defaultValue={editing?.phone} placeholder="55 0000 0000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
            <select name="kind" defaultValue={editing?.kind ?? "inhabited"} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
              {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="paid" defaultChecked={editing ? editing.paid : true} className="h-4 w-4 rounded border-slate-300 text-brand-500" /> Con licencia</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="defaulter" defaultChecked={editing?.defaulter ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-500" /> Moroso</label>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Guardar cambios" : "Guardar"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ label, name, defaultValue, placeholder, required }: { label: string; name: string; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label} {required && <span className="text-brand-500">*</span>}</label>
      <input name={name} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
    </div>
  );
}
