import { useWindowDimensions } from "react-native";

// Threshold tablet vs phone (MuMu emula tablet 1440×2560 — orientación portrait/landscape).
const TABLET_MIN_WIDTH = 768;

// Hook util para layout adaptativo: la app de caseta es PRINCIPALMENTE para tablet,
// pero conviene mantener una versión phone usable. Devuelve `true` en pantallas anchas.
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_MIN_WIDTH;
}

// Paleta KG-Visit V2 — light mode premium para caseta. Inspirada en la app
// original (VisitApp Guard) que usa un header brillante a todo lo ancho con
// botones outline blancos, y aterriza la identidad KG (naranja #f97316).
// El resto de la pantalla queda en light mode para máxima legibilidad bajo
// la luz fuerte que suele haber en una caseta de control.
export const colors = {
  brand: "#f97316",        // naranja KG primario (header)
  brandDark: "#ea580c",
  brandSoft: "#ffedd5",    // hover/press del brand

  bg: "#f8fafc",           // fondo principal
  card: "#ffffff",         // tarjetas/superficies
  border: "#e2e8f0",       // borde sutil
  borderStrong: "#cbd5e1",

  ink: "#0f172a",          // tinta oscura (para footer/modal headers si fuera necesario)
  ink800: "#1e293b",

  text: "#0f172a",
  textMuted: "#475569",
  textFaint: "#94a3b8",

  // Utilidades cromáticas para el header naranja:
  // overlays blancos translúcidos (search, chips outline, hover sutil)
  headerOverlay: "rgba(255,255,255,0.18)",
  headerOverlayStrong: "rgba(255,255,255,0.28)",

  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
  blue: "#2563eb",
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32 };

// Mapa de estatus de visita → etiqueta + color (espejo del portal/admin).
export const VISIT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: colors.amber },
  authorized: { label: "Autorizada", color: colors.blue },
  denied: { label: "Denegada", color: colors.red },
  inside: { label: "Dentro", color: colors.green },
  finished: { label: "Salió", color: colors.textMuted },
  canceled: { label: "Cancelada", color: colors.textMuted },
  expired: { label: "Expirada", color: colors.textMuted },
};

// Etiquetas legibles para el tipo (kind) de visita; sirven al filtro y a la fila.
export const VISIT_KIND: Record<string, string> = {
  visitor: "Visita",
  employee: "Empleado",
  service: "Servicio",
  resident: "Colono",
  provider: "Proveedor",
  event: "Evento",
};
