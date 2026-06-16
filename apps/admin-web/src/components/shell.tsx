"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, Search, LogOut, MapPin } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-black text-white">KG</div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-wide text-white">
            KG-<span className="text-brand-400">Visit</span>
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Visitor Control</p>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar fijo en desktop */}
      <aside className="hidden bg-ink-900 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] bg-ink-900 animate-fade-in">
            <button
              className="absolute right-3 top-4 rounded-md p-1 text-slate-400 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Columna de contenido */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Buscar visitas, placas, domicilios…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">
              <MapPin className="h-3.5 w-3.5 text-brand-500" /> Sede Norte
            </span>
            <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">AG</div>
              <span className="hidden text-sm font-medium text-slate-700 sm:inline">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
