import Link from "next/link";
import { ChevronRight, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { REPORTS_CATALOG, REPORT_GROUPS } from "./catalog";

export default function ReportesPage() {
  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="14 sub-reportes operativos, de seguridad, operación y comunidad — con datos reales y rango de fechas."
      />
      {REPORT_GROUPS.map((group) => {
        const items = REPORTS_CATALOG.filter((r) => r.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mb-7">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{group}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <Link
                  key={r.slug}
                  href={`/reportes/${r.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-4 font-semibold text-slate-900">{r.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{r.description}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
