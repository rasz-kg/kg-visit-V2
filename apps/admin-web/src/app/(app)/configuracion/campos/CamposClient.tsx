"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Eye, EyeOff, Asterisk } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { cn } from "@/lib/utils";
import { saveField, deleteField, toggleField, type ActionState } from "../actions";

export type FieldOption = { value: string; label: string };
export type VisitField = {
  id: string;
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "phone" | "photo";
  required: boolean;
  visible: boolean;
  sort_order: number;
  applies_to: "visitor" | "employee" | "service" | "all";
  options: FieldOption[];
};

const TYPES: { value: VisitField["type"]; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "select", label: "Lista" },
  { value: "date", label: "Fecha" },
  { value: "phone", label: "Teléfono" },
  { value: "photo", label: "Foto" },
];
const APPLIES: { value: VisitField["applies_to"]; label: string; tone: "blue" | "violet" | "amber" | "slate" }[] = [
  { value: "visitor", label: "Visitante", tone: "blue" },
  { value: "employee", label: "Empleado", tone: "violet" },
  { value: "service", label: "Servicio", tone: "amber" },
  { value: "all", label: "Todos", tone: "slate" },
];

const typeLabel = (t: VisitField["type"]) => TYPES.find((x) => x.value === t)?.label ?? t;
const appliesMeta = (a: VisitField["applies_to"]) => APPLIES.find((x) => x.value === a) ?? APPLIES[0];

export function CamposClient({ fields }: { fields: VisitField[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VisitField | null>(null);
  const [type, setType] = React.useState<VisitField["type"]>("text");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setType("text");
    setError(null);
    setOpen(true);
  }
  function openEdit(f: VisitField) {
    setEditing(f);
    setType(f.type);
    setError(null);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res: ActionState = await saveField(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); } else setError(res?.error ?? "Error.");
    });
  }
  function onToggle(f: VisitField, column: "visible" | "required") {
    setBusyId(f.id);
    start(async () => { await toggleField(f.id, column, !f[column]); setBusyId(null); router.refresh(); });
  }
  function onDelete(f: VisitField) {
    if (!confirm(`¿Eliminar el campo "${f.label}"?`)) return;
    setBusyId(f.id);
    start(async () => { await deleteField(f.id); setBusyId(null); router.refresh(); });
  }

  return (
    <>
      <PageHeader
        title="Campos de visita"
        subtitle="Define qué datos pide el formulario de alta de visita (más / menos campos por tenant)."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/configuracion">
              <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Configuración</Button>
            </Link>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> Nuevo campo</Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Clave</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Aplica a</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => {
              const am = appliesMeta(f.applies_to);
              const busy = pending && busyId === f.id;
              return (
                <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">{f.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{f.label}</td>
                  <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{f.key}</code></td>
                  <td className="px-4 py-3 text-slate-600">{typeLabel(f.type)}</td>
                  <td className="px-4 py-3"><Badge tone={am.tone}>{am.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggle(f, "visible")}
                        disabled={busy}
                        className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", f.visible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}
                        title={f.visible ? "Visible" : "Oculto"}
                      >
                        {f.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {f.visible ? "Visible" : "Oculto"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(f, "required")}
                        disabled={busy}
                        className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", f.required ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500")}
                        title={f.required ? "Obligatorio" : "Opcional"}
                      >
                        <Asterisk className="h-3 w-3" />
                        {f.required ? "Requerido" : "Opcional"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" className="px-2.5 py-1.5" onClick={() => openEdit(f)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="danger" className="px-2.5 py-1.5" onClick={() => onDelete(f)} disabled={busy} title="Eliminar">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {fields.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">Sin campos configurados. Crea el primero con “Nuevo campo”.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar campo" : "Nuevo campo"}>
        <form onSubmit={onSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Etiqueta" name="label" required defaultValue={editing?.label} placeholder="Empresa" />
          <Field label="Clave (key)" name="key" required defaultValue={editing?.key} placeholder="company" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <select name="type" value={type} onChange={(e) => setType(e.target.value as VisitField["type"])} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
                {TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Aplica a</label>
              <select name="applies_to" defaultValue={editing?.applies_to ?? "visitor"} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white">
                {APPLIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          {type === "select" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Opciones</label>
              <textarea
                name="options"
                rows={3}
                defaultValue={(editing?.options ?? []).map((o) => (o.value === o.label ? o.label : `${o.value}=${o.label}`)).join("\n")}
                placeholder={"Una por línea. Ej:\nnorte=Sede Norte\nsur=Sede Sur"}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-slate-400">Formato <code>valor=Etiqueta</code> o sólo la etiqueta.</p>
            </div>
          )}
          <Field label="Orden" name="sort_order" type="number" defaultValue={String(editing?.sort_order ?? 0)} placeholder="0" />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="visible" defaultChecked={editing ? editing.visible : true} className="h-4 w-4 rounded border-slate-300 text-brand-500" /> Visible</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="required" defaultChecked={editing?.required ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-500" /> Requerido</label>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Guardar cambios" : "Crear campo"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ label, name, defaultValue, placeholder, required, type = "text" }: { label: string; name: string; defaultValue?: string; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label} {required && <span className="text-brand-500">*</span>}</label>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
    </div>
  );
}
