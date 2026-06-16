import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KG-Visit · Panel de administración",
  description: "Control de acceso y gestión de visitantes — residencial, corporativo e industrial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
