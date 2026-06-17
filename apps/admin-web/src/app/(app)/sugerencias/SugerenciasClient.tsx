"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, Loader2, Trash2, Search, Filter } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/lib/types";
import { setTicketStatus, deleteTicket } from "./actions";

const STATUS: Record<TicketStatus, { label: string; tone: "amber" | "blue" | "green" | "slate" }> = {
  open: { label: "Abierto", tone: "amber" },
  in_progress: { label: "En proceso", tone: "blue" },
  resolved: { label: "Resuelto", tone: "green" },
  closed: { label: "Cerrado", tone: "slate" },
};
// Próximo estatus sugerido en el flujo de atención.
const NEXT: Partial<Record<TicketStatus, { to: TicketStatus; label: string }>> = {
  open: { to: "in_progress", label: "Tomar" },
  in_progress: { to: "resolved", label: "Resolver" },
  resolved: { to: "closed", label: "Cerrar" },
};

export function SugerenciasClient({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [pending, start] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const list = tickets.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      (q === "" || `${t.subject} ${t.category} ${t.user}`.toLowerCase().includes(q.toLowerCase()))
  );

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string } | null>) {
    setBusyId(id); setError(null);
    start(async () => {
      const res = await fn();
      if (res && !res.ok) setError(res.error ?? "Error.");
      setBusyId(null);
      router.refresh();
    });
  }
  function onDelete(t: Ticket) {
    if (!confirm("¿Eliminar este ticket?")) return;
    run(t.id, () => deleteTicket(t.id));
  }

  return (
    <>
      <PageHeader title="Sugerencias y quejas" subtitle="Tickets de la comunidad: quejas y sugerencias por concepto y estatus." />

      <Card className="mb-5 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por asunto, categoría o usuario…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <option value="all">Todos los estatus</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Tickets</CardTitle><Badge tone="slate">{list.length}</Badge></CardHeader>
        <div className="divide-y divide-slate-50">
          {list.map((t) => {
            const next = NEXT[t.status];
            const busy = pending && busyId === t.id;
            return (
              <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><MessageSquareWarning className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{t.subject}</p>
                    <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                  </div>
                  {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
                  <p className="mt-1 text-xs text-slate-400">{t.category} · {t.user} · {formatDateTime(t.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {next && (
                    <Button disabled={busy} onClick={() => run(t.id, () => setTicketStatus(t.id, next.to))}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : next.label}
                    </Button>
                  )}
                  {t.status !== "open" && t.status !== "closed" && (
                    <Button variant="outline" disabled={busy} onClick={() => run(t.id, () => setTicketStatus(t.id, "open"))}>Reabrir</Button>
                  )}
                  <Button variant="danger" className="px-2 py-1.5" disabled={busy} onClick={() => onDelete(t)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-400">Sin tickets que coincidan.</div>}
        </div>
      </Card>
    </>
  );
}
