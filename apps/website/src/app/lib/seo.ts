import { useEffect } from "react";
import { siteConfig, toAbsoluteUrl, toCanonicalUrl } from "./site";

export type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

export type SeoConfig = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  robots?: string;
  noIndex?: boolean;
  keywords?: string[];
  structuredData?: StructuredData;
};

type ResolvedSeoConfig = Required<
  Pick<SeoConfig, "title" | "description" | "image" | "type" | "keywords">
> & {
  canonicalUrl: string;
  robots: string;
  structuredData?: StructuredData;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stringifyStructuredData(value: StructuredData) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function resolveSeoConfig({
  title,
  description = siteConfig.description,
  path,
  image = siteConfig.ogImagePath,
  type = "website",
  robots,
  noIndex = false,
  keywords = [],
  structuredData,
}: SeoConfig): ResolvedSeoConfig {
  const pathname = path ?? "/";

  return {
    title,
    description,
    image: toAbsoluteUrl(image),
    type,
    keywords,
    structuredData,
    canonicalUrl: toCanonicalUrl(pathname),
    robots:
      robots ??
      (noIndex
        ? "noindex, nofollow, noarchive"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"),
  };
}

export function renderSeoHead(config: SeoConfig) {
  const resolved = resolveSeoConfig(config);
  const keywordsMeta = resolved.keywords.length
    ? `\n    <meta name="keywords" content="${escapeHtml(resolved.keywords.join(", "))}" />`
    : "";
  const structuredDataTag = resolved.structuredData
    ? `\n    <script type="application/ld+json">${stringifyStructuredData(
        resolved.structuredData,
      )}</script>`
    : "";

  return [
    `    <title>${escapeHtml(resolved.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(resolved.description)}" />`,
    keywordsMeta,
    `    <meta name="robots" content="${escapeHtml(resolved.robots)}" />`,
    `    <meta name="googlebot" content="${escapeHtml(resolved.robots)}" />`,
    `    <meta name="theme-color" content="${siteConfig.themeColor}" />`,
    `    <meta name="application-name" content="${siteConfig.name}" />`,
    `    <meta name="apple-mobile-web-app-title" content="${siteConfig.name}" />`,
    `    <meta property="og:site_name" content="${siteConfig.name}" />`,
    `    <meta property="og:locale" content="${siteConfig.locale}" />`,
    `    <meta property="og:type" content="${resolved.type}" />`,
    `    <meta property="og:title" content="${escapeHtml(resolved.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(resolved.description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(resolved.canonicalUrl)}" />`,
    `    <meta property="og:image" content="${escapeHtml(resolved.image)}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="${siteConfig.name} social preview" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(resolved.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(resolved.description)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(resolved.image)}" />`,
    `    <link rel="canonical" href="${escapeHtml(resolved.canonicalUrl)}" />`,
    structuredDataTag,
  ]
    .filter(Boolean)
    .join("\n");
}

function setMeta(
  selector: `name="${string}"` | `property="${string}"`,
  attributeName: "name" | "property",
  attributeValue: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${selector}]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function removeMeta(selector: `name="${string}"` | `property="${string}"`) {
  document.head.querySelector(`meta[${selector}]`)?.remove();
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function setStructuredData(structuredData: StructuredData | undefined) {
  const id = "swyft-structured-data";
  const existing = document.getElementById(id);

  if (!structuredData) {
    existing?.remove();
    return;
  }

  const script = existing ?? document.createElement("script");
  script.id = id;
  script.setAttribute("type", "application/ld+json");
  script.textContent = JSON.stringify(structuredData);

  if (!existing) {
    document.head.appendChild(script);
  }
}

export function usePageSeo({
  title,
  description = siteConfig.description,
  path,
  image = siteConfig.ogImagePath,
  type = "website",
  robots,
  noIndex = false,
  keywords,
  structuredData,
}: SeoConfig) {
  const keywordsContent = keywords?.join(", ");

  useEffect(() => {
    const resolved = resolveSeoConfig({
      title,
      description,
      path,
      image,
      type,
      robots,
      noIndex,
      keywords,
      structuredData,
    });

    document.title = title;

    setMeta('name="description"', "name", "description", description);
    setMeta('name="robots"', "name", "robots", resolved.robots);
    setMeta('name="googlebot"', "name", "googlebot", resolved.robots);
    setMeta('name="theme-color"', "name", "theme-color", siteConfig.themeColor);
    setMeta('name="application-name"', "name", "application-name", siteConfig.name);
    setMeta(
      'name="apple-mobile-web-app-title"',
      "name",
      "apple-mobile-web-app-title",
      siteConfig.name,
    );

    if (keywordsContent) {
      setMeta('name="keywords"', "name", "keywords", keywordsContent);
    } else {
      removeMeta('name="keywords"');
    }

    setMeta('property="og:site_name"', "property", "og:site_name", siteConfig.name);
    setMeta('property="og:locale"', "property", "og:locale", siteConfig.locale);
    setMeta('property="og:type"', "property", "og:type", type);
    setMeta('property="og:title"', "property", "og:title", title);
    setMeta('property="og:description"', "property", "og:description", description);
    setMeta('property="og:url"', "property", "og:url", resolved.canonicalUrl);
    setMeta('property="og:image"', "property", "og:image", resolved.image);
    setMeta(
      'property="og:image:alt"',
      "property",
      "og:image:alt",
      `${siteConfig.name} social preview`,
    );
    setMeta('property="og:image:width"', "property", "og:image:width", "1200");
    setMeta('property="og:image:height"', "property", "og:image:height", "630");

    setMeta('name="twitter:card"', "name", "twitter:card", "summary_large_image");
    setMeta('name="twitter:title"', "name", "twitter:title", title);
    setMeta('name="twitter:description"', "name", "twitter:description", description);
    setMeta('name="twitter:image"', "name", "twitter:image", resolved.image);

    setLink("canonical", resolved.canonicalUrl);
    setStructuredData(structuredData);
  }, [
    description,
    image,
    keywordsContent,
    keywords,
    noIndex,
    path,
    robots,
    structuredData,
    title,
    type,
  ]);
}
