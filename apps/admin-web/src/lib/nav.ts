import {
  LayoutDashboard, DoorOpen, Building2, Users, Car, MapPinned, ShieldCheck, Wrench,
  Megaphone, BarChart3, MessageSquareWarning, Ban, Settings, Truck, Building, Video,
  Tag, Tags, AlertTriangle, MapPin, Smartphone, CalendarDays, BookOpenCheck, UserCog,
  MessageSquare, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
      { label: "Emulador de apps", href: "/emulador", icon: Smartphone },
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
      { label: "Respuestas de tickets", href: "/m/respuestas-ticket", icon: MessageSquare },
      { label: "Eventos", href: "/m/eventos", icon: CalendarDays },
      { label: "Reservaciones", href: "/m/reservaciones", icon: BookOpenCheck },
      { label: "Amenidades", href: "/m/espacios", icon: MapPin },
      { label: "Categorías de tickets", href: "/m/categorias-ticket", icon: Tags },
      { label: "Incidentes", href: "/m/incidentes", icon: AlertTriangle },
      { label: "Reportes", href: "/reportes", icon: BarChart3 },
    ],
  },
  {
    title: "Catálogos",
    items: [
      { label: "Servicios", href: "/m/servicios", icon: Wrench },
      { label: "Transportes", href: "/m/transportes", icon: Truck },
      { label: "Proveedores", href: "/m/proveedores", icon: Building },
      { label: "Etiquetas (TAGs)", href: "/m/etiquetas", icon: Tag },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Sedes", href: "/sedes", icon: MapPinned },
      { label: "Casetas", href: "/m/casetas", icon: ShieldCheck },
      { label: "Cámaras IP", href: "/m/camaras", icon: Video },
      { label: "Roles", href: "/m/roles", icon: UserCog },
      { label: "Configurar residencial", href: "/configuracion", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);
