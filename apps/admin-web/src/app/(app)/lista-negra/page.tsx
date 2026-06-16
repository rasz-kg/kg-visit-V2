import { Ban, Car, User } from "lucide-react";
import { Badge, Card, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { plates } from "@/lib/mock";

const flagged = plates.filter((p) => p.list === "blacklist" || p.list === "graylist" || p.list === "report");

// Visitantes vetados (demo)
const blockedVisitors = [
  { id: "bv1", name: "Persona No Grata", reason: "Incidente reportado por guardia", date: "2026-05-02" },
];

export default function ListaNegraPage() {
  return (
    <>
      <PageHeader title="Lista negra" subtitle="Autos y visitantes vetados o en lista gris. Bloqueo de acceso automático en caseta." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Car className="h-4 w-4 text-red-500" /> Placas</CardTitle><Badge tone="red">{flagged.length}</Badge></CardHeader>
          <div className="divide-y divide-slate-50">
            {flagged.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div><p className="font-mono font-semibold text-slate-800">{p.number}</p><p className="text-xs text-slate-400">{[p.brand, p.color, p.state].filter(Boolean).join(" · ")}</p></div>
                <Badge tone={p.list === "graylist" ? "amber" : "red"}>{p.list === "graylist" ? "Lista gris" : "Lista negra"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-red-500" /> Visitantes</CardTitle><Badge tone="red">{blockedVisitors.length}</Badge></CardHeader>
          <div className="divide-y divide-slate-50">
            {blockedVisitors.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-500"><Ban className="h-4 w-4" /></div>
                <div><p className="font-medium text-slate-800">{v.name}</p><p className="text-xs text-slate-400">{v.reason} · {v.date}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
