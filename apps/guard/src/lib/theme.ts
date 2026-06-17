import { useWindowDimensions } from "react-native";

// Threshold tablet vs phone (MuMu emula tablet 1440×2560 — orientación portrait/landscape).
const TABLET_MIN_WIDTH = 768;

// Hook util para layout adaptativo: la app de caseta es PRINCIPALMENTE para tablet,
// pero conviene mantener una versión phone usable. Devuelve `true` en pantallas anchas.
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_MIN_WIDTH;
}

// Paleta KG-Visit (alineada con el portal admin y la app V1: naranja sobre tinta oscura).
export const colors = {
  brand: "#f97316", // naranja KG-Visit
  brandDark: "#ea580c",
  brandSoft: "#ffedd5",
  ink: "#1f2430", // tinta oscura (header)
  ink800: "#2b3140",
  bg: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  text: "#18181b",
  textMuted: "#71717a",
  textFaint: "#a1a1aa",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  blue: "#3b82f6",
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

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
