import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Página no encontrada</h1>
        <p className="mt-1 text-sm text-slate-500">La ruta que buscas no existe o fue movida.</p>
        <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
