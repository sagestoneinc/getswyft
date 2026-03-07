export const siteConfig = {
  name: "SwyftUp",
  shortName: "SwyftUp",
  description:
    "A flexible customer communication platform with chat, voice, and AI automation built for any business.",
  locale: "en_US",
  themeColor: "#0f2744",
  ogImagePath: "/og-image.png",
  url: (import.meta.env.VITE_SITE_URL || "https://www.getswyftup.com").replace(/\/$/, ""),
} as const;

export const publicSitePaths = [
  "/",
  "/product",
  "/product/features",
  "/product/integrations",
  "/product/security",
  "/product/developers",
  "/solutions/real-estate",
  "/solutions/ecommerce",
  "/solutions/professional-services",
  "/solutions/healthcare",
  "/solutions/education",
  "/solutions/local-business",
  "/pricing",
  "/blog",
  "/resources/guides",
  "/resources/case-studies",
  "/resources/changelog",
  "/help",
  "/about",
  "/contact",
  "/careers",
  "/partners",
  "/privacy",
  "/terms",
  "/cookies",
  "/dpa",
] as const;

export function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toCanonicalUrl(pathname: string) {
  if (!pathname || pathname === "/") {
    return `${siteConfig.url}/`;
  }

  return `${siteConfig.url}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
