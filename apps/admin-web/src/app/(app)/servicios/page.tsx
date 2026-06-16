import { Plus, Wrench } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { services } from "@/lib/mock";

export default function ServiciosPage() {
  return (
    <>
      <PageHeader
        title="Servicios"
        subtitle="Catálogo de servicios externos personalizable (paquetería, gas, mantenimiento…)."
        actions={<Button><Plus className="h-4 w-4" /> Nuevo servicio</Button>}
      />
      <Card>
        <CardHeader><CardTitle>Servicios configurados</CardTitle><Badge tone="slate">{services.length}</Badge></CardHeader>
        <div className="divide-y divide-slate-50">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Wrench className="h-4 w-4" /></div>
              <p className="flex-1 font-medium text-slate-800">{s.name}</p>
              {s.hasDetails && <Badge tone="violet">Pide detalles</Badge>}
              <Badge tone={s.status ? "green" : "slate"}>{s.status ? "Activo" : "Inactivo"}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
