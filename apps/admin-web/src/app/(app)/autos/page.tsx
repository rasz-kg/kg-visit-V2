import { Plus, ScanLine } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { getPlates } from "@/lib/data";
import type { PlateList } from "@/lib/types";

const LIST: Record<PlateList, { label: string; tone: "green" | "red" | "amber" | "slate" | "blue" }> = {
  none: { label: "Normal", tone: "slate" },
  blacklist: { label: "Lista negra", tone: "red" },
  graylist: { label: "Lista gris", tone: "amber" },
  report: { label: "Reportada", tone: "red" },
  recuperate: { label: "Recuperación", tone: "blue" },
};

export default async function AutosPage() {
  const plates = await getPlates();
  return (
    <>
      <PageHeader
        title="Autos y placas"
        subtitle="Registro vehicular, listas negra/gris y validación por REPUVE / LPR."
        actions={
          <>
            <Button variant="outline"><ScanLine className="h-4 w-4" /> Leer placa (LPR)</Button>
            <Button><Plus className="h-4 w-4" /> Nueva placa</Button>
          </>
        }
      />
      <Card>
        <CardHeader><CardTitle>Placas registradas</CardTitle><Badge tone="slate">{plates.length}</Badge></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Placa</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Vehículo</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Lista</th>
              </tr>
            </thead>
            <tbody>
              {plates.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono font-semibold text-slate-800">{p.number}</td>
                  <td className="px-5 py-3 text-slate-600">{p.state ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{[p.brand, p.color].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-5 py-3">{p.resident ? <Badge tone="green">Residente</Badge> : <Badge tone="slate">Visitante</Badge>}</td>
                  <td className="px-5 py-3"><Badge tone={LIST[p.list].tone}>{LIST[p.list].label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
