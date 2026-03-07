export const siteConfig = {
  name: "SwyftUp",
  shortName: "SwyftUp",
  description:
    "Embedded chat and voice for real estate websites. Capture leads 24/7, route conversations to the right agent, and convert more visitors into closings.",
  locale: "en_US",
  themeColor: "#0f2744",
  ogImagePath: "/og-image.png",
  url: (import.meta.env.VITE_SITE_URL || "https://swyftup.com").replace(/\/$/, ""),
} as const;

export const publicSitePaths = [
  "/",
  "/product",
  "/solutions",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
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
