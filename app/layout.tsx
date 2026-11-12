import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LiveRefresh } from "@/components/sports/live-refresh";
import { LiveStrip } from "@/components/sports/live-strip";
import { getLiveFixtures, getUpcomingFixtures } from "@/lib/data";
import { site } from "@/lib/site";

import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  category: "sports",
  keywords: [
    "esportes",
    "notícias esportivas",
    "resultados ao vivo",
    "classificações",
    "futebol",
    "basquete",
    "vôlei",
  ],
  alternates: { canonical: site.url },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: `${site.url}/og-default.svg`, width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const revalidate = 60;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: site.name,
  url: site.url,
  description: site.description,
  email: site.editorialEmail,
  inLanguage: "pt-BR",
  publishingPrinciples: `${site.url}/sobre`,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [liveFixtures, soon] = await Promise.all([getLiveFixtures(), getUpcomingFixtures(1)]);
  // Atualiza sozinho com jogo ao vivo ou começando nos próximos 15 minutos.
  const startsSoon = soon.some((fixture) => {
    const untilKickoff = new Date(fixture.kickoff).getTime() - Date.now();
    return untilKickoff < 15 * 60 * 1000 && untilKickoff > -30 * 60 * 1000;
  });

  return (
    <html lang={site.lang} className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="page-backdrop min-h-dvh antialiased">
        {/* Sem JavaScript as fotos não recebem o sinal de "carregada": mostra direto. */}
        <noscript>
          <style>{".img-fade{opacity:1!important}"}</style>
        </noscript>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-flood-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>

        <SiteHeader />
        <LiveStrip fixtures={liveFixtures} />
        <LiveRefresh active={liveFixtures.length > 0 || startsSoon} />

        <main id="conteudo">{children}</main>

        <SiteFooter />

        <script
          type="application/ld+json"
          // Dados institucionais do próprio portal.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
