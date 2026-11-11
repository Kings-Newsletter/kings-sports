import { site } from "@/lib/site";

type MetaInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  noIndex?: boolean;
};

/** Metadados consistentes: canonical, Open Graph e Twitter. */
export function buildMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  image,
  noIndex,
}: MetaInput) {
  const url = `${site.url.replace(/\/+$/, "")}${path === "/" ? "" : path}`;
  const ogImage = image ?? `${site.url.replace(/\/+$/, "")}/og-default.svg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      url,
      siteName: site.name,
      title,
      description,
      locale: "pt_BR",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [ogImage],
    },
  };
}
