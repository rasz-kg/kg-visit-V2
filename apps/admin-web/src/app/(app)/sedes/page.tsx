import { Plus, MapPinned, ShieldCheck, Building2, Info } from "lucide-react";
import { Button, Card, CardBody, PageHeader } from "@/components/ui";
import { getSites } from "@/lib/data";

export default async function SedesPage() {
  const sites = await getSites();
  const multiSite = sites.some((s) => s.multiSite);
  return (
    <>
      <PageHeader
        title="Sedes"
        subtitle="Para operación multi-sede (corporativo / industrial): cada sede agrupa casetas y unidades."
        actions={
          <Button disabled title="La operación multi-sede requiere habilitar el módulo de sedes (tabla sites — ver docs/10).">
            <Plus className="h-4 w-4" /> Nueva sede
          </Button>
        }
      />

      {!multiSite && (
        <Card className="mb-5 border-blue-200/70 bg-blue-50/40">
          <CardBody className="flex gap-3 p-4 text-sm text-slate-600">
            <Info className="h-5 w-5 shrink-0 text-blue-500" />
            <p>
              Este residencial opera como <strong>sede única</strong>. La operación multi-sede (varias sedes con sus
              propias casetas y unidades) requiere habilitar el módulo de sedes en la base de datos
              (tabla <code className="rounded bg-slate-100 px-1">sites</code> — ver <code className="rounded bg-slate-100 px-1">docs/10</code>).
            </p>
          </CardBody>
        </Card>
      )}

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
        {sites.length === 0 && <Card className="col-span-full p-12 text-center text-sm text-slate-500">No se pudo cargar la información de la sede.</Card>}
      </div>
    </>
  );
}
