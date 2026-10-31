import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "✦ Tarot ✦ — Lecturas guiadas por la intuición",
  description:
    "Tirá las cartas y recibí una lectura de tarot personalizada con inteligencia artificial. Para entretenimiento y reflexión personal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
