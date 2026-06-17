"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, ScanLine, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import type { Plate, PlateList } from "@/lib/types";
import { createPlate, updatePlate, deletePlate } from "./actions";

const LIST: Record<PlateList, { label: string; tone: "green" | "red" | "amber" | "slate" | "blue" }> = {
  none: { label: "Normal", tone: "slate" },
  blacklist: { label: "Lista negra", tone: "red" },
  graylist: { label: "Lista gris", tone: "amber" },
  report: { label: "Reportada", tone: "red" },
  recuperate: { label: "Recuperación", tone: "blue" },
};
const LIST_OPTIONS: { value: PlateList; label: string }[] = [
  { value: "none", label: "Normal" },
  { value: "graylist", label: "Lista gris" },
  { value: "blacklist", label: "Lista negra" },
  { value: "report", label: "Reportada" },
  { value: "recuperate", label: "Recuperación" },
];

export function AutosClient({ plates }: { plates: Plate[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Plate | null>(null);
  const [lprNote, setLprNote] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const list = plates.filter((p) => q === "" || `${p.number} ${p.brand ?? ""} ${p.state ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  function openNew(lpr = false) { setEditing(null); setError(null); setLprNote(lpr); setOpen(true); }
  function openEdit(p: Plate) { setEditing(p); setError(null); setLprNote(false); setOpen(true); }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = editing ? await updatePlate(null, fd) : await createPlate(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); } else setError(res?.error ?? "Error.");
    });
  }
  function onDelete(p: Plate) {
    if (!confirm(`¿Eliminar la placa ${p.number}?`)) return;
    setBusyId(p.id);
    start(async () => { await deletePlate(p.id); setBusyId(null); router.refresh(); });
  }

  return (
    <>
      <PageHeader
        title="Autos y placas"
        subtitle="Registro vehicular, listas negra/gris y validación por REPUVE / LPR."
        actions={
          <>
            <Button variant="outline" onClick={() => openNew(true)}><ScanLine className="h-4 w-4" /> Leer placa (LPR)</Button>
            <Button onClick={() => openNew(false)}><Plus className="h-4 w-4" /> Nueva placa</Button>
          </>
        }
      />

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar placa, marca o estado…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Placas registradas</CardTitle><Badge tone="slate">{list.length}</Badge></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Placa</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Vehículo</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Lista</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono font-semibold text-slate-800">{p.number}</td>
                  <td className="px-5 py-3 text-slate-600">{p.state ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{[p.brand, p.model, p.color].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-5 py-3">{p.resident ? <Badge tone="green">Residente</Badge> : <Badge tone="slate">Visitante</Badge>}</td>
                  <td className="px-5 py-3"><Badge tone={LIST[p.list].tone}>{LIST[p.list].label}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" className="px-2 py-1.5" onClick={() => openEdit(p)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="danger" className="px-2 py-1.5" onClick={() => onDelete(p)} disabled={pending && busyId === p.id} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Sin placas. Registra la primera con “Nueva placa”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar placa" : "Nueva placa"}>
        <form onSubmit={onSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          {lprNote && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Captura manual. La lectura automática (LPR) se realiza desde la caseta con cámara configurada en Cámaras IP.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Placa" name="number" required defaultValue={editing?.number} placeholder="ABC-12-34" mono />
            <Field label="Estado" name="state" defaultValue={editing?.state} placeholder="CDMX" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Marca" name="brand" defaultValue={editing?.brand} placeholder="Nissan" />
            <Field label="Modelo" name="model" defaultValue={editing?.model} placeholder="Versa" />
            <Field label="Color" name="color" defaultValue={editing?.color} placeholder="Blanco" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lista</label>
            <select name="list" defaultValue={editing?.list ?? "none"} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
              {LIST_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="resident" defaultChecked={editing?.resident ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-500" /> Vehículo de residente
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Guardar cambios" : "Registrar"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ label, name, defaultValue, placeholder, required, mono }: { label: string; name: string; defaultValue?: string; placeholder?: string; required?: boolean; mono?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label} {required && <span className="text-brand-500">*</span>}</label>
      <input name={name} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 ${mono ? "font-mono uppercase" : ""}`} />
    </div>
  );
}
