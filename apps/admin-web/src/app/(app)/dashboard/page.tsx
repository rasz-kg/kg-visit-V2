import {
  Users, Building2, Wrench, UserCheck, Smartphone, DoorOpen, TrendingUp,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle, Badge, PageHeader } from "@/components/ui";
import { getDashboardStats, getVisits, getDashboardCharts } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

const STAT_META = [
  { key: "visits", label: "Total de visitas", icon: DoorOpen, tone: "text-brand-500" },
  { key: "houses", label: "Domicilios", icon: Building2, tone: "text-blue-500" },
  { key: "services", label: "Tipos de servicio", icon: Wrench, tone: "text-violet-500" },
  { key: "visitors", label: "Visitantes", icon: Users, tone: "text-emerald-500" },
  { key: "activated", label: "Colonos activados", icon: UserCheck, tone: "text-amber-500" },
  { key: "usingApp", label: "Colonos usando la App", icon: Smartphone, tone: "text-sky-500" },
] as const;

const TYPE_TONE: Record<string, string> = {
  service: "bg-blue-500", employee: "bg-red-500", visitor: "bg-amber-500",
  resident: "bg-emerald-500", provider: "bg-violet-500", event: "bg-sky-500",
};

const statusTone: Record<string, "green" | "blue" | "amber" | "red" | "slate"> = {
  inside: "green", authorized: "blue", pending: "amber", denied: "red", finished: "slate",
};

export default async function DashboardPage() {
  const [statsData, visits, charts] = await Promise.all([getDashboardStats(), getVisits(), getDashboardCharts()]);
  const stats = STAT_META.map((m) => ({ ...m, value: statsData[m.key] }));
  const recent = visits.slice(0, 6);
  const peak = charts.peak;
  const maxPeak = Math.max(1, ...peak.map((p) => p.v));
  const visitTypes = charts.types.map((t) => ({ ...t, tone: TYPE_TONE[t.key] ?? "bg-slate-400" }));
  const totalTypes = Math.max(1, visitTypes.reduce((a, b) => a + b.value, 0));
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de accesos y actividad de la comunidad."
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <TrendingUp className="h-4 w-4 text-brand-500" /> Últimos 7 días
          </span>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardBody className="p-4">
                <Icon className={`h-5 w-5 ${s.tone}`} />
                <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Gráficas */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Horas pico de acceso</CardTitle>
            <Badge tone={charts.real ? "green" : "slate"}>{charts.real ? "Datos reales" : "Demo"}</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex h-48 items-end gap-1">
              {peak.map((p) => (
                <div key={p.h} className="flex h-full flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-300 transition-all"
                      style={{ height: `${(p.v / maxPeak) * 100}%` }}
                      title={`${p.h}:00 — ${p.v} accesos`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">{Number(p.h) % 3 === 0 ? `${p.h}h` : ""}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de visita</CardTitle>
            <Badge tone={charts.real ? "green" : "slate"}>{charts.real ? "Reales" : "Demo"}</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {visitTypes.map((t) => (
              <div key={t.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{t.label}</span>
                  <span className="text-slate-400">{Math.round((t.value / totalTypes) * 100)}% · {t.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${t.tone}`} style={{ width: `${(t.value / totalTypes) * 100}%` }} />
                </div>
              </div>
            ))}
            {visitTypes.length === 0 && <p className="text-sm text-slate-400">Sin visitas registradas todavía.</p>}
          </CardBody>
        </Card>
      </div>

      {/* Visitas recientes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Visitas recientes</CardTitle>
          <Badge tone="orange">En vivo</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Visita</th>
                <th className="px-5 py-3 font-medium">Domicilio</th>
                <th className="px-5 py-3 font-medium">Llegada</th>
                <th className="px-5 py-3 font-medium">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{v.title}</p>
                    <p className="text-xs text-slate-400">{v.who}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{v.houseAddress}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(v.arriveDate)}</td>
                  <td className="px-5 py-3"><Badge tone={statusTone[v.status] ?? "slate"}>{v.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
