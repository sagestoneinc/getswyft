import { getMarketingPage } from "../content/marketing-content";
import type { SeoConfig, StructuredData } from "./seo";
import { siteConfig, toAbsoluteUrl } from "./site";

function toStructuredDataArray(value: StructuredData | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: `${siteConfig.url}/`,
  logo: toAbsoluteUrl("/icon-512.png"),
  email: "hello@getswyftup.com",
  description: siteConfig.description,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: `${siteConfig.url}/`,
  description: siteConfig.description,
  inLanguage: "en-US",
};

export function getMarketingSeo(pathname: string): SeoConfig {
  const page = getMarketingPage(pathname) ?? getMarketingPage("/");

  if (!page) {
    return {
      title: siteConfig.name,
      description: siteConfig.description,
    };
  }

  const structuredData = [organizationSchema, websiteSchema, ...toStructuredDataArray(page.structuredData)];

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    structuredData,
  };
}

const appRouteMetadata = [
  {
    match: (pathname: string) => pathname === "/app" || pathname === "/app/inbox",
    title: "Inbox | SwyftUp",
    description: "Manage customer conversations, assignments, and team follow-up in the SwyftUp inbox.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/app/conversation/"),
    title: "Conversation | SwyftUp",
    description: "Review context, respond in real time, and manage live customer conversations in SwyftUp.",
  },
  {
    match: (pathname: string) => pathname === "/app/routing",
    title: "Routing Settings | SwyftUp",
    description: "Configure assignment rules, office hours, and fallback logic for incoming conversations.",
  },
  {
    match: (pathname: string) => pathname === "/app/webhooks",
    title: "Webhooks | SwyftUp",
    description: "Manage webhook endpoints, integrations, and delivery logs for SwyftUp events.",
  },
  {
    match: (pathname: string) => pathname === "/app/analytics",
    title: "Analytics | SwyftUp",
    description: "Track response time, conversation volume, and workflow performance in SwyftUp.",
  },
  {
    match: (pathname: string) => pathname === "/app/team",
    title: "Team | SwyftUp",
    description: "Manage team members, roles, availability, and workspace settings.",
  },
  {
    match: (pathname: string) => pathname === "/app/billing",
    title: "Billing | SwyftUp",
    description: "Review plans, invoices, seats, and payment details for your SwyftUp workspace.",
  },
  {
    match: (pathname: string) => pathname === "/app/profile",
    title: "Profile | SwyftUp",
    description: "Update your account profile, security preferences, and support settings in SwyftUp.",
  },
];

export function getAppSeo(pathname: string): SeoConfig {
  const metadata =
    appRouteMetadata.find((route) => route.match(pathname)) ?? {
      title: "Workspace | SwyftUp",
      description: "Secure SwyftUp workspace for managing customer communication workflows.",
    };

  return {
    ...metadata,
    noIndex: true,
  };
}
