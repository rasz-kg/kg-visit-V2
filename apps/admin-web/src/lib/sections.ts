import { Shield, Users, UserCog, ShieldCheck, UserPlus, type LucideIcon } from "lucide-react";

export type SectionKey = "admins" | "colaboradores" | "supervisores" | "guardias" | "visitantes";

export interface SectionDef {
  key: SectionKey;
  title: string;
  subtitle: string;
  singular: string;
  source: "users" | "visitors";
  role?: string; // slug de rol cuando source = users
  icon: LucideIcon;
  accent: string; // clase de color de acento (borde/icono)
}

export const SECTIONS: Record<SectionKey, SectionDef> = {
  admins: {
    key: "admins", title: "Administradores", subtitle: "Gestión de accesos administrativos",
    singular: "administrador", source: "users", role: "admin", icon: Shield, accent: "text-brand-500",
  },
  supervisores: {
    key: "supervisores", title: "Supervisores", subtitle: "Autorización y denegación de visitas",
    singular: "supervisor", source: "users", role: "supervisor", icon: UserCog, accent: "text-violet-500",
  },
  colaboradores: {
    key: "colaboradores", title: "Colaboradores", subtitle: "Residentes / staff registrados",
    singular: "colaborador", source: "users", role: "resident", icon: Users, accent: "text-blue-500",
  },
  guardias: {
    key: "guardias", title: "Guardias", subtitle: "Seguridad y monitoreo en caseta",
    singular: "guardia", source: "users", role: "guard", icon: ShieldCheck, accent: "text-emerald-500",
  },
  visitantes: {
    key: "visitantes", title: "Visitantes", subtitle: "Control de accesos externos",
    singular: "visitante", source: "visitors", icon: UserPlus, accent: "text-amber-500",
  },
};

export const SECTION_LIST = Object.values(SECTIONS);

export function getSection(key: string): SectionDef | undefined {
  return (SECTIONS as Record<string, SectionDef>)[key];
}
