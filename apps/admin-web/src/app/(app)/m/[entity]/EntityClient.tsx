"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Power, Loader2 } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { EntityDef } from "@/lib/entities";
import type { FkOption } from "@/lib/crud";
import { saveEntity, toggleEntity, deleteEntity } from "./actions";

type ClientDef = Omit<EntityDef, "icon">;
type Row = Record<string, unknown>;

function cell(def: ClientDef, row: Row, key: string) {
  const col = def.columns.find((c) => c.key === key);
  const v = row[key];
  if (col?.kind === "bool") return <Badge tone={v ? "green" : "slate"}>{v ? "Sí" : "No"}</Badge>;
  if (col?.kind === "money") return formatCurrency(Number(v ?? 0));
  if (col?.kind === "date") return formatDateTime(v as string);
  return <span className="text-slate-700">{v == null || v === "" ? "—" : String(v)}</span>;
}

export function EntityClient({
  def,
  rows,
  fkOptions,
}: {
  def: ClientDef;
  rows: Row[];
  fkOptions?: Record<string, FkOption[]>;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const list = rows.filter((r) =>
    q === "" || def.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveEntity(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); } else setError(res?.error ?? "Error.");
    });
  }
  function onToggle(r: Row) {
    setBusyId(String(r.id));
    start(async () => { await toggleEntity(def.key, String(r.id), "status", !r.status); setBusyId(null); router.refresh(); });
  }
  function onDelete(r: Row) {
    if (!confirm("¿Eliminar este registro?")) return;
    setBusyId(String(r.id));
    start(async () => { await deleteEntity(def.key, String(r.id)); setBusyId(null); router.refresh(); });
  }

  return (
    <>
      <PageHeader
        title={def.label}
        subtitle={`Gestión de ${def.label.toLowerCase()}.`}
        actions={<Button onClick={() => { setEditing(null); setError(null); setOpen(true); }}><Plus className="h-4 w-4" /> Nuevo</Button>}
      />

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${def.singular}…`}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                {def.columns.map((c) => <th key={c.key} className="px-5 py-3 font-medium">{c.label}</th>)}
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={String(r.id)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  {def.columns.map((c) => <td key={c.key} className="px-5 py-3">{cell(def, r, c.key)}</td>)}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" className="px-2 py-1.5" onClick={() => { setEditing(r); setError(null); setOpen(true); }} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      {def.hasStatus && (
                        <Button variant="outline" className="px-2 py-1.5" onClick={() => onToggle(r)} disabled={pending && busyId === String(r.id)} title="Activar/Desactivar">
                          {pending && busyId === String(r.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button variant="danger" className="px-2 py-1.5" onClick={() => onDelete(r)} disabled={pending && busyId === String(r.id)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={def.columns.length + 1} className="px-5 py-12 text-center text-slate-400">Sin registros. Crea el primero con “Nuevo”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Editar ${def.singular}` : `Nuevo ${def.singular}`}>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="__entity" value={def.key} />
          {editing && <input type="hidden" name="__id" value={String(editing.id)} />}
          {def.fields.map((f) => {
            const dv = editing ? editing[f.key] : f.defaultValue;
            const label = (<label className="mb-1 block text-sm font-medium text-slate-700">{f.label} {f.required && <span className="text-brand-500">*</span>}</label>);
            if (f.type === "boolean") {
              return (
                <label key={f.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name={f.key} defaultChecked={Boolean(dv)} className="h-4 w-4 rounded border-slate-300 text-brand-500" /> {f.label}
                </label>
              );
            }
            if (f.type === "select") {
              return (
                <div key={f.key}>{label}
                  <select name={f.key} defaultValue={dv != null ? String(dv) : ""} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
                    <option value="">—</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              );
            }
            if (f.type === "fk") {
              const opts = fkOptions?.[f.key] ?? [];
              return (
                <div key={f.key}>{label}
                  <select name={f.key} defaultValue={dv != null ? String(dv) : ""}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
                    <option value="">{f.required ? `— Selecciona ${f.label.toLowerCase()} —` : "— Sin asignar —"}</option>
                    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {opts.length === 0 && (
                    <p className="mt-1 text-xs text-slate-400">No hay opciones disponibles. Crea registros en su módulo primero.</p>
                  )}
                </div>
              );
            }
            if (f.type === "textarea") {
              return (<div key={f.key}>{label}<textarea name={f.key} defaultValue={dv != null ? String(dv) : ""} rows={3} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white" /></div>);
            }
            return (
              <div key={f.key}>{label}
                <input name={f.key} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} defaultValue={dv != null ? String(dv) : ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
              </div>
            );
          })}
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
