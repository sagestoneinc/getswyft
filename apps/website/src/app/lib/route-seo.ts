import type { SeoConfig } from "./seo";
import { siteConfig, toAbsoluteUrl } from "./site";

const sharedKeywords = [
  "real estate chat widget",
  "real estate website chat",
  "lead conversion software",
  "real estate voice widget",
  "real estate communication platform",
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: `${siteConfig.url}/`,
  logo: toAbsoluteUrl("/icon-512.png"),
  email: "hello@swyftup.com",
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

const homeSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: `${siteConfig.url}/`,
  image: toAbsoluteUrl(siteConfig.ogImagePath),
  audience: {
    "@type": "Audience",
    audienceType: "Real estate agents, teams, and brokerages",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Embedded live chat",
    "Voice calling",
    "Lead routing",
    "After-hours capture",
    "Analytics dashboard",
    "CRM and webhook integrations",
  ],
};

const pricingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I try SwyftUp for free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Starter plan is free forever with up to 100 conversations per month and no credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "How does per-agent pricing work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You only pay for agents who actively use the platform, and you can add or remove seats at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a long-term contract?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. All plans are month-to-month, and you can cancel at any time without penalties.",
      },
    },
    {
      "@type": "Question",
      name: "What counts as a conversation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A conversation is a complete thread between a visitor and an agent, regardless of how many messages are exchanged.",
      },
    },
  ],
};

const marketingSeoByPath: Record<string, SeoConfig> = {
  "/": {
    title: "SwyftUp | Embedded Chat + Voice for Real Estate",
    description:
      "Convert more real estate leads with embedded chat, voice, smart routing, and after-hours capture built for brokerages and agent teams.",
    keywords: sharedKeywords,
    structuredData: [organizationSchema, websiteSchema, homeSchema],
  },
  "/product": {
    title: "Product | SwyftUp Real Estate Communication Platform",
    description:
      "Explore SwyftUp features including live chat, voice calls, lead routing, office hours, integrations, and analytics for real estate teams.",
    keywords: [...sharedKeywords, "voice calling for real estate", "real estate chat software"],
    structuredData: [organizationSchema, websiteSchema],
  },
  "/solutions": {
    title: "Solutions | SwyftUp for Brokerages, Teams, and Property Management",
    description:
      "See how SwyftUp helps brokerages, property managers, and real estate teams engage website visitors faster and close more deals.",
    keywords: [...sharedKeywords, "brokerage chat platform", "property management chat"],
    structuredData: [organizationSchema, websiteSchema],
  },
  "/pricing": {
    title: "Pricing | SwyftUp",
    description:
      "Compare SwyftUp pricing plans for solo agents, growing teams, and enterprise brokerages. Start free and scale as your pipeline grows.",
    keywords: [...sharedKeywords, "real estate chat pricing", "lead conversion pricing"],
    structuredData: [organizationSchema, websiteSchema, pricingFaqSchema],
  },
  "/about": {
    title: "About | SwyftUp",
    description:
      "Learn how SwyftUp helps modern real estate teams respond faster, capture every inquiry, and turn conversations into closings.",
    keywords: [...sharedKeywords, "about swyftup", "proptech communication software"],
    structuredData: [organizationSchema, websiteSchema],
  },
  "/contact": {
    title: "Book a Demo | SwyftUp",
    description:
      "Book a personalized SwyftUp demo to see live chat, voice, routing, and analytics in action for your real estate website.",
    keywords: [...sharedKeywords, "book real estate chat demo", "contact swyftup"],
    structuredData: [
      organizationSchema,
      websiteSchema,
      {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Book a Demo | SwyftUp",
        url: `${siteConfig.url}/contact`,
        description:
          "Schedule a personalized SwyftUp demo for your brokerage, real estate team, or property management website.",
      },
    ],
  },
  "/privacy": {
    title: "Privacy Policy | SwyftUp",
    description:
      "Review the SwyftUp privacy policy, including how we collect, use, retain, and protect customer and visitor information.",
    structuredData: [organizationSchema, websiteSchema],
  },
  "/terms": {
    title: "Terms of Service | SwyftUp",
    description:
      "Read the SwyftUp terms of service covering account responsibilities, acceptable use, billing, intellectual property, and support.",
    structuredData: [organizationSchema, websiteSchema],
  },
};

const appRouteMetadata = [
  {
    match: (pathname: string) => pathname === "/app" || pathname === "/app/inbox",
    title: "Inbox | SwyftUp",
    description: "Manage new conversations, assignments, and lead responses in the SwyftUp inbox.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/app/conversation/"),
    title: "Conversation | SwyftUp",
    description: "Review lead context, reply in real time, and manage live conversations in SwyftUp.",
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
    description: "Track response times, conversation volume, and lead conversion performance in SwyftUp.",
  },
  {
    match: (pathname: string) => pathname === "/app/team",
    title: "Team | SwyftUp",
    description: "Manage agent accounts, roles, availability, and team-level workspace settings.",
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

export function getMarketingSeo(pathname: string) {
  return marketingSeoByPath[pathname] ?? marketingSeoByPath["/"];
}

export function getAppSeo(pathname: string): SeoConfig {
  const metadata =
    appRouteMetadata.find((route) => route.match(pathname)) ?? {
      title: "Workspace | SwyftUp",
      description: "Secure SwyftUp workspace for managing real estate lead conversations.",
    };

  return {
    ...metadata,
    noIndex: true,
  };
}
