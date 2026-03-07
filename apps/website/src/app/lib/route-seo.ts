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

const breadcrumbLabelMap: Record<string, string> = {
  product: "Product",
  features: "Features",
  integrations: "Integrations",
  security: "Security",
  developers: "Developers",
  solutions: "Solutions",
  "real-estate": "Real Estate",
  ecommerce: "Ecommerce",
  "professional-services": "Professional Services",
  healthcare: "Healthcare",
  education: "Education",
  "local-business": "Local Business",
  pricing: "Pricing",
  resources: "Resources",
  guides: "Guides",
  "case-studies": "Case Studies",
  changelog: "Changelog",
  blog: "Blog",
  help: "Help Center",
  about: "About",
  contact: "Contact",
  careers: "Careers",
  partners: "Partners",
  privacy: "Privacy",
  terms: "Terms",
  cookies: "Cookies",
  dpa: "DPA",
};

function formatBreadcrumbLabel(segment: string) {
  const mapped = breadcrumbLabelMap[segment];
  if (mapped) {
    return mapped;
  }

  return segment
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function buildBreadcrumbSchema(pathname: string): StructuredData | undefined {
  if (!pathname || pathname === "/") {
    return undefined;
  }

  const parts = pathname.split("/").filter(Boolean);
  const itemListElement: Array<Record<string, unknown>> = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${siteConfig.url}/`,
    },
  ];

  let currentPath = "";

  for (const [index, part] of parts.entries()) {
    currentPath += `/${part}`;
    itemListElement.push({
      "@type": "ListItem",
      position: index + 2,
      name: formatBreadcrumbLabel(part),
      item: toAbsoluteUrl(currentPath),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export function getMarketingSeo(pathname: string): SeoConfig {
  const page = getMarketingPage(pathname) ?? getMarketingPage("/");

  if (!page) {
    return {
      title: siteConfig.name,
      description: siteConfig.description,
    };
  }

  const breadcrumbSchema = buildBreadcrumbSchema(page.slug);
  const structuredData = [
    organizationSchema,
    websiteSchema,
    ...toStructuredDataArray(page.structuredData),
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
  ];

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
    match: (pathname: string) => pathname === "/app/integrations",
    title: "Integrations | SwyftUp",
    description: "Configure tenant widget embeds, environment settings, and integration endpoints for client websites.",
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
    match: (pathname: string) => pathname === "/app/notifications",
    title: "Notifications | SwyftUp",
    description: "Review in-app notifications, push readiness, and delivery status in your SwyftUp workspace.",
  },
  {
    match: (pathname: string) => pathname === "/app/ai",
    title: "AI Config | SwyftUp",
    description: "Configure tenant AI providers, prompts, and runtime settings for SwyftUp assistants.",
  },
  {
    match: (pathname: string) => pathname === "/app/moderation",
    title: "Moderation | SwyftUp",
    description: "Track and resolve moderation reports across messages and tenant interactions.",
  },
  {
    match: (pathname: string) => pathname === "/app/audit",
    title: "Audit Logs | SwyftUp",
    description: "Inspect tenant audit logs for secure operations, access control, and compliance reviews.",
  },
  {
    match: (pathname: string) => pathname === "/app/collaboration",
    title: "Collaboration | SwyftUp",
    description: "Manage channels, call sessions, feed posts, and compliance exports in one workspace.",
  },
  {
    match: (pathname: string) => pathname === "/app/admin",
    title: "Admin Control Center | SwyftUp",
    description: "Review tenant operations, health alerts, and system readiness from the SwyftUp admin workspace.",
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
