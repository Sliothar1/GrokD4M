import type { Metadata } from "next";

/** Public site origin. Override with NEXT_PUBLIC_SITE_URL or SITE_URL. */
export const DEFAULT_SITE_URL = "https://hurlingwiki.vercel.app";

export const SITE_DESCRIPTION =
  "Hurling knowledge site showing how MIT's D4M associative arrays hold sports facts as sparse triples.";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

export function absUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${suffix}`;
}

export function sitemapUrl(): string {
  return `${siteUrl()}/sitemap.xml`;
}

/** Canonical, Open Graph, and Twitter tags for one public path. */
export function withPageMeta(input: {
  title?: string;
  path: string;
  description?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const description = input.description ?? SITE_DESCRIPTION;
  const socialTitle = input.title ? `${input.title} · HurlingWiki` : "HurlingWiki";
  const meta: Metadata = {
    description,
    alternates: { canonical: input.path },
    openGraph: {
      title: socialTitle,
      description,
      url: input.path,
      siteName: "HurlingWiki",
      type: "website",
      locale: "en_IE",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
  if (input.title) meta.title = input.title;
  if (input.robots) meta.robots = input.robots;
  return meta;
}
