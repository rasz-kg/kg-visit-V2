import { MessageSquareWarning } from "lucide-react";
import { Badge, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { tickets } from "@/lib/mock";
import { formatDateTime } from "@/lib/utils";

const STATUS = {
  open: { label: "Abierto", tone: "amber" },
  in_progress: { label: "En proceso", tone: "blue" },
  resolved: { label: "Resuelto", tone: "green" },
  closed: { label: "Cerrado", tone: "slate" },
} as const;

export default function SugerenciasPage() {
  return (
    <>
      <PageHeader title="Sugerencias y quejas" subtitle="Tickets de la comunidad: quejas y sugerencias por concepto y estatus." />
      <Card>
        <CardHeader><CardTitle>Tickets</CardTitle><Badge tone="slate">{tickets.length}</Badge></CardHeader>
        <div className="divide-y divide-slate-50">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><MessageSquareWarning className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{t.subject}</p>
                  <Badge tone={t.kind === "queja" ? "red" : "violet"}>{t.kind === "queja" ? "Queja" : "Sugerencia"}</Badge>
                  <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{t.category} · {t.user} · {formatDateTime(t.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
