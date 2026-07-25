import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AppFooter } from "@/components/layout/AppFooter";
import { siteConfig } from "@/lib/siteConfig";

// Archivo variável (eixo wdth 62–125) para a UI; IBM Plex Mono para microtexto,
// eyebrows e dados tabulares — a assinatura tipográfica do "instrumento".
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  axes: ["wdth"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
