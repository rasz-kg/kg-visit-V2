import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { SECTION_LIST } from "@/lib/sections";
import { getPeople } from "@/lib/data";

export default async function UsuariosPage() {
  const counts = await Promise.all(SECTION_LIST.map((s) => getPeople(s).then((p) => p.length).catch(() => 0)));

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Gestiona los perfiles del sistema por tipo de acceso." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_LIST.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.key}
              href={`/usuarios/${s.key}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-current opacity-80" aria-hidden />
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-slate-50 ${s.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{counts[i]}</span>
              </div>
              <p className="mt-4 flex items-center gap-1 font-semibold text-slate-900">
                {s.title}
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="text-sm text-slate-500">{s.subtitle}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
