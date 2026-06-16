import { Plus, MapPinned, ShieldCheck, Building2 } from "lucide-react";
import { Button, Card, CardBody, PageHeader } from "@/components/ui";
import { sites } from "@/lib/mock";

export default function SedesPage() {
  return (
    <>
      <PageHeader
        title="Sedes"
        subtitle="Para operación multi-sede (corporativo / industrial): cada sede agrupa casetas y unidades."
        actions={<Button><Plus className="h-4 w-4" /> Nueva sede</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><MapPinned className="h-5 w-5" /></div>
                <p className="font-semibold text-slate-900">{s.name}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-slate-500"><ShieldCheck className="h-4 w-4" /> Casetas</p><p className="mt-1 text-xl font-bold text-slate-900">{s.booths}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-slate-500"><Building2 className="h-4 w-4" /> Unidades</p><p className="mt-1 text-xl font-bold text-slate-900">{s.houses}</p></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
