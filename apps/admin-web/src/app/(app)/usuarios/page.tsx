"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { users } from "@/lib/mock";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administradores", supervisor: "Supervisores", staff: "Staff",
  guard: "Guardias", resident: "Residentes",
};
const ROLE_TONE: Record<Role, "orange" | "violet" | "blue" | "green" | "slate"> = {
  admin: "orange", supervisor: "violet", staff: "blue", guard: "green", resident: "slate",
};
const TABS: (Role | "all")[] = ["all", "admin", "supervisor", "staff", "guard", "resident"];

export default function UsuariosPage() {
  const [tab, setTab] = React.useState<Role | "all">("all");
  const list = users.filter((u) => tab === "all" || u.role === tab);

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administradores, supervisores, staff, guardias y residentes."
        actions={<Button><Plus className="h-4 w-4" /> Nuevo usuario</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-brand-500 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t === "all" ? "Todos" : ROLE_LABEL[t]}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Correo</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-5 py-3 text-slate-500">@{u.username}</td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role].replace(/s$/, "")}</Badge></td>
                  <td className="px-5 py-3"><Badge tone={u.status ? "green" : "slate"}>{u.status ? "Activo" : "Inactivo"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
