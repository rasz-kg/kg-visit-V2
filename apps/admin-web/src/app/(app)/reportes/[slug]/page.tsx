import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, PageHeader, EmptyState } from "@/components/ui";
import { REPORTS_CATALOG } from "../catalog";
import { REPORTS, type ReportFilters } from "../queries";

export default async function ReportePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const meta = REPORTS_CATALOG.find((r) => r.slug === slug);
  const query = REPORTS[slug];
  if (!meta || !query) notFound();

  const { from, to } = await searchParams;
  const filters: ReportFilters = { from, to };
  const result = await query(filters);

  return (
    <>
      <PageHeader
        title={meta.title}
        subtitle={meta.description}
        actions={
          <Link href="/reportes">
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Volver al hub</Button>
          </Link>
        }
      />

      {/* Filtro de rango de fechas (GET → searchParams) */}
      <Card className="mb-5">
        <form method="get" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Desde
            <input
              type="date"
              name="from"
              defaultValue={from ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Hasta
            <input
              type="date"
              name="to"
              defaultValue={to ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
            />
          </label>
          <Button type="submit">Aplicar</Button>
          <Link href={`/reportes/${slug}`}>
            <Button type="button" variant="ghost">Limpiar</Button>
          </Link>
        </form>
      </Card>

      {/* Total / resumen arriba */}
      <Card className="mb-5">
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{result.total}</p>
          </div>
          <p className="text-sm text-slate-500">{result.totalLabel}</p>
        </div>
      </Card>

      {/* Tabla de registros reales */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
          <Badge tone="slate">{result.rows.length}</Badge>
        </CardHeader>
        {result.rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Sin registros"
              hint="No hay datos para este reporte en el rango seleccionado, o Supabase no está configurado."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  {result.columns.map((c) => (
                    <th key={c.key} className="px-5 py-3 font-medium">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    {result.columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-5 py-3 text-slate-600 ${c.mono ? "font-mono font-semibold text-slate-800" : ""}`}
                      >
                        {row[c.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
