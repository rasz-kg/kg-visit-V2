import { Plus, ShieldCheck, Printer } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { booths } from "@/lib/mock";

export default function CasetasPage() {
  return (
    <>
      <PageHeader
        title="Casetas"
        subtitle="Casetas de acceso: principal, virtual, salida, peatonal. Acceso/salida por QR."
        actions={<Button><Plus className="h-4 w-4" /> Nueva caseta</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {booths.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><ShieldCheck className="h-5 w-5" /></div>
              {b.main && <Badge tone="orange">Principal</Badge>}
            </div>
            <p className="mt-3 font-semibold text-slate-900">{b.name}</p>
            <p className="text-xs text-slate-400">{b.site}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={b.status ? "green" : "slate"}>{b.status ? "Activa" : "Inactiva"}</Badge>
              {b.printer && <Badge tone="blue"><Printer className="h-3 w-3" /> Impresora</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
