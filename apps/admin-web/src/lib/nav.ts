import {
  LayoutDashboard,
  DoorOpen,
  Building2,
  Users,
  Car,
  MapPinned,
  ShieldCheck,
  Wrench,
  Megaphone,
  BarChart3,
  MessageSquareWarning,
  Ban,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles que ven este módulo. */
  roles?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Operación",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Visitas", href: "/visitas", icon: DoorOpen },
      { label: "Departamentos", href: "/departamentos", icon: Building2 },
      { label: "Autos y placas", href: "/autos", icon: Car },
    ],
  },
  {
    title: "Personas",
    items: [
      { label: "Usuarios", href: "/usuarios", icon: Users },
      { label: "Lista negra", href: "/lista-negra", icon: Ban },
    ],
  },
  {
    title: "Comunidad",
    items: [
      { label: "Avisos", href: "/avisos", icon: Megaphone },
      { label: "Sugerencias y quejas", href: "/sugerencias", icon: MessageSquareWarning },
      { label: "Reportes", href: "/reportes", icon: BarChart3 },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Sedes", href: "/sedes", icon: MapPinned },
      { label: "Casetas", href: "/casetas", icon: ShieldCheck },
      { label: "Servicios", href: "/servicios", icon: Wrench },
      { label: "Ajustes", href: "/configuracion", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);
