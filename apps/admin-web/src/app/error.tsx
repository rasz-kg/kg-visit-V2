"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción enviar a observabilidad (Sentry/Logflare).
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Error</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Algo salió mal</h1>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Ocurrió un problema al cargar esta sección. Puedes reintentar; si persiste, contacta a soporte.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
