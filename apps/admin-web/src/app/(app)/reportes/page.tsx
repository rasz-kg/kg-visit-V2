import { Download, BarChart3 } from "lucide-react";
import { Card, CardBody, Button, PageHeader } from "@/components/ui";
import { reports } from "@/lib/mock";

export default function ReportesPage() {
  const groups = Array.from(new Set(reports.map((r) => r.group)));
  return (
    <>
      <PageHeader title="Reportes" subtitle="15 reportes operativos, de seguridad, cobranza y comunidad." />
      {groups.map((group) => (
        <div key={group} className="mb-7">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{group}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.filter((r) => r.group === group).map((r) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><BarChart3 className="h-4 w-4" /></div>
                    <Button variant="ghost" className="px-2"><Download className="h-4 w-4" /></Button>
                  </div>
                  <p className="mt-3 font-semibold text-slate-900">{r.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{r.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
