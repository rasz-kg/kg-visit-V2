import { Plus, Phone, Home, Hammer, Trees, Building } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { getHouses } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import type { HouseKind } from "@/lib/types";

const KIND: Record<HouseKind, { label: string; icon: typeof Home; tone: "green" | "amber" | "slate" | "blue" }> = {
  inhabited: { label: "Habitada", icon: Home, tone: "green" },
  build: { label: "Residencia", icon: Building, tone: "blue" },
  construction: { label: "En construcción", icon: Hammer, tone: "amber" },
  land: { label: "Terreno", icon: Trees, tone: "slate" },
  rent: { label: "Renta", icon: Home, tone: "blue" },
};

export default async function DepartamentosPage() {
  const houses = await getHouses();
  const total = houses.length;
  const paid = houses.filter((h) => h.paid).length;
  const usingApp = houses.filter((h) => h.residents > 0).length;

  return (
    <>
      <PageHeader
        title="Departamentos"
        subtitle="Unidades, domicilios y su estatus de cobranza y accesos."
        actions={<Button><Plus className="h-4 w-4" /> Nuevo</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: total },
          { label: "Con licencia", value: paid },
          { label: "Usando la App", value: usingApp },
        ].map((s) => (
          <Card key={s.label}><CardBody className="p-4"><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></CardBody></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {houses.map((h) => {
          const k = KIND[h.kind];
          const Icon = k.icon;
          return (
            <Card key={h.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-slate-900">{h.address}</p>
                      <p className="text-xs text-slate-400">Cluster {h.cluster} · {h.residents} residentes</p>
                    </div>
                  </div>
                  <Badge tone={k.tone}>{k.label}</Badge>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between"><dt className="text-slate-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Teléfono</dt><dd className="text-slate-700">{h.phone ?? "Sin definir"}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-slate-500">Moroso</dt><dd><Badge tone={h.defaulter ? "red" : "green"}>{h.defaulter ? "Sí" : "No"}</Badge></dd></div>
                  <div className="flex items-center justify-between"><dt className="text-slate-500">Recibiendo visitas</dt><dd><Badge tone={h.receivingVisits ? "green" : "slate"}>{h.receivingVisits ? "Sí" : "No"}</Badge></dd></div>
                </dl>
                <p className="mt-3 text-[11px] text-slate-400">Actualizado: {formatDateTime(h.updatedAt)}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
