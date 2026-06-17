// Paleta KG-Visit (dark premium). Inspirada en VisitApp pero con identidad KG (naranja).
// Mantenemos los nombres legados (`ink`, `card`, `brandSoft`, `brandDark`) con valores dark
// para no romper pantallas existentes, y añadimos `surface`, `surfaceHi`, `borderStrong`,
// `violet` y `pink` para los acentos del nuevo dashboard.
export const colors = {
  brand: "#f97316", // naranja KG primario
  brandSoft: "#f9731622", // glow del brand (22 alpha)
  brandDark: "#ea580c",

  bg: "#0F1729", // fondo principal dark (negro azulado profundo)
  surface: "#1a2238", // tarjetas / superficies elevadas
  surfaceHi: "#252e48", // hover / active sobre surface
  card: "#1a2238", // alias legado → mismo valor que surface
  ink: "#0F1729", // alias legado para headers → mismo fondo
  ink800: "#1a2238", // alias legado → surface

  border: "#2a334e", // borde sutil sobre dark
  borderStrong: "#3d4866",

  text: "#f5f5f7", // texto principal claro
  textMuted: "#94a3b8", // texto secundario gris frío
  textFaint: "#64748b", // texto terciario

  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  blue: "#3b82f6",
  violet: "#a855f7",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
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
