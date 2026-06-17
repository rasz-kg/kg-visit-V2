"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Pencil, Trash2, Power, Loader2, Mail, Building2 } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import type { Person } from "@/lib/types";
import type { SectionKey } from "@/lib/sections";
import { createPerson, updatePerson, togglePerson, deletePerson } from "../actions";

type SectionLite = {
  key: SectionKey; title: string; subtitle: string; singular: string; source: "users" | "visitors";
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

export function PeopleClient({ people, section }: { people: Person[]; section: SectionLite }) {
  const router = useRouter();
  const isVisitor = section.source === "visitors";

  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Person | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const list = people.filter((p) =>
    q === "" || `${p.name} ${p.secondary ?? ""} ${p.contact ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  function openCreate() { setEditing(null); setError(null); setOpen(true); }
  function openEdit(p: Person) { setEditing(p); setError(null); setOpen(true); }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editing ? await updatePerson(null, fd) : await createPerson(null, fd);
      if (res?.ok) { setOpen(false); router.refresh(); }
      else setError(res?.error ?? "Ocurrió un error.");
    });
  }

  function onToggle(p: Person) {
    setBusyId(p.id);
    startTransition(async () => {
      await togglePerson(section.key, p.id, !p.status);
      setBusyId(null);
      router.refresh();
    });
  }

  function onDelete(p: Person) {
    if (!confirm(`¿Eliminar a "${p.name}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(p.id);
    startTransition(async () => {
      await deletePerson(section.key, p.id);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <>
      <Link href="/usuarios" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Usuarios
      </Link>

      <PageHeader
        title={section.title}
        subtitle={section.subtitle}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo</Button>}
      />

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar ${section.singular}…`}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-500">
          {q ? "Sin coincidencias." : `Aún no hay ${section.title.toLowerCase()}. Crea el primero con “Nuevo”.`}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className="flex flex-col">
              {/* Sólo usuarios "users" tienen detalle; visitantes se editan desde el modal. */}
              {isVisitor ? (
                <>
                  <div className="flex items-center gap-3 p-5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                      {initials(p.name) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-400">{p.secondary || "Sin empresa"}</p>
                    </div>
                    <Badge tone={p.status ? "green" : "slate"}>{p.status ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 px-5 pb-4 text-xs text-slate-500">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate">{p.contact || "Sin teléfono"}</span>
                  </div>
                </>
              ) : (
                <Link href={`/usuarios/${section.key}/${p.id}`} className="block hover:bg-slate-50/40">
                  <div className="flex items-center gap-3 p-5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                      {initials(p.name) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-400">{p.secondary ? `@${p.secondary}` : "Sin usuario"}</p>
                    </div>
                    <Badge tone={p.status ? "green" : "slate"}>{p.status ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 px-5 pb-4 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{p.contact || "Sin email"}</span>
                  </div>
                </Link>
              )}
              <div className="mt-auto flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                <Button variant="outline" className="px-2.5 py-1.5" onClick={() => openEdit(p)} title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="px-2.5 py-1.5"
                  onClick={() => onToggle(p)}
                  disabled={pending && busyId === p.id}
                  title={p.status ? "Desactivar" : "Activar"}
                >
                  {pending && busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                </Button>
                <Button
                  variant="danger"
                  className="ml-auto px-2.5 py-1.5"
                  onClick={() => onDelete(p)}
                  disabled={pending && busyId === p.id}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Editar ${section.singular}` : `Nuevo ${section.singular}`}>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="section" value={section.key} />
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <Field label="Nombre completo" name="name" required defaultValue={editing?.name} placeholder="Nombre Apellido" />

          {isVisitor ? (
            <>
              <Field label="Empresa" name="secondary" defaultValue={editing?.secondary} placeholder="Empresa (opcional)" />
              <Field label="Teléfono" name="contact" defaultValue={editing?.contact} placeholder="55 0000 0000" />
            </>
          ) : (
            <>
              <Field label="Usuario" name="username" required defaultValue={editing?.secondary} placeholder="nombre.apellido" />
              <Field label="Email" name="contact" defaultValue={editing?.contact} placeholder="email@dominio.com" hint="Requerido para re-establecer contraseña." />
            </>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label, name, defaultValue, placeholder, required, hint,
}: {
  label: string; name: string; defaultValue?: string; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-brand-500">*</span>}
      </label>
      {hint && <p className="mb-1 text-xs text-slate-400">{hint}</p>}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
