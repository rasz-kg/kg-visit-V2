"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) {
      router.replace("/dashboard"); // modo demo sin backend
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-xl font-black text-white">KG</div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-white">
              KG-<span className="text-brand-400">Visit</span>
            </p>
            <p className="text-xs uppercase tracking-widest text-slate-400">Panel de administración</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kg-demo.mx"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Acceder
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          Acceso seguro · sesión protegida por RLS
        </p>
      </div>
    </main>
  );
}
