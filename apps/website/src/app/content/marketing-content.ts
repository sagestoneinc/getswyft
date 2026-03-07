import type { StructuredData } from "../lib/seo";
import { siteConfig } from "../lib/site";

export type MarketingAction = {
  label: string;
  to: string;
  variant?: "primary" | "secondary" | "ghost";
};

export type IconName =
  | "analytics"
  | "book"
  | "briefcase"
  | "building"
  | "calendar"
  | "cart"
  | "chat"
  | "check"
  | "clock"
  | "code"
  | "education"
  | "files"
  | "globe"
  | "health"
  | "help"
  | "integrations"
  | "link"
  | "local"
  | "message"
  | "partners"
  | "routing"
  | "security"
  | "sparkles"
  | "team"
  | "voice"
  | "workflow";

export type MarketingHero = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions: MarketingAction[];
  stats?: Array<{ value: string; label: string }>;
  visual: {
    eyebrow?: string;
    title: string;
    items: string[];
    footer: string;
  };
};

export type MarketingFaq = {
  question: string;
  answer: string;
};

export type MarketingLinkItem = {
  label: string;
  to: string;
  description: string;
  icon?: IconName;
};

export type MarketingCardItem = {
  title: string;
  description: string;
  icon: IconName;
  to?: string;
  eyebrow?: string;
  meta?: string;
};

export type MarketingStepItem = {
  title: string;
  description: string;
  icon: IconName;
};

export type MarketingPricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  bestFor: string;
  ctaLabel: string;
  highlight?: string;
  included: string[];
};

export type MarketingPricingRow = {
  label: string;
  values: string[];
};

export type MarketingResourceItem = {
  title: string;
  description: string;
  meta: string;
  to: string;
  icon: IconName;
};

export type MarketingLegalEntry = {
  title: string;
  paragraphs: string[];
};

export type MarketingFormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "select" | "textarea";
  placeholder: string;
  required?: boolean;
  helper?: string;
  options?: string[];
};

export type MarketingTestimonial = {
  quote: string;
  name: string;
  role: string;
};

export type MarketingVisualSlide = {
  title: string;
  description: string;
  caption: string;
  items?: string[];
  imageSrc?: string;
  imageAlt?: string;
};

export type MarketingPageSection =
  | {
      kind: "copy";
      eyebrow?: string;
      title: string;
      paragraphs: string[];
      action?: MarketingAction;
    }
  | {
      kind: "list";
      eyebrow?: string;
      title: string;
      intro?: string;
      items: string[];
      columns?: 2 | 3;
    }
  | {
      kind: "steps";
      eyebrow?: string;
      title: string;
      intro?: string;
      items: MarketingStepItem[];
    }
  | {
      kind: "cards";
      eyebrow?: string;
      title: string;
      intro?: string;
      items: MarketingCardItem[];
      columns?: 2 | 3 | 4;
    }
  | {
      kind: "visualGallery";
      eyebrow?: string;
      title: string;
      intro?: string;
      slides: MarketingVisualSlide[];
      action?: MarketingAction;
    }
  | {
      kind: "pricing";
      eyebrow?: string;
      title: string;
      intro?: string;
      plans: MarketingPricingPlan[];
      matrix?: MarketingPricingRow[];
      footnote?: string;
    }
  | {
      kind: "resources";
      eyebrow?: string;
      title: string;
      intro?: string;
      chips?: string[];
      searchPlaceholder?: string;
      items: MarketingResourceItem[];
    }
  | {
      kind: "socialProof";
      eyebrow?: string;
      title: string;
      intro?: string;
      logosText?: string;
      logos?: string[];
      testimonials: MarketingTestimonial[];
    }
  | {
      kind: "form";
      eyebrow?: string;
      title: string;
      intro?: string;
      expectations?: string[];
      fields: MarketingFormField[];
      privacyNote: string;
      submitLabel: string;
      successMessage: string;
    }
  | {
      kind: "legal";
      eyebrow?: string;
      title: string;
      intro?: string;
      notice?: string;
      sections: MarketingLegalEntry[];
    }
  | {
      kind: "faqs";
      eyebrow?: string;
      title: string;
      items: MarketingFaq[];
    }
  | {
      kind: "links";
      eyebrow?: string;
      title: string;
      intro?: string;
      items: MarketingLinkItem[];
      columns?: 2 | 3;
    }
  | {
      kind: "cta";
      eyebrow?: string;
      title: string;
      body: string;
      actions: MarketingAction[];
    };

export type MarketingPage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  hero: MarketingHero;
  sections: MarketingPageSection[];
  structuredData?: StructuredData;
};

export type NavItem = {
  label: string;
  to: string;
  description: string;
};

export type NavGroup = {
  label: string;
  href?: string;
  items?: NavItem[];
};

const demoAction: MarketingAction = { label: "Book a Demo", to: "/contact", variant: "primary" };
const salesAction: MarketingAction = {
  label: "Talk to Sales",
  to: "/contact",
  variant: "secondary",
};
const productAction: MarketingAction = { label: "See Product", to: "/product", variant: "secondary" };
const pricingAction: MarketingAction = { label: "View Pricing", to: "/pricing", variant: "secondary" };
const featuresAction: MarketingAction = {
  label: "Explore Features",
  to: "/product/features",
  variant: "secondary",
};
const integrationsAction: MarketingAction = {
  label: "See Integrations",
  to: "/product/integrations",
  variant: "ghost",
};
const guidesAction: MarketingAction = {
  label: "Read the Guides",
  to: "/resources/guides",
  variant: "ghost",
};
const helpAction: MarketingAction = {
  label: "Visit Help Center",
  to: "/help",
  variant: "ghost",
};

const sharedOperationalProofSection: MarketingPageSection = {
  kind: "cards",
  eyebrow: "Operational proof",
  title: "Proof you can evaluate directly in the product workflow",
  intro:
    "SwyftUp focuses on product-proof and process-proof instead of unverified quotes. You can validate these outcomes in your own demo.",
  items: [
    {
      title: "Every handoff stays visible",
      description:
        "Conversation history, assignments, notes, and statuses remain connected so teams can move quickly without losing context.",
      icon: "workflow",
      to: "/product/features",
    },
    {
      title: "After-hours coverage stays accountable",
      description:
        "The AI receptionist captures intent, qualifies requests, and creates summaries for the next available owner.",
      icon: "sparkles",
      to: "/product/features",
    },
    {
      title: "Routing behavior is measurable",
      description:
        "Response time, ownership patterns, and conversation volume help teams improve staffing and response consistency over time.",
      icon: "analytics",
      to: "/product/features",
    },
  ],
  columns: 3,
};

const sharedFeatureCards: MarketingCardItem[] = [
  {
    title: "Messaging",
    description:
      "Website widget, shared inbox, conversation history, attachments, and context that stays with the customer record.",
    icon: "chat",
    to: "/product/features",
  },
  {
    title: "Voice",
    description:
      "Browser-based voice lets teams move from chat to a live call without leaving the workflow. Optional PSTN can follow later.",
    icon: "voice",
    to: "/product/features",
  },
  {
    title: "AI receptionist",
    description:
      "Capture after-hours demand, ask qualifying questions, summarize requests, and hand off the next step to a human teammate.",
    icon: "sparkles",
    to: "/product/features",
  },
  {
    title: "Routing",
    description:
      "First available, round robin, manual assignment, office hours, and fallback logic help every inquiry reach the right person.",
    icon: "routing",
    to: "/product/features",
  },
  {
    title: "Workflows",
    description:
      "Assignment, close and reopen states, notes, tags, and SLA visibility keep execution organized instead of improvised.",
    icon: "workflow",
    to: "/product/features",
  },
  {
    title: "Analytics",
    description:
      "Measure response time, volume, ownership patterns, and conversion signals that show where your communication system is improving.",
    icon: "analytics",
    to: "/product/features",
  },
];

const sharedProductLinks: MarketingLinkItem[] = [
  {
    label: "Explore platform features",
    to: "/product/features",
    description: "See the full messaging, voice, AI, routing, workflow, and analytics set.",
    icon: "chat",
  },
  {
    label: "Browse integrations",
    to: "/product/integrations",
    description: "See how SwyftUp fits into CRM, helpdesk, and internal systems.",
    icon: "integrations",
  },
  {
    label: "Review security controls",
    to: "/product/security",
    description: "Understand permissions, audit logs, encryption, and retention settings.",
    icon: "security",
  },
  {
    label: "Read developer docs",
    to: "/product/developers",
    description: "Use APIs, webhooks, and SDK starter kits to extend the platform.",
    icon: "code",
  },
  {
    label: "Compare plans",
    to: "/pricing",
    description: "Choose the right plan for your rollout, routing depth, and team size.",
    icon: "analytics",
  },
  {
    label: "Book a live walkthrough",
    to: "/contact",
    description: "See the platform mapped to your own workflow.",
    icon: "calendar",
  },
];

const sharedProductVisualSlides: MarketingVisualSlide[] = [
  {
    title: "Shared inbox timeline",
    description:
      "Agents can manage chat, voice events, notes, attachments, and ownership updates in a single timeline built for collaboration.",
    caption:
      "Inbox view with conversation history, assignment controls, and AI-assisted notes in one workspace.",
    items: [
      "Conversation history and attachments remain attached to each record.",
      "Ownership changes are visible to everyone who touches the workflow.",
      "AI summaries shorten handoff time when a thread moves between teammates.",
    ],
  },
  {
    title: "Routing and office-hours control",
    description:
      "Teams can combine first available, round robin, manual assignment, and fallback rules without losing operational visibility.",
    caption:
      "Routing board showing queue logic, office-hour coverage, and fallback owner settings.",
    items: [
      "Route by queue, specialty, office, or availability.",
      "Set coverage windows so after-hours demand is still captured.",
      "Use fallback owners to reduce dropped requests during busy periods.",
    ],
  },
  {
    title: "AI receptionist workflows",
    description:
      "The AI receptionist captures after-hours demand, asks qualifying questions, and writes clean summaries for the next human response.",
    caption:
      "AI intake flow with qualification prompts, summary output, and handoff status tracking.",
    items: [
      "Capture lead details and urgency when no agent is live.",
      "Generate concise summaries before the next touchpoint.",
      "Route summarized requests to the correct team queue automatically.",
    ],
  },
  {
    title: "Analytics for response quality",
    description:
      "Leaders can review response time, volume, ownership, and conversion-oriented signals to improve routing and staffing decisions.",
    caption:
      "Analytics dashboard with response benchmarks, queue trends, and conversion signal snapshots.",
    items: [
      "Track first response and follow-up trends by channel.",
      "Identify queue bottlenecks before they affect customer experience.",
      "Compare team or location performance using consistent workflow metrics.",
    ],
  },
  {
    title: "Website widget and live handoff",
    description:
      "Visitors start in a branded widget, then continue in chat or voice while your team keeps full context and next-step visibility.",
    caption:
      "Website widget experience moving from first message to routed ownership and live team response.",
    items: [
      "Launch branded chat and voice entry points on your website.",
      "Capture lead context before handing off to a teammate.",
      "Keep status, tags, and follow-up steps visible throughout the thread.",
    ],
  },
];

const sharedProductVisualSection: MarketingPageSection = {
  kind: "visualGallery",
  eyebrow: "See the product in action",
  title: "Workflow previews across inbox, routing, AI, and analytics",
  intro:
    "These product previews reflect the live workflow design. You can validate each flow during a guided demo tailored to your team.",
  slides: sharedProductVisualSlides,
  action: { label: "Book a Live Walkthrough", to: "/contact", variant: "secondary" },
};

const homePricingPreviewPlans: MarketingPricingPlan[] = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
    description: "For teams launching shared inbox and website messaging workflows.",
    bestFor: "Early-stage rollout",
    ctaLabel: "Get Started",
    included: [
      "2 seats",
      "Website widget and shared inbox",
      "Conversation history, notes, and tags",
      "Basic routing and analytics",
    ],
  },
  {
    name: "Growth",
    price: "$349",
    period: "/month",
    description: "For teams adding AI receptionist, voice, and stronger routing controls.",
    bestFor: "Operational scaling",
    ctaLabel: "Book a Demo",
    highlight: "Most popular",
    included: [
      "5 seats",
      "Everything in Starter",
      "Browser-based voice",
      "AI receptionist and office-hours routing",
    ],
  },
  {
    name: "Scale",
    price: "$899",
    period: "/month",
    description: "For multi-team operations needing deeper analytics, governance, and API access.",
    bestFor: "Advanced operations",
    ctaLabel: "Talk to Sales",
    included: [
      "15 seats",
      "Everything in Growth",
      "Advanced analytics and audit logs",
      "API and webhook access",
    ],
  },
];

function buildFaqSchema(items: MarketingFaq[]): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

const homeFaqs: MarketingFaq[] = [
  {
    question: "What kinds of businesses use SwyftUp?",
    answer:
      "SwyftUp is built for SMB and mid-market teams across industries, including real estate, ecommerce, professional services, healthcare, education, SaaS, and local or multi-location businesses.",
  },
  {
    question: "Can we start with chat and add voice later?",
    answer:
      "Yes. Many teams launch with the website widget and shared inbox first, then add browser-based calling, AI automation, and more advanced routing as they grow.",
  },
  {
    question: "How does the AI receptionist help after hours?",
    answer:
      "It can greet visitors, capture details, ask qualifying questions, summarize the conversation, and route the next step to the right human team.",
  },
  {
    question: "What routing options are available?",
    answer:
      "SwyftUp supports first available, round robin, manual assignment, office hours logic, and fallback agent rules so conversations reach the right person faster.",
  },
  {
    question: "What can we measure?",
    answer:
      "Teams can track response time, conversation volume, ownership patterns, and conversion signals that help show where opportunities are being won or lost.",
  },
];

const pricingFaqs: MarketingFaq[] = [
  {
    question: "Is pricing based on seats or usage?",
    answer:
      "Base plans are structured around included seats and feature access, with optional usage-based elements for expanded AI or voice needs.",
  },
  {
    question: "Can we start small and upgrade later?",
    answer:
      "Yes. Teams can begin with a focused workflow and move up as routing, reporting, and operational complexity increase.",
  },
  {
    question: "Is browser-based voice included?",
    answer:
      "Voice is included starting on Growth, with future PSTN options positioned as an add-on path when needed.",
  },
  {
    question: "Do you offer annual plans?",
    answer:
      "Annual and multi-workspace pricing can be discussed with sales for teams that want a longer-term rollout.",
  },
  {
    question: "What onboarding is included?",
    answer:
      "Growth and above include guided onboarding, while larger rollouts can add implementation support and technical planning.",
  },
  {
    question: "Are there hidden fees?",
    answer:
      "No. Optional usage and add-ons are scoped clearly so teams can understand the commercial model before they launch.",
  },
];

const homeStructuredData: StructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: `${siteConfig.url}/`,
    featureList: [
      "Website messaging widget",
      "Shared team inbox",
      "Browser-based voice calling",
      "AI receptionist workflows",
      "Routing and assignment controls",
      "Analytics and reporting",
    ],
  },
  buildFaqSchema(homeFaqs),
];

const productStructuredData: StructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: `${siteConfig.name} Product`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Unified customer communication platform with chat, voice, AI receptionist workflows, routing, analytics, and integration tooling.",
  url: `${siteConfig.url}/product`,
  featureList: [
    "Website messaging widget",
    "Shared team inbox",
    "In-app voice calling",
    "AI receptionist for intake and summaries",
    "Routing and assignment workflows",
    "Response and conversion analytics",
    "Webhooks and integration connectors",
  ],
};

const pricingStructuredData: StructuredData = buildFaqSchema(pricingFaqs);

function createSolutionPage({
  slug,
  metaTitle,
  metaDescription,
  keywords,
  eyebrow,
  title,
  subtitle,
  visualTitle,
  visualItems,
  workflowIntro,
  workflowSteps,
  pain,
  value,
  outcomes,
  useCases,
  faqs,
}: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  title: string;
  subtitle: string;
  visualTitle: string;
  visualItems: string[];
  workflowIntro: string;
  workflowSteps: MarketingStepItem[];
  pain: string[];
  value: string[];
  outcomes: string[];
  useCases: MarketingCardItem[];
  faqs: MarketingFaq[];
}): MarketingPage {
  return {
    slug,
    metaTitle,
    metaDescription,
    keywords,
    hero: {
      eyebrow,
      title,
      subtitle,
      actions: [demoAction, featuresAction, pricingAction],
      visual: {
        eyebrow: "Workflow preview",
        title: visualTitle,
        items: visualItems,
        footer: "Routed conversation view showing AI intake, assignment updates, team notes, and response status.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "The challenge",
        title: "Why teams lose momentum before the real work starts",
        paragraphs: pain,
      },
      {
        kind: "copy",
        eyebrow: "The SwyftUp approach",
        title: "A communication layer built around response, routing, and follow-up",
        paragraphs: value,
      },
      {
        kind: "list",
        eyebrow: "Outcomes",
        title: "What better communication operations improve",
        intro:
          "SwyftUp helps teams create a calmer, more reliable operating rhythm without forcing them into a one-size-fits-all process.",
        items: outcomes,
        columns: 2,
      },
      {
        kind: "steps",
        eyebrow: "How it works",
        title: "A workflow built for real operating conditions",
        intro: workflowIntro,
        items: workflowSteps,
      },
      {
        kind: "cards",
        eyebrow: "Example use cases",
        title: "Where teams put the platform to work",
        intro:
          "These are the kinds of customer moments where better capture, handoff, and ownership quickly become visible.",
        items: useCases,
        columns: 3,
      },
      {
        kind: "cards",
        eyebrow: "Feature highlights",
        title: "Capabilities that stay consistent across industries",
        intro:
          "No matter the vertical, the same core building blocks support better communication quality and stronger team execution.",
        items: sharedFeatureCards,
        columns: 3,
      },
      {
        kind: "copy",
        eyebrow: "Integrations",
        title: "Connect communication to the rest of your system",
        paragraphs: [
          "Use webhooks and planned connector patterns to keep contacts, ownership, statuses, and summaries moving into CRM, helpdesk, scheduling, or internal workflows.",
          "That means SwyftUp becomes the communication layer across your stack instead of another silo that teams have to maintain by hand.",
        ],
        action: integrationsAction,
      },
      {
        kind: "copy",
        eyebrow: "Security and trust",
        title: "Controls built for day-to-day operational trust",
        paragraphs: [
          "SwyftUp uses a security-first approach with encryption, permissions, audit visibility, and retention controls that help teams manage communication data responsibly.",
          "The goal is practical trust: clear controls your team can understand and use every day, not vague claims that hide the important details.",
        ],
        action: { label: "Review security", to: "/product/security", variant: "ghost" },
      },
      sharedOperationalProofSection,
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Questions buyers in this space usually ask",
        items: faqs,
      },
      {
        kind: "links",
        eyebrow: "Keep exploring",
        title: "Next pages worth visiting",
        intro: "These links help buyers move from use case fit to rollout planning.",
        items: [
          ...sharedProductLinks.slice(0, 4),
          {
            label: "Read case study examples",
            to: "/resources/case-studies",
            description: "See how different teams improve speed, ownership, and follow-up.",
            icon: "files",
          },
          {
            label: "Read rollout guides",
            to: "/resources/guides",
            description: "Use practical playbooks to plan implementation and routing design.",
            icon: "book",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "See the workflow mapped to your business",
        body:
          "If response time, ownership, and cleaner handoffs matter in your operation, SwyftUp is worth seeing in context. Book a live walkthrough and we’ll tailor the conversation to your workflow.",
        actions: [demoAction, salesAction],
      },
    ],
  };
}

const realEstateFaqs: MarketingFaq[] = [
  {
    question: "Can we route by office, market, or agent availability?",
    answer:
      "Yes. Routing rules can support geography, office hours, round robin distribution, manual ownership, and fallback coverage.",
  },
  {
    question: "Can the AI receptionist capture listing interest after hours?",
    answer:
      "Yes. It can collect interest details, summarize the inquiry, and prepare the handoff for the next available teammate.",
  },
  {
    question: "Does SwyftUp work for both sales and rental inquiries?",
    answer:
      "Yes. The workflow can support listing questions, rental inquiries, applications, and general office communications.",
  },
  {
    question: "Can teams see the full conversation history?",
    answer: "Yes. The shared timeline helps keep context available across handoffs.",
  },
  {
    question: "What can managers measure?",
    answer:
      "Teams can monitor response time, inquiry volume, assignment patterns, and conversion-oriented activity tied to follow-up.",
  },
];

const ecommerceFaqs: MarketingFaq[] = [
  {
    question: "Can SwyftUp support both pre-purchase and post-purchase questions?",
    answer:
      "Yes. Teams can route by intent, customer stage, or queue so each request lands with the right owner.",
  },
  {
    question: "Can the AI receptionist answer after hours?",
    answer:
      "Yes. It can capture details, qualify the issue, summarize the conversation, and tee up the next action for the team.",
  },
  {
    question: "Does this work during peak traffic periods?",
    answer:
      "Yes. Routing, fallback logic, and shared visibility help teams absorb higher volume more consistently.",
  },
  {
    question: "Can we move from chat to voice?",
    answer:
      "Yes. SwyftUp supports browser-based calling when a real-time conversation is the fastest path to resolution.",
  },
  {
    question: "What should ecommerce teams measure?",
    answer:
      "Response time, conversation volume, ownership patterns, and conversion- or resolution-related activity are strong starting points.",
  },
];

export const marketingPages: Record<string, MarketingPage> = {
  "/": {
    slug: "/",
    metaTitle: "SwyftUp | Chat, Voice, and AI for Any Business",
    metaDescription:
      "SwyftUp brings chat, voice, AI reception, routing, workflows, and analytics into one flexible platform for growing teams.",
    keywords: [
      "customer communication platform",
      "business messaging software",
      "AI receptionist platform",
      "website chat and voice",
      "shared customer inbox",
      "customer operations software",
    ],
    hero: {
      eyebrow: "A flexible customer communication platform for any business",
      title: "Customer communication platform for chat, voice, and AI automation",
      subtitle:
        "SwyftUp combines a shared inbox, website widget, in-app voice, AI receptionist, routing, workflows, and analytics so your team can respond faster with less operational drift.",
      actions: [demoAction, productAction, pricingAction],
      stats: [
        { value: "Chat + voice", label: "Customer channels" },
        { value: "AI + rules", label: "Coverage and routing" },
        { value: "Shared inbox", label: "Execution and handoff" },
        { value: "Analytics", label: "Operational visibility" },
      ],
      visual: {
        eyebrow: "Above-the-fold preview",
        title: "Unified inbox with AI summaries and live routing",
        items: [
          "Website chat and browser-based calls live in one timeline.",
          "AI receptionist captures details and hands off a summary.",
          "Assignments, notes, tags, and SLA status stay visible to the whole team.",
        ],
        footer:
          "Shared inbox view with live chat, browser-based calling, AI summaries, routing status, and next-step workflows in one timeline.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "The pain",
        title: "Most customer communication breaks down in the handoff",
        paragraphs: [
          "Businesses often rely on a patchwork of chat tools, phone systems, inboxes, and manual follow-up. That looks manageable until a lead arrives after hours, a customer gets routed to the wrong person, or a conversation changes hands without context.",
          "Customers repeat themselves, teams duplicate effort, and managers have no clear way to understand what is working. The issue is not only speed. It is that the operational layer behind communication is missing.",
        ],
      },
      {
        kind: "copy",
        eyebrow: "The solution",
        title: "SwyftUp combines customer-facing channels with the operational layer behind them",
        paragraphs: [
          "Instead of forcing teams to bounce between disconnected tools, SwyftUp keeps messages, calls, AI summaries, notes, ownership, and next steps in one place.",
          "That means your business can start with a focused use case like website chat or after-hours coverage, then expand into voice, routing, workflows, integrations, and reporting without rebuilding the process.",
        ],
      },
      {
        kind: "list",
        eyebrow: "Key benefits",
        title: "What teams get when the whole workflow is visible",
        intro:
          "SwyftUp is built to make customer communication feel more organized for the team and more responsive for the customer.",
        items: [
          "Faster first response with fewer missed inquiries",
          "Cleaner handoffs between teams, locations, or specialists",
          "One shared source of truth for messages, calls, notes, and status",
          "More reliable after-hours capture and follow-up",
          "Operational visibility into speed, volume, and conversion signals",
          "A flexible rollout path that works across industries",
        ],
        columns: 2,
      },
      {
        kind: "steps",
        eyebrow: "How it works",
        title: "From first contact to final follow-up in one flow",
        intro:
          "SwyftUp keeps the workflow simple for customers and much more visible for the internal team.",
        items: [
          {
            title: "Capture the conversation",
            description:
              "A visitor starts a website chat or a browser-based voice call from your site.",
            icon: "chat",
          },
          {
            title: "Qualify and summarize",
            description:
              "The AI receptionist can collect details, ask a few questions, and prepare a concise summary when no one is immediately available.",
            icon: "sparkles",
          },
          {
            title: "Route with intent",
            description:
              "Routing rules send the conversation to the first available teammate, a round-robin queue, a named owner, or a fallback path based on office hours and business logic.",
            icon: "routing",
          },
          {
            title: "Execute with context",
            description:
              "Agents work from a complete timeline that includes notes, attachments, tags, and visible service expectations.",
            icon: "workflow",
          },
          {
            title: "Learn and improve",
            description:
              "Managers use analytics to review response time, conversation volume, and conversion signals so the system improves over time.",
            icon: "analytics",
          },
        ],
      },
      {
        kind: "cards",
        eyebrow: "Feature highlights",
        title: "Everything your team needs to respond, route, and resolve",
        intro:
          "These platform capabilities are designed to work together instead of leaving the team to bridge the gaps manually.",
        items: sharedFeatureCards,
        columns: 3,
      },
      sharedProductVisualSection,
      {
        kind: "pricing",
        eyebrow: "Pricing preview",
        title: "Compare plans before you book time with sales",
        intro:
          "Use this quick snapshot to size your rollout, then visit the full pricing page for matrix-level detail and plan FAQs.",
        plans: homePricingPreviewPlans,
        footnote:
          "Need enterprise terms, custom rollout support, or multi-workspace pricing? Use Talk to Sales and we’ll scope it together.",
      },
      {
        kind: "copy",
        eyebrow: "Product walkthrough",
        title: "See SwyftUp in action with your own workflow and routing setup",
        paragraphs: [
          "Every demo is tailored to your channels, routing model, and team structure so you can evaluate real operational fit instead of a generic sandbox.",
          "You’ll see live chat, voice, AI receptionist handoff, and analytics in one guided flow aligned to how your business actually runs.",
        ],
        action: { label: "Book a Demo", to: "/contact", variant: "secondary" },
      },
      {
        kind: "copy",
        eyebrow: "Integrations",
        title: "Connect the communication layer to CRM, helpdesk, and internal workflows",
        paragraphs: [
          "SwyftUp supports connector-based workflows and webhook-driven automation so conversation data can move where the rest of your team already works.",
          "That helps keep contact records, ownership, statuses, and summaries aligned without forcing duplicate data entry or fragile manual syncs.",
        ],
        action: integrationsAction,
      },
      {
        kind: "copy",
        eyebrow: "Security and trust",
        title: "Security-first controls designed for everyday operational use",
        paragraphs: [
          "SwyftUp uses encryption, roles and permissions, audit visibility, and retention controls to help teams manage communication data responsibly.",
          "The platform is privacy-aware and aligned with best-practice control thinking, without leaning on claims your team cannot verify for itself.",
        ],
        action: { label: "Review security", to: "/product/security", variant: "ghost" },
      },
      sharedOperationalProofSection,
      {
        kind: "copy",
        eyebrow: "Real customer proof",
        title: "Verified case studies are published only after customer approval",
        paragraphs: [
          "SwyftUp does not publish anonymous or unverified testimonials. Case studies are added when customers approve public attribution and quote usage.",
          "Until then, evaluation should rely on product walkthroughs, implementation guides, workflow previews, and references shared during the sales process.",
        ],
        action: { label: "Browse Case Study Patterns", to: "/resources/case-studies", variant: "ghost" },
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Common questions before teams start a rollout",
        items: homeFaqs,
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Keep exploring SwyftUp",
        intro:
          "These pages help buyers move from high-level fit to specific rollout, solution, and implementation details.",
        items: [
          ...sharedProductLinks,
          {
            label: "Read implementation guides",
            to: "/resources/guides",
            description: "Use playbooks for launch planning, routing design, AI setup, and reporting.",
            icon: "book",
          },
          {
            label: "See case study examples",
            to: "/resources/case-studies",
            description: "See how teams across industries improve response and handoff quality.",
            icon: "files",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "See what a calmer communication workflow looks like",
        body:
          "If your team is tired of stitching together chat, calls, and follow-up by hand, SwyftUp gives you one clearer way to run the whole workflow. Book a demo and we’ll map it to your own operation.",
        actions: [demoAction, salesAction, guidesAction],
      },
    ],
    structuredData: homeStructuredData,
  },
  "/product": {
    slug: "/product",
    metaTitle: "Product | SwyftUp Communication Platform",
    metaDescription:
      "See how SwyftUp combines chat, voice, AI reception, routing, workflows, and analytics in one flexible platform.",
    keywords: [
      "business communication platform",
      "customer communication platform",
      "shared inbox software",
      "AI automation platform",
      "voice and chat platform",
      "routing software",
    ],
    hero: {
      eyebrow: "Product overview",
      title: "Customer communication built around your workflow",
      subtitle:
        "SwyftUp gives growing teams a shared inbox, website messaging, browser-based voice, AI receptionist workflows, flexible routing, and analytics in one platform.",
      actions: [demoAction, featuresAction, pricingAction],
      visual: {
        eyebrow: "Product view",
        title: "One platform instead of five disconnected tools",
        items: [
          "Messages, calls, notes, and ownership changes stay on the same record.",
          "Routing and workflows shape the work around your business instead of the other way around.",
          "Reporting shows what is improving and where handoffs still need attention.",
        ],
        footer:
          "Product overview with inbox activity, AI handoff cards, routing logic, and live team status indicators.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Why teams switch",
        title: "Point solutions create invisible work",
        paragraphs: [
          "Chat lives in one app, calls in another, notes in a CRM, and after-hours follow-up in someone’s head. As teams add channels, they often add more manual coordination instead of less.",
          "SwyftUp is built as one operational system for customer communication, so the work stays connected even when teams, channels, and use cases change.",
        ],
      },
      {
        kind: "cards",
        eyebrow: "Platform overview",
        title: "What the product brings together",
        intro:
          "Each part of the platform strengthens the rest, because everything shares one conversation record and one operating model.",
        items: sharedFeatureCards,
        columns: 3,
      },
      {
        kind: "list",
        eyebrow: "Benefits",
        title: "What teams improve when the workflow is connected",
        intro:
          "The platform helps teams move faster without sacrificing consistency, visibility, or accountability.",
        items: [
          "Sales teams capture and qualify more inbound demand",
          "Support teams organize ownership and response standards more clearly",
          "Multi-location businesses route by hours, team, or availability with less confusion",
          "Leaders get a clearer view of where speed, quality, and conversion are improving",
          "Technical teams can extend the platform instead of working around it",
        ],
        columns: 2,
      },
      {
        kind: "steps",
        eyebrow: "How the product works",
        title: "A single path from inquiry to insight",
        intro:
          "SwyftUp works because capture, execution, and reporting are designed as one system.",
        items: [
          {
            title: "Capture chat and voice activity",
            description:
              "Website messaging and browser-based voice become the front door for team-managed communication.",
            icon: "voice",
          },
          {
            title: "Add AI support where it helps",
            description:
              "The AI receptionist helps with intake, qualification, summaries, and after-hours coverage without breaking the human handoff.",
            icon: "sparkles",
          },
          {
            title: "Route by real operating rules",
            description:
              "Office hours, first available, round robin, manual review, and fallback logic help keep ownership clear.",
            icon: "routing",
          },
          {
            title: "Keep work visible in the inbox",
            description:
              "Agents manage live threads with notes, tags, attachments, and clear conversation status.",
            icon: "workflow",
          },
          {
            title: "Measure the system",
            description:
              "Reporting helps leaders understand performance patterns and improve staffing, routing, and follow-up.",
            icon: "analytics",
          },
        ],
      },
      sharedProductVisualSection,
      {
        kind: "copy",
        eyebrow: "Integrations",
        title: "Designed to fit the stack you already use",
        paragraphs: [
          "SwyftUp is meant to work alongside CRM, helpdesk, scheduling, and internal tools so communication data stays useful outside the inbox.",
          "Connectors and webhooks make it possible to sync records, trigger workflows, and keep downstream systems current.",
        ],
        action: integrationsAction,
      },
      {
        kind: "copy",
        eyebrow: "Security",
        title: "Clear controls for access, visibility, and data lifecycle",
        paragraphs: [
          "Practical trust matters more than vague promises. That’s why SwyftUp emphasizes encryption, permissions, audit logs, and retention controls that teams can understand.",
          "These controls help businesses manage communication data carefully while maintaining day-to-day usability for operators, managers, and admins.",
        ],
        action: { label: "Review security", to: "/product/security", variant: "ghost" },
      },
      sharedOperationalProofSection,
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Product questions we hear most often",
        items: [
          {
            question: "Does SwyftUp replace our existing live chat tool?",
            answer:
              "It can, but teams can also phase it in by starting with a specific workflow and expanding over time.",
          },
          {
            question: "Can sales and support use the same platform?",
            answer:
              "Yes. Multiple teams can share one communication layer while keeping routing, ownership, and workflows organized.",
          },
          {
            question: "Can we use only certain parts of the platform?",
            answer:
              "Yes. Teams can start with chat, voice, or AI reception and add other layers as their process matures.",
          },
          {
            question: "What if we already have a CRM or helpdesk?",
            answer:
              "SwyftUp is built to work alongside those systems through connectors and webhooks so context can move where it needs to go.",
          },
          {
            question: "Is the platform flexible enough for multi-team workflows?",
            answer:
              "Yes. Routing rules, office hours, fallback logic, notes, tags, and assignment controls help the platform fit different operating models.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Next pages",
        title: "Where to go deeper",
        items: sharedProductLinks,
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "See the product mapped to your workflow",
        body:
          "SwyftUp is for teams that want customer communication to feel deliberate instead of improvised. Book a demo and we’ll show how the product fits your own channels, routing logic, and operating model.",
        actions: [demoAction, salesAction],
      },
    ],
    structuredData: productStructuredData,
  },
  "/product/features": {
    slug: "/product/features",
    metaTitle: "Features | SwyftUp Customer Communication",
    metaDescription:
      "Explore messaging, voice, AI reception, routing, workflows, analytics, and SwyftUp features for growing teams.",
    keywords: [
      "customer communication platform features",
      "messaging platform features",
      "AI receptionist features",
      "routing workflow tools",
      "conversation analytics",
      "shared inbox features",
    ],
    hero: {
      eyebrow: "Feature library",
      title: "Everything your team needs to respond, route, and resolve",
      subtitle:
        "SwyftUp connects the customer-facing layer and the operational layer so your team can move from first contact to final handoff without losing context.",
      actions: [demoAction, integrationsAction, pricingAction],
      visual: {
        eyebrow: "Feature view",
        title: "Capabilities designed to work together",
        items: [
          "Messaging, voice, AI, and routing share the same conversation record.",
          "Workflows and analytics are built in, not bolted on afterward.",
          "Teams can start narrow and still grow into a fuller operating model.",
        ],
        footer:
          "Feature workspace highlighting chat widget controls, live voice actions, AI summaries, routing rules, and analytics widgets.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Why this matters",
        title: "Feature lists only help when the pieces connect",
        paragraphs: [
          "A tool can help you answer chats, but not hand them off well. Another can track calls, but not support routing rules. Teams then patch the missing pieces with manual processes, which is exactly where quality drops.",
          "SwyftUp is designed so messaging, voice, AI, routing, workflows, and analytics strengthen one another instead of creating new gaps.",
        ],
      },
      {
        kind: "cards",
        eyebrow: "Core capabilities",
        title: "Feature highlights across the full workflow",
        intro:
          "Each capability is useful on its own, but it becomes much more valuable when it shares context with the rest of the platform.",
        items: [
          ...sharedFeatureCards,
          {
            title: "Attachments and history",
            description:
              "Keep files, prior conversations, and reference context visible so customers do not have to repeat themselves.",
            icon: "files",
          },
          {
            title: "Roles and permissions",
            description:
              "Limit access by responsibility so the right people can work quickly without overexposing data.",
            icon: "security",
          },
          {
            title: "Audit visibility",
            description:
              "Track operational changes to assignments, settings, and key workflow actions over time.",
            icon: "check",
          },
        ],
        columns: 3,
      },
      sharedProductVisualSection,
      {
        kind: "steps",
        eyebrow: "Workflow design",
        title: "How the feature set supports the full customer journey",
        items: [
          {
            title: "Capture and qualify",
            description: "Chat, voice, and AI support first response and intake without fragmenting the record.",
            icon: "chat",
          },
          {
            title: "Route intelligently",
            description: "Assignment logic makes speed and fairness easier to manage across teams.",
            icon: "routing",
          },
          {
            title: "Work from one timeline",
            description: "Notes, tags, history, and attachments help people collaborate without losing context.",
            icon: "workflow",
          },
          {
            title: "Learn from patterns",
            description: "Analytics reveal how response behavior and conversation outcomes are changing over time.",
            icon: "analytics",
          },
        ],
      },
      {
        kind: "copy",
        eyebrow: "Integrations",
        title: "Features become more useful when they travel well",
        paragraphs: [
          "SwyftUp’s feature set is designed to connect with CRM, helpdesk, and internal systems through connectors and webhooks.",
          "That helps the communication layer share ownership, status, and context with the rest of the business.",
        ],
        action: integrationsAction,
      },
      {
        kind: "copy",
        eyebrow: "Security",
        title: "Controls that support responsible daily use",
        paragraphs: [
          "Permissions, audit visibility, retention settings, and encryption help the feature set stay safe and understandable as more teams adopt it.",
        ],
        action: { label: "Review security", to: "/product/security", variant: "ghost" },
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Feature-level questions",
        items: [
          {
            question: "Can agents share files and context in conversations?",
            answer:
              "Yes. Conversations support attachments, notes, tags, and a full history so context stays with the record.",
          },
          {
            question: "Can closed conversations be reopened?",
            answer:
              "Yes. Teams can close and reopen conversations when a customer returns or an issue needs more work.",
          },
          {
            question: "Can we track service levels?",
            answer:
              "Yes. SLA visibility helps teams see where response and follow-up targets are being met or missed.",
          },
          {
            question: "Does AI replace the team?",
            answer:
              "No. The AI receptionist is designed to handle intake, qualification, and summaries so human teams can respond with more context.",
          },
          {
            question: "What metrics are included?",
            answer:
              "Teams can monitor response time, volume trends, ownership patterns, and conversion-related activity.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Explore adjacent product pages",
        items: sharedProductLinks,
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "See these features in a real workflow",
        body:
          "If you want a single platform that helps your team respond faster without losing control of the workflow, we can show you exactly how the pieces fit together in a live session.",
        actions: [demoAction, productAction],
      },
    ],
  },
  "/product/integrations": {
    slug: "/product/integrations",
    metaTitle: "Integrations | SwyftUp",
    metaDescription:
      "Connect SwyftUp to CRM, helpdesk, and internal systems with webhooks, APIs, and connector-based workflows.",
    keywords: [
      "customer communication integrations",
      "CRM chat integration",
      "helpdesk messaging integration",
      "webhook automation",
      "conversation sync",
      "customer communication API",
    ],
    hero: {
      eyebrow: "Integrations",
      title: "Bring SwyftUp into the tools your team already uses",
      subtitle:
        "SwyftUp supports connector-based workflows and API-first extensions so conversations, ownership, and customer context stay connected across systems.",
      actions: [salesAction, { label: "Read Developer Docs", to: "/product/developers", variant: "secondary" }, demoAction],
      visual: {
        eyebrow: "Integration view",
        title: "Communication data moving across your stack",
        items: [
          "Sync contacts, ownership, and status changes into the systems your team already depends on.",
          "Use webhooks to react to live events like messages, calls, assignment changes, and conversation closure.",
          "Keep downstream workflows aligned without duplicate data entry.",
        ],
        footer:
          "Integration view showing CRM sync, webhook events, and ownership updates flowing from the SwyftUp inbox.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Why integrations matter",
        title: "A communication platform only helps if the right context travels with the work",
        paragraphs: [
          "If conversations live in one place and the rest of your customer system lives somewhere else, teams end up copying information by hand or working from incomplete records.",
          "SwyftUp is designed to make communication portable so chat, calls, summaries, and ownership changes can flow into the rest of your operating stack.",
        ],
      },
      {
        kind: "cards",
        eyebrow: "Connector examples",
        title: "Integration patterns teams usually care about first",
        intro:
          "These cards show common connector launch patterns and are not an exhaustive list of every integration path.",
        items: [
          {
            title: "CRM sync",
            description: "Keep contacts, owners, summaries, and lifecycle changes aligned with tools like HubSpot, Salesforce, Pipedrive, or Zoho.",
            icon: "integrations",
            meta: "Placeholder connector set",
          },
          {
            title: "Helpdesk workflows",
            description: "Send conversation context into support tools such as Zendesk or Freshdesk when teams need a longer service trail.",
            icon: "help",
            meta: "Placeholder connector set",
          },
          {
            title: "Team collaboration",
            description: "Trigger alerts, escalations, or review loops into tools like Slack or Microsoft Teams.",
            icon: "team",
            meta: "Common workflow pattern",
          },
          {
            title: "Scheduling and internal systems",
            description: "Use events and custom logic to enrich requests with timing, ownership, booking, or internal process data.",
            icon: "calendar",
            meta: "Webhook-driven workflow",
          },
          {
            title: "Analytics pipelines",
            description: "Send key events into internal reporting or warehouse flows when you need deeper operational analysis.",
            icon: "analytics",
            meta: "Event-driven workflow",
          },
          {
            title: "Custom extensions",
            description: "Build custom tools around SwyftUp using APIs, webhooks, and SDK starter kits as your platform matures.",
            icon: "code",
            to: "/product/developers",
            meta: "Developer path",
          },
        ],
        columns: 3,
      },
      {
        kind: "steps",
        eyebrow: "How it works",
        title: "A simple path to cleaner sync and automation",
        items: [
          {
            title: "Choose the systems that matter",
            description: "Start with the CRM, helpdesk, internal app, or reporting system that needs live communication context most.",
            icon: "link",
          },
          {
            title: "Define the events you care about",
            description: "New conversations, messages, calls, assignment changes, or closures can each trigger a different downstream action.",
            icon: "message",
          },
          {
            title: "Map the data fields",
            description: "Contacts, owners, tags, statuses, summaries, and timestamps become the shared language between systems.",
            icon: "workflow",
          },
          {
            title: "Test and expand",
            description: "Launch with one reliable integration path, then add more events and deeper logic once the first workflow is stable.",
            icon: "check",
          },
        ],
      },
      {
        kind: "copy",
        eyebrow: "Webhooks",
        title: "Event-based automation where your business needs it",
        paragraphs: [
          "SwyftUp’s webhook model is designed for teams that want real-time automation tied to conversation and assignment events.",
          "Example event types include conversation creation, message receipt, call start and end, assignment changes, tag updates, and conversation closure.",
        ],
        action: { label: "Read developer docs", to: "/product/developers", variant: "ghost" },
      },
      {
        kind: "copy",
        eyebrow: "Security",
        title: "Integration access should still be controlled and visible",
        paragraphs: [
          "Permission-aware access, secret-based verification, and audit visibility help teams understand how data moves between SwyftUp and other systems.",
        ],
        action: { label: "Review security", to: "/product/security", variant: "ghost" },
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Integration questions technical buyers usually ask",
        items: [
          {
            question: "Which systems can SwyftUp connect to?",
            answer:
              "SwyftUp is suited for CRM, helpdesk, internal workflow, and analytics connections through planned connectors and webhooks.",
          },
          {
            question: "Do you support webhooks?",
            answer:
              "Yes. Webhooks are a core part of the platform’s extensibility for teams that want event-based automation.",
          },
          {
            question: "Can we sync contacts and ownership data?",
            answer:
              "Yes. Common integration patterns include syncing contacts, team ownership, statuses, tags, and summaries.",
          },
          {
            question: "Do we need a developer to get started?",
            answer:
              "Not always. Many teams start with standard connector patterns and bring in technical help only for custom logic.",
          },
          {
            question: "Can we build custom integrations?",
            answer:
              "Yes. The developer surface is intended to support custom event flows, internal apps, and deeper automation.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Related product pages",
        items: sharedProductLinks,
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Plan the integration path that fits your stack",
        body:
          "SwyftUp can plug into the systems you already rely on while still giving your team one clear communication layer. Talk to sales or review the developer docs to plan the right path.",
        actions: [salesAction, { label: "Read Developer Docs", to: "/product/developers", variant: "secondary" }],
      },
    ],
  },
  "/product/security": {
    slug: "/product/security",
    metaTitle: "Security | SwyftUp",
    metaDescription:
      "Review SwyftUp security controls including encryption, permissions, audit logs, and retention settings.",
    keywords: [
      "customer communication platform security",
      "messaging security controls",
      "role-based permissions",
      "audit logs",
      "retention controls",
      "encrypted communication platform",
    ],
    hero: {
      eyebrow: "Security",
      title: "Practical security controls for everyday operational trust",
      subtitle:
        "SwyftUp is built to help teams manage customer communication responsibly through encryption, permissions, audit visibility, and retention controls aligned with best practices.",
      actions: [salesAction, { label: "Read the DPA", to: "/dpa", variant: "secondary" }, demoAction],
      visual: {
        eyebrow: "Security overview",
        title: "Controls teams can understand and use",
        items: [
          "Encryption protects data in transit and at rest.",
          "Roles and permissions help align access with responsibility.",
          "Audit visibility and retention settings support clearer governance.",
        ],
        footer:
          "Security overview with permissions, audit history, encryption status, and retention settings.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Approach",
        title: "Security should help the team work responsibly, not just check a box",
        paragraphs: [
          "Communication data often includes customer details, internal notes, and the full context of active work. That makes practical controls essential.",
          "SwyftUp focuses on clear safeguards that teams can understand, review, and use in day-to-day operations instead of leaning on vague trust language.",
        ],
      },
      {
        kind: "cards",
        eyebrow: "Control areas",
        title: "How the platform supports operational trust",
        items: [
          {
            title: "Encryption",
            description: "Protect communication data in transit and at rest as a foundational security layer.",
            icon: "security",
          },
          {
            title: "Roles and permissions",
            description: "Decide who can view conversations, manage settings, adjust routing, or access reporting.",
            icon: "team",
          },
          {
            title: "Audit logs",
            description: "See who changed settings, assignments, and workflow states over time.",
            icon: "check",
          },
          {
            title: "Retention controls",
            description: "Support lifecycle decisions around how long communication records remain available.",
            icon: "clock",
          },
        ],
        columns: 2,
      },
      {
        kind: "copy",
        eyebrow: "Review process",
        title: "Security questions should be part of the evaluation",
        paragraphs: [
          "If your team needs a deeper review, security and data-handling questions should be addressed during procurement and onboarding.",
          "The goal is to give buyers concrete information about access, visibility, and lifecycle controls, rather than asking them to infer how trust is handled.",
        ],
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Common trust questions",
        items: [
          {
            question: "How is customer communication protected?",
            answer:
              "SwyftUp uses encryption and access controls to help protect communication data throughout its lifecycle.",
          },
          {
            question: "Can access be limited by role?",
            answer:
              "Yes. Teams can use roles and permissions to align access with job responsibility.",
          },
          {
            question: "Are important changes visible?",
            answer:
              "Yes. Audit logs help teams understand changes to settings, assignments, and other operational actions.",
          },
          {
            question: "Can we control how long data is kept?",
            answer:
              "SwyftUp supports retention-aware controls so teams can manage record lifecycle more deliberately.",
          },
          {
            question: "Can security questions be reviewed during evaluation?",
            answer:
              "Yes. Security and data-handling questions should be part of the sales and onboarding process for teams that need a deeper review.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Related pages",
        title: "Continue your review",
        items: [
          {
            label: "See the full product overview",
            to: "/product",
            description: "Put the control model in the context of the broader platform.",
            icon: "chat",
          },
          {
            label: "Browse platform features",
            to: "/product/features",
            description: "See how permissions, workflows, and audit visibility fit the day-to-day experience.",
            icon: "workflow",
          },
          {
            label: "Read the DPA",
            to: "/dpa",
            description: "Review the legal documentation path for vendor and privacy review.",
            icon: "files",
          },
          {
            label: "Review the Privacy Policy",
            to: "/privacy",
            description: "See how information is collected, used, retained, and handled.",
            icon: "security",
          },
          {
            label: "Contact the team",
            to: "/contact",
            description: "Bring trust, security, and procurement questions into the evaluation process.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Bring your security questions into the evaluation early",
        body:
          "Trust grows when controls are understandable and operationally useful. If your team wants to review how SwyftUp handles access, visibility, and data lifecycle, we’re ready for that conversation.",
        actions: [salesAction, { label: "Read the DPA", to: "/dpa", variant: "secondary" }],
      },
    ],
  },
  "/product/developers": {
    slug: "/product/developers",
    metaTitle: "Developers | SwyftUp API and Webhooks",
    metaDescription:
      "Build on SwyftUp with APIs, webhooks, and SDK starter kits for conversations, routing, and customer workflows.",
    keywords: [
      "customer communication API",
      "messaging API",
      "conversation webhooks",
      "developer docs",
      "webhook events",
      "SDKs for customer communication",
    ],
    hero: {
      eyebrow: "Developers",
      title: "Build on SwyftUp with APIs, webhooks, and flexible events",
      subtitle:
        "SwyftUp gives developers the building blocks to create custom workflows, sync data, and trigger downstream actions from conversation events.",
      actions: [
        { label: "Read the Docs", to: "/help", variant: "primary" },
        salesAction,
        integrationsAction,
      ],
      visual: {
        eyebrow: "Developer hub",
        title: "Quickstart, APIs, webhooks, and SDK starter kits",
        items: [
          "Start with credentials and authentication.",
          "Work with contacts, conversations, assignments, and calls.",
          "Subscribe to webhook events and extend the platform where your business needs it.",
        ],
        footer:
          "Developer hub with quickstart steps, API concepts, webhook events, and SDK starter kits.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Why developers care",
        title: "Communication becomes more valuable when it can trigger action elsewhere",
        paragraphs: [
          "Without APIs and event hooks, teams are forced to rebuild context manually or settle for incomplete automation.",
          "SwyftUp exposes the core pieces of the workflow so technical teams can sync data, react to changes, and build the business-specific paths they actually need.",
        ],
      },
      {
        kind: "steps",
        eyebrow: "Getting started",
        title: "A practical first path into the platform",
        items: [
          {
            title: "Create a workspace and credentials",
            description: "Generate environment-specific access so the integration can authenticate cleanly.",
            icon: "code",
          },
          {
            title: "Authenticate and verify access",
            description: "Confirm that your app can read and write the objects it needs before you build deeper logic.",
            icon: "security",
          },
          {
            title: "Sync contacts or create conversations",
            description: "Start with a simple contact or conversation flow so the data model is easy to validate.",
            icon: "chat",
          },
          {
            title: "Subscribe to webhook events",
            description: "Use events like new conversations, messages, calls, assignments, and closures to trigger automation.",
            icon: "integrations",
          },
          {
            title: "Test before going live",
            description: "Use safe environments and staged rollout patterns before enabling the full production workflow.",
            icon: "check",
          },
        ],
      },
      {
        kind: "cards",
        eyebrow: "API concepts",
        title: "The core building blocks",
        items: [
          {
            title: "Contacts",
            description: "People communicating with your business and the identity layer that travels with their conversation history.",
            icon: "team",
          },
          {
            title: "Conversations",
            description: "Parent records that contain messages, calls, notes, tags, ownership, and status.",
            icon: "message",
          },
          {
            title: "Assignments",
            description: "Ownership changes and routing decisions that determine who is responsible for the next step.",
            icon: "routing",
          },
          {
            title: "Calls",
            description: "Browser-based voice interactions connected directly to the conversation timeline.",
            icon: "voice",
          },
          {
            title: "Events",
            description: "Lifecycle changes that can trigger sync, enrichment, or automation in the rest of your stack.",
            icon: "sparkles",
          },
          {
            title: "SDKs",
            description: "Placeholder support for JavaScript, Node, Python, and PHP quickstarts with auth and webhook helpers.",
            icon: "code",
            meta: "SDK starter kit",
          },
        ],
        columns: 3,
      },
      {
        kind: "copy",
        eyebrow: "Webhooks overview",
        title: "Use live events to drive the rest of your workflow",
        paragraphs: [
          "Webhooks let teams react when something meaningful happens instead of polling the platform for changes.",
          "Example event types include conversation creation, message receipt, call start and end, assignment changes, tags, and conversation closure.",
        ],
      },
      {
        kind: "copy",
        eyebrow: "Security",
        title: "Developer access should still be deliberate and controlled",
        paragraphs: [
          "Authentication, permission boundaries, secret rotation, and webhook verification should be part of the implementation from the start.",
        ],
        action: { label: "Review security", to: "/product/security", variant: "ghost" },
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Developer questions we hear often",
        items: [
          {
            question: "What can we build with the API?",
            answer:
              "Teams can sync contacts, create workflows, react to events, enrich conversations, and connect SwyftUp to internal systems.",
          },
          {
            question: "Which webhook events are available?",
            answer:
              "Webhook coverage should include conversation, message, call, assignment, tag, and status changes.",
          },
          {
            question: "Will there be SDKs?",
            answer:
              "Yes. The developer hub launches with SDK starter kits and expands with language-specific helpers over time.",
          },
          {
            question: "Can we test before going live?",
            answer:
              "Yes. The developer experience should support safe testing environments and staged rollout patterns.",
          },
          {
            question: "Where should technical buyers start?",
            answer:
              "Start with the quickstart, event model, authentication docs, and a simple webhook flow tied to an existing internal system.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Continue from docs into the broader product",
        items: [
          {
            label: "Browse integrations",
            to: "/product/integrations",
            description: "See how technical building blocks map to buyer-facing integration patterns.",
            icon: "integrations",
          },
          {
            label: "Review security controls",
            to: "/product/security",
            description: "Understand the trust and access model around APIs and events.",
            icon: "security",
          },
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "Find setup help, troubleshooting, and product documentation.",
            icon: "help",
          },
          {
            label: "See pricing",
            to: "/pricing",
            description: "Review plan fit before scoping deeper technical rollout.",
            icon: "analytics",
          },
          {
            label: "Book a technical walkthrough",
            to: "/contact",
            description: "Bring product, security, and integration questions into one discussion.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Build the communication layer your stack actually needs",
        body:
          "If your team wants SwyftUp to fit neatly into existing workflows, the developer surface is where that flexibility becomes real. Start with the docs hub or book a technical walkthrough.",
        actions: [
          { label: "Read the Docs", to: "/help", variant: "primary" },
          salesAction,
        ],
      },
    ],
  },
  "/solutions/real-estate": createSolutionPage({
    slug: "/solutions/real-estate",
    metaTitle: "Real Estate Communication Software | SwyftUp",
    metaDescription:
      "Capture listing inquiries, route conversations fast, and keep every handoff clear with SwyftUp for real estate teams.",
    keywords: [
      "real estate communication software",
      "real estate chat widget",
      "listing inquiry routing",
      "after-hours lead capture",
      "brokerage inbox",
      "showing request messaging",
    ],
    eyebrow: "Solutions for real estate",
    title: "Real estate customer communication software for faster inquiry response",
    subtitle:
      "Capture listing and rental inquiries, qualify interest after hours, route by office or agent availability, and keep every follow-up visible in one place.",
    visualTitle: "Listing inquiry capture, AI qualification, and office routing",
    visualItems: [
      "Route by office, market, or agent availability.",
      "Capture listing and rental interest after hours.",
      "Keep follow-up visible from first question to scheduled next step.",
    ],
    workflowIntro:
      "Real estate teams need speed, fair distribution, and context that survives handoff between agents, offices, and business hours.",
    workflowSteps: [
      {
        title: "A prospect asks about a listing or rental",
        description: "The conversation starts in chat or voice from the website or landing page.",
        icon: "building",
      },
      {
        title: "AI collects key details if the team is busy",
        description: "Interest, timing, location, and intent are gathered before the handoff happens.",
        icon: "sparkles",
      },
      {
        title: "Routing sends the inquiry to the right owner",
        description: "Use office, geography, availability, round robin, or manual review to direct the work.",
        icon: "routing",
      },
      {
        title: "The assigned teammate continues with context",
        description: "The full history, notes, and next-step details stay attached to the conversation.",
        icon: "workflow",
      },
    ],
    pain: [
      "Real estate inquiries arrive across multiple listings, locations, and agent schedules. When response depends on whoever sees the message first, teams miss opportunities and duplicate follow-up.",
      "The problem is not just lead volume. It is the lack of a clear operating system behind capture, routing, and ownership.",
    ],
    value: [
      "SwyftUp gives brokerages, teams, and property operators one communication layer for lead capture and follow-up. Website chat, browser-based calling, AI qualification, and routing rules work together so inquiries reach the right person faster.",
      "Managers get better visibility into volume, assignment, and signals that indicate which conversations are moving toward showings, applications, or next steps.",
    ],
    outcomes: [
      "Reduce missed listing and rental inquiries",
      "Improve first response time across offices or teams",
      "Standardize follow-up without flattening agent ownership",
      "Create clearer coverage during evenings and weekends",
      "Measure response, assignment, and conversion-oriented activity",
    ],
    useCases: [
      {
        title: "Listing inquiry triage",
        description: "Capture interest, qualifying details, and viewing timing before routing the lead to the right team.",
        icon: "building",
      },
      {
        title: "Rental and leasing response",
        description: "Handle property questions, availability, and application-related follow-up with one shared timeline.",
        icon: "local",
      },
      {
        title: "Office-wide coverage",
        description: "Balance availability and ownership across teams without losing context during handoff.",
        icon: "team",
      },
    ],
    faqs: realEstateFaqs,
  }),
  "/solutions/ecommerce": {
    ...createSolutionPage({
      slug: "/solutions/ecommerce",
      metaTitle: "Ecommerce Customer Messaging | SwyftUp",
      metaDescription:
        "Help shoppers faster with chat, voice, AI reception, routing, and analytics built for ecommerce teams.",
      keywords: [
        "ecommerce customer messaging",
        "ecommerce live chat",
        "order inquiry routing",
        "online store chat software",
        "conversion chat platform",
        "post-purchase support chat",
      ],
      eyebrow: "Solutions for ecommerce",
      title: "Ecommerce customer communication platform for pre- and post-purchase support",
      subtitle:
        "Handle product questions, order issues, returns, and high-volume campaigns with one shared communication layer across chat, voice, AI automation, and routing.",
      visualTitle: "Shopper chat, order intent, queue routing, and AI summaries",
      visualItems: [
        "Separate pre-purchase and post-purchase traffic intelligently.",
        "Handle peak campaign volume without dropping the handoff.",
        "Move from chat to a live browser call when needed.",
      ],
      workflowIntro:
        "Ecommerce teams need a workflow that supports both conversion and service quality, especially when traffic spikes or campaigns create new demand.",
      workflowSteps: [
        {
          title: "A shopper asks about a product or order",
          description: "The request enters through chat or voice from the storefront.",
          icon: "cart",
        },
        {
          title: "AI qualifies the request",
          description: "Order-related, pre-purchase, return, or support context is collected before the team responds.",
          icon: "sparkles",
        },
        {
          title: "Routing sends it to the right queue",
          description: "Intent, customer stage, or team logic determines where the conversation goes next.",
          icon: "routing",
        },
        {
          title: "The team resolves the issue with shared context",
          description: "Notes, tags, ownership, and conversation history stay visible until the request is complete.",
          icon: "workflow",
        },
      ],
      pain: [
        "Ecommerce communication rarely stays with one team or one moment in the customer journey. Pre-purchase questions affect conversion, post-purchase questions affect trust, and peak periods expose every weak handoff.",
        "When chat, support, and escalation paths are disconnected, speed drops and consistency becomes harder to maintain.",
      ],
      value: [
        "SwyftUp centralizes storefront communication and routes it based on intent, status, team, or business hours. The AI receptionist handles common first-response work, and browser-based voice helps teams resolve higher-friction issues faster.",
        "The shared inbox keeps the customer record connected from first question to final resolution so shoppers do not lose continuity when the issue changes hands.",
      ],
      outcomes: [
        "Improve responsiveness during launches and promotions",
        "Reduce dropped conversations across sales and support flows",
        "Create cleaner handoffs between pre-purchase and post-purchase teams",
        "Track communication patterns that influence conversion or retention",
        "Keep peak-period operations more stable without more tool sprawl",
      ],
      useCases: [
        {
          title: "Pre-purchase questions",
          description: "Help shoppers compare products, confirm fit, and get answers before they leave the page.",
          icon: "cart",
        },
        {
          title: "Order and return support",
          description: "Manage delivery questions, return issues, and escalations with clearer ownership.",
          icon: "workflow",
        },
        {
          title: "Campaign surge coverage",
          description: "Use routing and AI-assisted intake to absorb high-volume moments more consistently.",
          icon: "analytics",
        },
      ],
      faqs: ecommerceFaqs,
    }),
    structuredData: buildFaqSchema(ecommerceFaqs),
  },
  "/solutions/professional-services": createSolutionPage({
    slug: "/solutions/professional-services",
    metaTitle: "Professional Services Messaging | SwyftUp",
    metaDescription:
      "Qualify new inquiries, route by expertise, and keep client communication organized with SwyftUp for service firms.",
    keywords: [
      "professional services communication platform",
      "client intake software",
      "service inquiry routing",
      "proposal follow-up workflow",
      "professional services chat",
      "shared client inbox",
    ],
    eyebrow: "Solutions for professional services",
    title: "Professional services communication platform for client intake and follow-up",
    subtitle:
      "Capture inquiries, qualify fit, route by practice or service line, and keep every conversation organized from first contact to active client work.",
    visualTitle: "Client intake, practice-area routing, and shared follow-up",
    visualItems: [
      "Qualify inquiries by service line, region, or expertise.",
      "Keep proposal-stage and active-client communication visible.",
      "Reduce lost context between intake, specialists, and account owners.",
    ],
    workflowIntro:
      "Firms need intake, ownership, and follow-up to look coordinated from the first response, especially when multiple specialists may touch the same client.",
    workflowSteps: [
      {
        title: "A prospect reaches out through the website or by call",
        description: "The conversation begins with a service question, project request, or intake need.",
        icon: "briefcase",
      },
      {
        title: "The system captures fit and timing details",
        description: "AI-assisted intake helps gather enough context to decide where the inquiry belongs.",
        icon: "sparkles",
      },
      {
        title: "The request is routed by service line or owner",
        description: "Practice, office, geography, or manual review rules keep ownership more deliberate.",
        icon: "routing",
      },
      {
        title: "The team continues from a shared record",
        description: "Notes, attachments, and status changes stay connected through proposal, onboarding, and active work.",
        icon: "workflow",
      },
    ],
    pain: [
      "Professional services teams often lose momentum in the gap between inquiry and ownership. Requests bounce between general inboxes, context gets rebuilt repeatedly, and follow-up slows down.",
      "That weakens qualification, makes the firm look less coordinated, and hides where the intake process actually breaks.",
    ],
    value: [
      "SwyftUp gives firms one platform to manage intake, communication, routing, and internal notes. Whether the work is advisory, consulting, agency, legal, accounting, or another service model, the platform helps the team respond with more clarity and less operational drag.",
      "The result is faster qualification, better follow-up discipline, and a cleaner record of the work from first contact onward.",
    ],
    outcomes: [
      "Qualify inquiries faster and with less manual triage",
      "Route by expertise, geography, or ownership more clearly",
      "Keep proposal and onboarding communication visible",
      "Reduce context loss during collaboration between specialists",
      "Measure responsiveness and intake patterns with less guesswork",
    ],
    useCases: [
      {
        title: "Client intake",
        description: "Capture service fit, timing, and project scope before the first specialist follow-up.",
        icon: "briefcase",
      },
      {
        title: "Proposal and onboarding follow-up",
        description: "Keep next steps, notes, and ownership changes connected during a high-consideration sales cycle.",
        icon: "files",
      },
      {
        title: "Ongoing service communication",
        description: "Support active client coordination with cleaner handoff and shared visibility.",
        icon: "workflow",
      },
    ],
    faqs: [
      {
        question: "Can we qualify inquiries by service line or expertise?",
        answer:
          "Yes. SwyftUp can capture intake context and route by practice, office, skill set, or manual review.",
      },
      {
        question: "Can multiple specialists collaborate on one conversation?",
        answer:
          "Yes. The shared timeline, notes, and ownership changes make collaboration easier without losing history.",
      },
      {
        question: "Does this work for both new business and active client communication?",
        answer:
          "Yes. Teams can use SwyftUp for intake, proposal follow-up, onboarding, and ongoing service coordination.",
      },
      {
        question: "Can we track response expectations?",
        answer: "Yes. SLA visibility helps firms keep response standards clear.",
      },
      {
        question: "How quickly can a firm launch?",
        answer:
          "Many firms start with intake and routing, then expand into voice, AI reception, and deeper integrations.",
      },
    ],
  }),
  "/solutions/healthcare": createSolutionPage({
    slug: "/solutions/healthcare",
    metaTitle: "Healthcare Communication Software | SwyftUp",
    metaDescription:
      "Support appointment requests and patient questions with privacy-aware chat, voice, routing, and workflow controls.",
    keywords: [
      "healthcare communication software",
      "appointment request messaging",
      "patient inquiry routing",
      "location-based chat routing",
      "privacy-aware communication",
      "clinic contact platform",
    ],
    eyebrow: "Solutions for healthcare",
    title: "Healthcare communication software for privacy-aware patient inquiry workflows",
    subtitle:
      "Manage appointment requests, location-specific questions, service line routing, and after-hours communication in one organized workflow. Urgent medical concerns should always use established emergency or clinical escalation channels.",
    visualTitle: "Appointment request capture, location routing, and privacy-aware controls",
    visualItems: [
      "Route non-emergency intake by clinic, location, or service line.",
      "Capture context after hours without losing the handoff.",
      "Give staff one visible record for follow-up and ownership.",
    ],
    workflowIntro:
      "Healthcare teams often need to centralize non-emergency communication without flattening location and service-line differences.",
    workflowSteps: [
      {
        title: "A patient or caregiver reaches out",
        description: "Appointment requests, general questions, or intake needs arrive by chat or voice.",
        icon: "health",
      },
      {
        title: "The system captures basic context",
        description: "Reason for visit, preferred location, timing, and contact details can be gathered after hours or during overflow.",
        icon: "sparkles",
      },
      {
        title: "Routing directs the request appropriately",
        description: "Location, service line, office hours, or manual review logic keeps the request moving to the right team.",
        icon: "routing",
      },
      {
        title: "Staff continue from a shared timeline",
        description: "Notes, status, and visibility remain available without requiring patients to repeat themselves.",
        icon: "workflow",
      },
    ],
    pain: [
      "Patient-facing communication often spans multiple locations, specialties, and front-desk workflows. When requests land in disconnected inboxes or depend on manual forwarding, response slows down and accountability becomes hard to manage.",
      "The challenge is especially noticeable after hours, during overflow, or when one team has to support several locations.",
    ],
    value: [
      "SwyftUp helps healthcare organizations centralize non-emergency patient-facing communication in a structured, privacy-aware environment.",
      "Website chat, browser-based voice, AI-assisted intake, routing, notes, and operational reporting help teams respond more consistently while keeping access and process easier to manage.",
    ],
    outcomes: [
      "Reduce missed appointment requests and general inquiries",
      "Route by clinic, location, or service line more clearly",
      "Improve after-hours intake without breaking the handoff",
      "Give staff a more visible queue of what needs attention",
      "Support privacy-aware operations with clear controls",
    ],
    useCases: [
      {
        title: "Appointment request intake",
        description: "Capture non-emergency scheduling requests and route them to the right team or location.",
        icon: "calendar",
      },
      {
        title: "Location-specific questions",
        description: "Direct patients to the right office without making them repeat their request across channels.",
        icon: "local",
      },
      {
        title: "Shared service support",
        description: "Give centralized teams a better way to manage distributed communication demand.",
        icon: "team",
      },
    ],
    faqs: [
      {
        question: "Can SwyftUp support appointment requests and general inquiries?",
        answer:
          "Yes. It is well suited for non-emergency intake, scheduling questions, and service-line or location-based communication.",
      },
      {
        question: "Can we route by clinic, location, or service line?",
        answer:
          "Yes. Routing rules can support location, availability, office hours, and manual review.",
      },
      {
        question: "Can the AI receptionist help after hours?",
        answer:
          "Yes. It can collect context and prepare a handoff for the next business window.",
      },
      {
        question: "How should urgent issues be handled?",
        answer:
          "Urgent or emergency matters should use established emergency or clinical escalation channels, not standard web messaging.",
      },
      {
        question: "Can staff access be controlled?",
        answer:
          "Yes. Roles, permissions, and audit visibility help teams manage access more carefully.",
      },
    ],
  }),
  "/solutions/education": createSolutionPage({
    slug: "/solutions/education",
    metaTitle: "Education Communication Platform | SwyftUp",
    metaDescription:
      "Help admissions and student-facing teams respond faster with chat, voice, AI routing, and shared workflow visibility.",
    keywords: [
      "education communication platform",
      "admissions chat software",
      "student inquiry routing",
      "campus communication platform",
      "education lead response",
      "program inquiry messaging",
    ],
    eyebrow: "Solutions for education",
    title: "Education communication platform for admissions and student support teams",
    subtitle:
      "Capture program questions, route by campus or department, and keep student communication clear from first inquiry to final handoff.",
    visualTitle: "Program inquiry capture, department routing, and response tracking",
    visualItems: [
      "Route by campus, department, or program.",
      "Support peak enrollment periods with shared visibility.",
      "Keep admissions and student services connected without duplicate follow-up.",
    ],
    workflowIntro:
      "Education providers need student-facing communication to feel responsive, organized, and easy to pass between departments.",
    workflowSteps: [
      {
        title: "A student or prospect reaches out",
        description: "Program, application, support, or scheduling questions arrive through chat or voice.",
        icon: "education",
      },
      {
        title: "AI gathers key intake details",
        description: "Campus preference, program interest, timing, and other basic context are collected before handoff.",
        icon: "sparkles",
      },
      {
        title: "Routing sends it to the right team",
        description: "Campus, department, or specialist rules keep ownership clear.",
        icon: "routing",
      },
      {
        title: "Staff continue from a shared timeline",
        description: "Notes, attachments, and response status stay connected for the next step.",
        icon: "workflow",
      },
    ],
    pain: [
      "Education inquiries often span admissions, financial services, advising, departments, and campus support. When communication depends on shared inboxes or manual forwarding, students wait longer and staff spend too much time sorting instead of helping.",
      "That makes the experience less responsive and hides where internal handoffs are failing.",
    ],
    value: [
      "SwyftUp creates one communication layer for inquiry capture, routing, follow-up, and reporting. Teams can handle program questions, application support, appointment requests, and student service issues in a more structured way.",
      "Leaders gain better visibility into demand and response patterns, while students experience a clearer path to the right team.",
    ],
    outcomes: [
      "Respond faster during peak enrollment periods",
      "Route by campus, department, or program without manual sorting",
      "Keep admissions and student services aligned on ownership",
      "Improve after-hours capture and follow-up consistency",
      "Measure response performance and inquiry concentration over time",
    ],
    useCases: [
      {
        title: "Admissions and enrollment",
        description: "Support program discovery, application questions, and next-step follow-up more consistently.",
        icon: "education",
      },
      {
        title: "Student services",
        description: "Route support and administrative questions with clearer ownership between departments.",
        icon: "help",
      },
      {
        title: "Campus and department coordination",
        description: "Manage location-specific or team-specific communication in one operational layer.",
        icon: "building",
      },
    ],
    faqs: [
      {
        question: "Can we route by campus, department, or program?",
        answer:
          "Yes. SwyftUp can support routing based on campus, service area, timing, and manual review.",
      },
      {
        question: "Can admissions and student services share the platform?",
        answer:
          "Yes. Multiple teams can operate from one communication layer while maintaining clearer ownership.",
      },
      {
        question: "Will this help during peak enrollment periods?",
        answer:
          "Yes. Routing, AI-assisted intake, and shared visibility help teams manage spikes more consistently.",
      },
      {
        question: "Can the AI receptionist answer common questions?",
        answer:
          "It can gather details, handle common first-response tasks, and prepare handoff summaries for staff.",
      },
      {
        question: "What can education teams measure?",
        answer:
          "Teams can review response time, inquiry volume, ownership patterns, and signals that show which workflows need attention.",
      },
    ],
  }),
  "/solutions/local-business": createSolutionPage({
    slug: "/solutions/local-business",
    metaTitle: "Local Business Messaging Platform | SwyftUp",
    metaDescription:
      "Manage bookings, quotes, service questions, and after-hours inquiries with chat, voice, routing, and AI workflows.",
    keywords: [
      "local business messaging platform",
      "multi-location chat routing",
      "booking request chat",
      "local service business messaging",
      "website chat for local business",
      "after-hours inquiry capture",
    ],
    eyebrow: "Solutions for local and multi-location business",
    title: "Local business communication platform for location-based teams and service workflows",
    subtitle:
      "Capture quote requests, booking questions, and service inquiries, then route them by location, team, or business hours from one shared communication platform.",
    visualTitle: "Location-aware routing, after-hours capture, and team performance",
    visualItems: [
      "Route quote, booking, and service questions by location.",
      "Capture after-hours demand without losing context.",
      "Compare response performance across teams or sites.",
    ],
    workflowIntro:
      "Local businesses need fast response at the front door and clear ownership behind the scenes, especially when multiple locations share demand.",
    workflowSteps: [
      {
        title: "A customer asks about hours, pricing, booking, or availability",
        description: "The request comes in through the website widget or a browser-based call.",
        icon: "local",
      },
      {
        title: "The AI receptionist collects the basics",
        description: "When a location is busy or closed, the system still captures the intent and next-step details.",
        icon: "sparkles",
      },
      {
        title: "Routing sends it to the right location or owner",
        description: "Office hours, first available, round robin, or fallback rules keep the handoff clear.",
        icon: "routing",
      },
      {
        title: "Staff follow through from one shared thread",
        description: "Notes, tags, and status updates keep the team aligned through booking, quote, or service completion.",
        icon: "workflow",
      },
    ],
    pain: [
      "Local businesses often lose opportunities in simple moments: when no one answers after hours, when a request reaches the wrong location, or when ownership is unclear between front desk, dispatch, and management.",
      "Those issues feel small one by one, but they become expensive when they repeat every day.",
    ],
    value: [
      "SwyftUp helps local businesses centralize inbound communication and route it more deliberately. Website chat, browser-based voice, AI-assisted intake, and operational workflows help teams respond faster without making the process harder to manage.",
      "It works well for service businesses, clinics, showrooms, fitness brands, and other businesses with location-based coverage needs.",
    ],
    outcomes: [
      "Capture more after-hours demand",
      "Reduce missed bookings and quote requests",
      "Route customer questions to the right location faster",
      "Compare performance across teams or locations",
      "Keep follow-up and accountability more consistent",
    ],
    useCases: [
      {
        title: "Booking and scheduling questions",
        description: "Handle appointment, class, or availability questions without burying them in a general inbox.",
        icon: "calendar",
      },
      {
        title: "Quote and service requests",
        description: "Capture request details and route them to the location or owner best suited to respond.",
        icon: "briefcase",
      },
      {
        title: "Multi-location coverage",
        description: "Give operators a clearer way to manage distributed communication without flattening local ownership.",
        icon: "building",
      },
    ],
    faqs: [
      {
        question: "Can we route by location and business hours?",
        answer:
          "Yes. SwyftUp is well suited for location-aware routing and office-hours coverage.",
      },
      {
        question: "Can the AI receptionist collect quote or booking details after hours?",
        answer:
          "Yes. It can gather basic request details, summarize the inquiry, and hand it off to the right team.",
      },
      {
        question: "Does this work for both single-location and multi-location businesses?",
        answer:
          "Yes. Teams can start simple and expand the routing model as the business grows.",
      },
      {
        question: "Can managers compare locations?",
        answer:
          "Yes. Analytics can surface differences in volume, speed, and other operational patterns.",
      },
      {
        question: "Do we need a large technical team to launch?",
        answer:
          "No. Many local businesses can start with a focused setup and add deeper integrations later.",
      },
    ],
  }),
  "/pricing": {
    slug: "/pricing",
    metaTitle: "Pricing | SwyftUp",
    metaDescription:
      "Compare SwyftUp plans for chat, voice, AI receptionist, routing, workflows, and analytics for growing teams.",
    keywords: [
      "customer communication platform pricing",
      "business messaging software pricing",
      "AI receptionist pricing",
      "shared inbox pricing",
      "voice and chat pricing",
      "team communication plans",
    ],
    hero: {
      eyebrow: "Pricing",
      title: "Simple pricing for teams that need chat, voice, and AI in one place",
      subtitle:
        "Start with the communication channels and operational controls you need now, then expand into deeper routing, AI, and reporting as your workflow grows.",
      actions: [demoAction, salesAction, productAction],
      visual: {
        eyebrow: "Pricing at a glance",
        title: "Plans sized by workflow maturity, not feature tricks",
        items: [
          "Start with chat and shared inbox workflows.",
          "Add voice, AI reception, and deeper routing as the business grows.",
          "Use enterprise support when rollout, procurement, or customization require more structure.",
        ],
        footer:
          "Pricing comparison for Starter, Growth, Scale, and Enterprise with feature access and rollout guidance.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Pricing philosophy",
        title: "Clear plan boundaries, room to grow, and no forced rebuilds",
        paragraphs: [
          "SwyftUp pricing is designed to feel straightforward: one platform, clear feature boundaries, and room to grow without rebuilding your process.",
          "Plans are positioned around team maturity, workflow complexity, and rollout needs rather than trying to upsell what should be foundational.",
        ],
      },
      {
        kind: "pricing",
        eyebrow: "Plans",
        title: "Choose the plan that matches how your team works today",
        intro:
          "These plan details are written to be table-friendly in the UI while still giving buyers enough context to compare fit quickly.",
        plans: [
          {
            name: "Starter",
            price: "$99",
            period: "/month",
            description: "Launch shared chat and inbox workflows without overcomplicating the first rollout.",
            bestFor: "Small teams starting with website messaging and core inbox operations",
            ctaLabel: "Get Started",
            included: [
              "2 seats",
              "Website widget",
              "Shared inbox",
              "Conversation history and attachments",
              "Notes and tags",
              "Basic routing",
              "Basic analytics",
              "Email support",
            ],
          },
          {
            name: "Growth",
            price: "$349",
            period: "/month",
            description: "Add AI receptionist, browser-based voice, and stronger routing for a busier team.",
            bestFor: "Teams expanding into after-hours coverage, voice, and more deliberate operations",
            ctaLabel: "Book a Demo",
            highlight: "Most popular",
            included: [
              "5 seats",
              "Everything in Starter",
              "Browser-based voice",
              "AI receptionist",
              "Office hours and fallback routing",
              "SLA visibility",
              "Connector-ready workflows",
              "Guided onboarding",
            ],
          },
          {
            name: "Scale",
            price: "$899",
            period: "/month",
            description: "Add deeper reporting, admin control, and technical flexibility for a multi-team operation.",
            bestFor: "Businesses needing stronger analytics, governance, and API-enabled rollout",
            ctaLabel: "Talk to Sales",
            included: [
              "15 seats",
              "Everything in Growth",
              "Advanced analytics",
              "Audit logs",
              "Retention controls",
              "API and webhook access",
              "Advanced permissions",
              "Priority onboarding",
            ],
          },
          {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "Support larger rollouts, custom commercial terms, and more structured implementation needs.",
            bestFor: "Organizations with procurement, customization, or multi-workspace requirements",
            ctaLabel: "Talk to Sales",
            included: [
              "Tailored seats and usage",
              "Multi-workspace setup",
              "Custom commercial terms",
              "Dedicated success planning",
              "Implementation support",
              "Technical review path",
            ],
          },
        ],
        matrix: [
          {
            label: "Messaging and shared inbox",
            values: ["Included", "Included", "Included", "Included"],
          },
          {
            label: "Browser-based voice",
            values: ["Optional later", "Included", "Included", "Included"],
          },
          {
            label: "AI receptionist",
            values: ["Optional", "Included", "Included", "Included"],
          },
          {
            label: "Advanced routing and SLAs",
            values: ["Basic", "Included", "Included", "Included"],
          },
          {
            label: "API and webhooks",
            values: ["Not included", "Connector-ready", "Included", "Included"],
          },
          {
            label: "Audit logs and retention controls",
            values: ["Not included", "Not included", "Included", "Included"],
          },
        ],
        footnote:
          "Optional add-ons can cover additional seats, expanded AI usage, future PSTN voice packages, and implementation services.",
      },
      {
        kind: "list",
        eyebrow: "Included value",
        title: "What every plan is designed to protect",
        intro:
          "Even the first plan should feel like a real communication layer, not a stripped-down shell.",
        items: [
          "One shared communication layer instead of channel silos",
          "Core messaging, shared history, and team visibility from day one",
          "A path to deeper routing, AI coverage, and reporting as needs grow",
          "Commercial clarity around optional usage and rollout support",
        ],
        columns: 2,
      },
      {
        kind: "faqs",
        eyebrow: "Pricing FAQs",
        title: "Questions buyers usually ask before they choose a plan",
        items: pricingFaqs,
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Pages that help buyers compare fit",
        items: [
          ...sharedProductLinks.slice(0, 5),
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "See setup, rollout, and product questions answered in more detail.",
            icon: "help",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Need help sizing the right plan?",
        body:
          "The best plan is the one that matches how your team actually works. If you want help sizing seats, routing depth, AI coverage, and rollout support, we can map it together.",
        actions: [demoAction, salesAction],
      },
    ],
    structuredData: pricingStructuredData,
  },
  "/blog": {
    slug: "/blog",
    metaTitle: "Blog | SwyftUp",
    metaDescription:
      "Read SwyftUp insights on customer communication, AI reception, routing, workflows, analytics, and better team operations.",
    keywords: [
      "customer communication blog",
      "AI receptionist blog",
      "routing best practices",
      "chat operations blog",
      "voice support insights",
      "customer operations content",
    ],
    hero: {
      eyebrow: "Resources",
      title: "Insights on customer communication, routing, and AI operations",
      subtitle:
        "The SwyftUp Blog covers communication strategy, routing design, AI receptionist workflows, analytics, and implementation lessons for growing teams across industries.",
      actions: [guidesAction, { label: "See Case Studies", to: "/resources/case-studies", variant: "secondary" }, demoAction],
      visual: {
        eyebrow: "Editorial layout",
        title: "Practical content for operators, buyers, and team leads",
        items: [
          "Answer real questions about rollout, routing, analytics, and AI usage.",
          "Link informational content into guides, case studies, and product pages.",
          "Build authority around the workflow problems buyers are already trying to solve.",
        ],
        footer:
          "Editorial layout featuring practical articles on chat, routing, AI automation, and customer operations.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "SEO intro",
        title: "Content for teams evaluating the operational side of communication",
        paragraphs: [
          "The blog is where SwyftUp answers the informational questions buyers ask before they choose a platform: how to reduce first response time, how to design routing, what to automate first, and what to measure beyond raw activity.",
          "Content stays broad enough for multiple industries while remaining anchored in the platform’s core themes: chat, voice, AI automation, workflows, analytics, integrations, and security.",
        ],
      },
      {
        kind: "resources",
        eyebrow: "Categories",
        title: "Explore by topic",
        intro: "Use category chips and featured articles to help readers move from educational intent to product evaluation.",
        chips: [
          "AI Receptionist",
          "Website Chat",
          "Voice",
          "Routing",
          "Workflows",
          "Analytics",
          "Integrations",
          "Security",
          "Industry Playbooks",
        ],
        items: [
          {
            title: "How to Cut First Response Time Without Adding Headcount",
            description: "A practical look at routing, office hours, and shared ownership patterns that make faster response sustainable.",
            meta: "Featured article",
            to: "/resources/guides",
            icon: "analytics",
          },
          {
            title: "First Available vs Round Robin: Choosing the Right Routing Model",
            description: "Compare routing patterns based on fairness, speed, specialization, and operational complexity.",
            meta: "Featured article",
            to: "/resources/guides",
            icon: "routing",
          },
          {
            title: "What to Measure Beyond Response Time in Customer Conversations",
            description: "Go deeper into ownership quality, reopen rates, handoff friction, and conversion-oriented signals.",
            meta: "Featured article",
            to: "/product/features",
            icon: "analytics",
          },
          {
            title: "When an AI Receptionist Helps and When It Gets in the Way",
            description: "Use AI where it improves capture and summaries, not where it creates more confusion for customers.",
            meta: "New article",
            to: "/product/features",
            icon: "sparkles",
          },
          {
            title: "How Multi-Location Teams Should Think About Communication Coverage",
            description: "Design routing and fallback logic for distributed businesses without flattening local accountability.",
            meta: "New article",
            to: "/solutions/local-business",
            icon: "local",
          },
          {
            title: "Why Shared Inboxes Fail and What Actually Fixes Them",
            description: "The missing operational layer is usually routing, ownership, and workflow visibility rather than another inbox feature.",
            meta: "New article",
            to: "/product",
            icon: "message",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Move from reading to planning",
        items: [
          {
            label: "Read implementation guides",
            to: "/resources/guides",
            description: "Go from high-level ideas to rollout playbooks and templates.",
            icon: "book",
          },
          {
            label: "See case study examples",
            to: "/resources/case-studies",
            description: "Understand how teams improve outcomes in real settings.",
            icon: "files",
          },
          {
            label: "Explore the product",
            to: "/product",
            description: "Connect the ideas in the blog to the platform itself.",
            icon: "chat",
          },
          {
            label: "Browse solutions",
            to: "/solutions/local-business",
            description: "See how the platform adapts to different industries and operating models.",
            icon: "building",
          },
          {
            label: "View pricing",
            to: "/pricing",
            description: "Compare plans when informational interest turns commercial.",
            icon: "analytics",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Turn insight into an actual rollout plan",
        body:
          "If an article helps you frame the problem, the next step should help you solve it. Move into guides, case studies, product pages, or a live demo based on how close you are to buying.",
        actions: [guidesAction, { label: "See Case Studies", to: "/resources/case-studies", variant: "secondary" }],
      },
    ],
  },
  "/resources/guides": {
    slug: "/resources/guides",
    metaTitle: "Guides | SwyftUp",
    metaDescription:
      "Explore practical guides for launching chat, voice, AI reception, routing, and customer communication workflows.",
    keywords: [
      "customer communication guides",
      "implementation guide",
      "routing playbook",
      "AI receptionist guide",
      "messaging workflow templates",
      "analytics guide",
    ],
    hero: {
      eyebrow: "Guides",
      title: "Practical guides for launching better customer communication",
      subtitle:
        "Browse implementation guides, routing playbooks, AI receptionist frameworks, and reporting templates that help your team launch with more confidence.",
      actions: [productAction, { label: "See Case Studies", to: "/resources/case-studies", variant: "secondary" }, salesAction],
      visual: {
        eyebrow: "Guides library",
        title: "Playbooks for rollout, routing, AI, and analytics",
        items: [
          "Help operators move from strategy to execution faster.",
          "Create a mid-funnel path between thought leadership and sales conversations.",
          "Pair practical steps with direct links to product and support pages.",
        ],
        footer:
          "Guides library with implementation playbooks, routing frameworks, and AI receptionist setup resources.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "SEO intro",
        title: "Guides are where planning turns into implementation",
        paragraphs: [
          "The guides hub targets mid-funnel visitors who know the problem but need a clearer rollout path.",
          "These resources provide practical decision support for operators, team leads, and buyers mapping strategy to execution.",
        ],
      },
      {
        kind: "resources",
        eyebrow: "Guide topics",
        title: "Browse the library by rollout theme",
        chips: [
          "Launch Planning",
          "Routing Design",
          "AI Receptionist",
          "Voice Workflows",
          "Analytics",
          "Integrations",
          "Operations Templates",
        ],
        items: [
          {
            title: "Launch SwyftUp in 14 Days",
            description: "A practical week-by-week rollout path covering widget setup, routing, AI intake, and first reporting review.",
            meta: "Implementation guide",
            to: "/help",
            icon: "calendar",
          },
          {
            title: "Designing Office Hours and Fallback Routing",
            description: "Set up predictable coverage rules without overengineering the first version of your workflow.",
            meta: "Routing playbook",
            to: "/product/features",
            icon: "routing",
          },
          {
            title: "What to Automate First with an AI Receptionist",
            description: "Choose the highest-leverage intake and summary tasks before you automate anything customer-facing.",
            meta: "AI guide",
            to: "/product/features",
            icon: "sparkles",
          },
          {
            title: "How to Build an Analytics Review Cadence",
            description: "Use response time, handoff quality, reopen rates, and conversion signals to improve the system over time.",
            meta: "Reporting guide",
            to: "/product/features",
            icon: "analytics",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Where guides should send readers next",
        items: [
          {
            label: "Read the blog",
            to: "/blog",
            description: "Start with educational content before jumping into implementation detail.",
            icon: "book",
          },
          {
            label: "See case studies",
            to: "/resources/case-studies",
            description: "Connect rollout guidance to real customer outcomes and examples.",
            icon: "files",
          },
          {
            label: "Explore product features",
            to: "/product/features",
            description: "Map each guide topic back to the capabilities that support it.",
            icon: "chat",
          },
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "Continue from strategic guidance into setup and troubleshooting documentation.",
            icon: "help",
          },
          {
            label: "Book a demo",
            to: "/contact",
            description: "Move into a tailored walkthrough once the implementation path is clearer.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Use the guides to launch faster",
        body:
          "If you’re planning a rollout, the guides can help you move faster. If you’re ready to map that plan to your own workflow, the next step is a live demo.",
        actions: [productAction, salesAction],
      },
    ],
  },
  "/resources/case-studies": {
    slug: "/resources/case-studies",
    metaTitle: "Case Studies | SwyftUp",
    metaDescription:
      "See how teams use SwyftUp to respond faster, route better, and manage customer communication more clearly.",
    keywords: [
      "customer communication case studies",
      "customer messaging success stories",
      "AI receptionist results",
      "routing case studies",
      "shared inbox ROI",
      "cross-industry case studies",
    ],
    hero: {
      eyebrow: "Case studies",
      title: "Case studies and workflow examples for customer communication teams",
      subtitle:
        "Review verified case studies when available and explore implementation patterns that show how teams deploy SwyftUp across industries.",
      actions: [demoAction, guidesAction, pricingAction],
      visual: {
        eyebrow: "Case study grid",
        title: "Cross-industry proof, outcome themes, and workflow snapshots",
        items: [
          "Show faster response, stronger consistency, and better visibility as recurring outcomes.",
          "Use industry filters to help buyers find the story closest to their own workflow.",
          "Connect each story to product, pricing, and guide pages to support evaluation.",
        ],
        footer:
          "Case study grid with industry filters, workflow themes, and implementation snapshots.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "SEO intro",
        title: "Verified proof and implementation patterns that support buyer evaluation",
        paragraphs: [
          "This page publishes verified customer stories when approval for public attribution is complete.",
          "Until then, it highlights repeatable workflow patterns buyers can evaluate in a demo, then map to their own routing, ownership, and response model.",
        ],
      },
      {
        kind: "resources",
        eyebrow: "Stories",
        title: "Browse by industry or outcome",
        chips: [
          "Real Estate",
          "Ecommerce",
          "Professional Services",
          "Healthcare",
          "Education",
          "Multi-Location",
          "Lead Capture",
          "Support Operations",
        ],
        items: [
          {
            title: "Workflow example: multi-office lead routing for real estate",
            description: "A brokerage pattern that combines office-aware routing and after-hours AI intake for cleaner lead coverage.",
            meta: "Workflow spotlight",
            to: "/solutions/real-estate",
            icon: "building",
          },
          {
            title: "Workflow example: ecommerce campaign-volume triage",
            description: "A shopper support pattern that separates pre-purchase and post-purchase questions during peak demand.",
            meta: "Workflow spotlight",
            to: "/solutions/ecommerce",
            icon: "cart",
          },
          {
            title: "Workflow example: appointment intake across clinic locations",
            description: "A patient-facing pattern that centralizes location routing and after-hours capture without losing context.",
            meta: "Workflow spotlight",
            to: "/solutions/healthcare",
            icon: "health",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Related evaluation pages",
        items: [
          {
            label: "Explore the product",
            to: "/product",
            description: "Connect the outcomes in each story to the platform capabilities behind them.",
            icon: "chat",
          },
          {
            label: "View pricing",
            to: "/pricing",
            description: "Move from proof into plan fit and rollout sizing.",
            icon: "analytics",
          },
          {
            label: "Read implementation guides",
            to: "/resources/guides",
            description: "See how to launch similar workflows in your own environment.",
            icon: "book",
          },
          {
            label: "See the real estate workflow",
            to: "/solutions/real-estate",
            description: "Review one of the strongest vertical-specific paths in more detail.",
            icon: "building",
          },
          {
            label: "Talk to sales",
            to: "/contact",
            description: "Ask how the same operating model would map to your team.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Turn proof into a tailored walkthrough",
        body:
          "If you want to see what these workflows could look like in your environment, the next step is a demo tailored to your team, your routing model, and your goals.",
        actions: [demoAction, salesAction],
      },
    ],
  },
  "/resources/changelog": {
    slug: "/resources/changelog",
    metaTitle: "Changelog | SwyftUp",
    metaDescription:
      "Track SwyftUp product updates across messaging, voice, routing, analytics, integrations, and developer tooling.",
    keywords: [
      "customer communication changelog",
      "product updates",
      "release notes",
      "platform improvements",
      "feature releases",
      "developer changes",
    ],
    hero: {
      eyebrow: "Changelog",
      title: "Product updates that make daily work easier",
      subtitle:
        "Follow releases across messaging, voice, AI reception, routing, workflows, analytics, integrations, and developer tools.",
      actions: [helpAction, { label: "Read the Docs", to: "/product/developers", variant: "secondary" }, demoAction],
      visual: {
        eyebrow: "Release feed",
        title: "A running view of how the product evolves",
        items: [
          "Use release notes as a trust signal for active evaluators and existing customers.",
          "Link product changes to help content whenever behavior changes.",
          "Make the changelog searchable by area: routing, analytics, integrations, developer, and fixes.",
        ],
        footer:
          "Changelog feed showing recent releases across routing, analytics, integrations, and developer features.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "SEO intro",
        title: "Release notes that are useful, searchable, and connected to documentation",
        paragraphs: [
          "The changelog supports searches around product updates while also acting as a trust page for active evaluators and customers.",
          "Each entry explains what changed, who it helps, and where to go next for setup or troubleshooting guidance.",
        ],
      },
      {
        kind: "resources",
        eyebrow: "Recent updates",
        title: "Latest product changes",
        chips: [
          "Messaging",
          "Voice",
          "AI Receptionist",
          "Routing",
          "Analytics",
          "Integrations",
          "Developer",
          "Fixes",
        ],
        items: [
          {
            title: "Conversation summaries at close",
            description: "Create cleaner handoff notes and easier review when a conversation reaches resolution.",
            meta: "Release note",
            to: "/product/features",
            icon: "sparkles",
          },
          {
            title: "Office-hours routing builder",
            description: "Configure business windows, fallback paths, and assignment logic with more clarity.",
            meta: "Release note",
            to: "/product/features",
            icon: "routing",
          },
          {
            title: "Webhook delivery logs",
            description: "Give technical teams more visibility into integration events, retries, and troubleshooting.",
            meta: "Release note",
            to: "/product/developers",
            icon: "integrations",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Related documentation and product pages",
        items: [
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "See setup and support guidance related to recent product changes.",
            icon: "help",
          },
          {
            label: "Read developer docs",
            to: "/product/developers",
            description: "Follow release notes into the technical docs when APIs or events change.",
            icon: "code",
          },
          {
            label: "Browse integrations",
            to: "/product/integrations",
            description: "See how connector and webhook updates fit the broader integration story.",
            icon: "integrations",
          },
          {
            label: "Read the blog",
            to: "/blog",
            description: "Use thought leadership to add context around product direction and best practices.",
            icon: "book",
          },
          {
            label: "Book a demo",
            to: "/contact",
            description: "Ask how recent releases affect the workflow you want to launch.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Use release notes as part of your evaluation",
        body:
          "If you’re evaluating the product, the changelog shows how the platform is evolving. Pair it with the help center and developer docs for the full picture.",
        actions: [helpAction, { label: "Read the Docs", to: "/product/developers", variant: "secondary" }],
      },
    ],
  },
  "/help": {
    slug: "/help",
    metaTitle: "Help Center | SwyftUp",
    metaDescription:
      "Find setup help, product docs, routing guidance, and troubleshooting resources for SwyftUp.",
    keywords: [
      "customer communication help center",
      "setup help",
      "routing help",
      "voice help",
      "AI receptionist help",
      "admin documentation",
    ],
    hero: {
      eyebrow: "Help Center",
      title: "Find what you need to launch, manage, and improve SwyftUp",
      subtitle:
        "Search setup guides, routing help, voice and AI receptionist documentation, analytics articles, and admin resources.",
      actions: [helpAction, guidesAction, { label: "Contact Us", to: "/contact", variant: "secondary" }],
      visual: {
        eyebrow: "Support and docs",
        title: "Search, category cards, and onboarding shortcuts",
        items: [
          "Guide new admins from setup into routing, AI configuration, and first reporting review.",
          "Keep troubleshooting close to product docs and release notes.",
          "Use strong linking into changelog, developer docs, and product pages.",
        ],
        footer:
          "Help center layout with search, category cards, popular articles, and onboarding shortcuts.",
      },
    },
    sections: [
      {
        kind: "resources",
        eyebrow: "Popular topics",
        title: "Browse help by task or product area",
        intro:
          "The Help Center supports both evaluators and customers who want product-specific answers before or after launch.",
        searchPlaceholder: "Search setup, routing, analytics, or troubleshooting...",
        items: [
          {
            title: "Getting started",
            description: "Workspace setup, widget install, and first-run onboarding articles for new admins.",
            meta: "Category",
            to: "/resources/guides",
            icon: "calendar",
          },
          {
            title: "Inbox and messaging",
            description: "Learn how shared timelines, attachments, notes, tags, and statuses work day to day.",
            meta: "Category",
            to: "/product/features",
            icon: "chat",
          },
          {
            title: "Voice",
            description: "Review browser-based calling behavior, setup, and workflow recommendations.",
            meta: "Category",
            to: "/product/features",
            icon: "voice",
          },
          {
            title: "AI receptionist",
            description: "Configure after-hours coverage, qualification prompts, and handoff summaries.",
            meta: "Category",
            to: "/product/features",
            icon: "sparkles",
          },
          {
            title: "Routing and assignment",
            description: "Set up office hours, round robin, fallback logic, and ownership controls.",
            meta: "Category",
            to: "/product/features",
            icon: "routing",
          },
          {
            title: "Analytics and admin controls",
            description: "Use reporting, permissions, audit visibility, and retention settings more effectively.",
            meta: "Category",
            to: "/product/security",
            icon: "analytics",
          },
        ],
      },
      {
        kind: "steps",
        eyebrow: "Getting started",
        title: "The onboarding path new admins should see first",
        items: [
          {
            title: "Set up the workspace",
            description: "Create the account structure, add teammates, and establish access levels.",
            icon: "team",
          },
          {
            title: "Install the widget",
            description: "Add the chat entry point to your site and confirm the basic customer flow.",
            icon: "globe",
          },
          {
            title: "Configure routing and AI",
            description: "Define office hours, ownership logic, and after-hours capture behavior.",
            icon: "routing",
          },
          {
            title: "Review first reporting",
            description: "Track early response and workflow patterns to make the first improvements quickly.",
            icon: "analytics",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Pages closely connected to support content",
        items: [
          {
            label: "Read developer docs",
            to: "/product/developers",
            description: "Continue into APIs and webhooks when setup becomes technical.",
            icon: "code",
          },
          {
            label: "Browse integrations",
            to: "/product/integrations",
            description: "Connect help content to the systems customers want to sync.",
            icon: "integrations",
          },
          {
            label: "Review security",
            to: "/product/security",
            description: "Bring admin, permissions, and retention questions into one place.",
            icon: "security",
          },
          {
            label: "See pricing",
            to: "/pricing",
            description: "Support upgrade and plan-fit questions from existing or prospective customers.",
            icon: "analytics",
          },
          {
            label: "Contact the team",
            to: "/contact",
            description: "Escalate setup or commercial questions when docs are not enough.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Use the Help Center as the bridge between launch and adoption",
        body:
          "The Help Center makes SwyftUp easier to adopt at every stage, from first setup to advanced workflows. If the answer you need is not here, contact the team directly.",
        actions: [{ label: "Contact Us", to: "/contact", variant: "primary" }, guidesAction],
      },
    ],
  },
  "/about": {
    slug: "/about",
    metaTitle: "About | SwyftUp",
    metaDescription:
      "Learn why SwyftUp exists and how we help growing businesses run customer communication with more clarity.",
    keywords: [
      "about swyftup",
      "customer communication company",
      "communication software company",
      "SwyftUp mission",
      "platform story",
      "team values",
    ],
    hero: {
      eyebrow: "Company",
      title: "A calmer way to run customer communication",
      subtitle:
        "We built SwyftUp for teams that need clarity, not more tools. The platform exists to make customer communication more visible, more consistent, and easier to operate across industries.",
      actions: [productAction, demoAction, { label: "Careers", to: "/careers", variant: "secondary" }],
      visual: {
        eyebrow: "Company snapshot",
        title: "Mission, product thinking, and the team behind the platform",
        items: [
          "SwyftUp treats customer communication as an operational problem, not just a channel problem.",
          "The product is designed for flexibility, clarity, and automation that supports human judgment.",
          "The company is focused on helping growing teams work with more confidence and less friction.",
        ],
        footer:
          "About page featuring company mission, operating principles, and the team behind SwyftUp.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Our story",
        title: "Why SwyftUp exists",
        paragraphs: [
          "Too many businesses are forced to choose between moving fast and staying organized. We believe they should be able to do both.",
          "SwyftUp was built around the idea that customer communication is not just a channel problem. It is an operational problem, and the tools should reflect that.",
        ],
      },
      {
        kind: "cards",
        eyebrow: "Our values",
        title: "Principles that shape the product",
        items: [
          {
            title: "Clarity over noise",
            description: "We prefer visibility, plain language, and simple control models over avoidable complexity.",
            icon: "check",
          },
          {
            title: "Flexibility over rigid workflows",
            description: "Different industries and teams work differently. The platform should adapt to that reality.",
            icon: "workflow",
          },
          {
            title: "Automation that supports people",
            description: "AI should help teams capture context and move faster, not erase the human side of service.",
            icon: "sparkles",
          },
          {
            title: "Operational trust",
            description: "Security, permissions, audit visibility, and retention should be understandable and practical.",
            icon: "security",
          },
        ],
        columns: 2,
      },
      {
        kind: "cards",
        eyebrow: "Leadership",
        title: "How the leadership team is structured",
        intro:
          "SwyftUp is led by operators across product, engineering, and customer experience with a shared focus on execution quality.",
        items: [
          {
            title: "Executive leadership",
            description: "Sets product direction, operating priorities, and long-term company strategy.",
            icon: "team",
          },
          {
            title: "Product and design",
            description: "Owns the workflow design behind chat, voice, routing, and analytics.",
            icon: "workflow",
          },
          {
            title: "Customer success",
            description: "Leads rollout planning, adoption, and post-launch optimization for customer teams.",
            icon: "help",
          },
        ],
        columns: 3,
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Questions about the company",
        items: [
          {
            question: "Why does SwyftUp exist?",
            answer:
              "SwyftUp exists to help businesses manage customer communication with more clarity and less operational overhead.",
          },
          {
            question: "Who is the platform built for?",
            answer:
              "It is built for growing teams across industries that need faster response and cleaner handoffs.",
          },
          {
            question: "What does flexible mean in practice?",
            answer:
              "Teams can start with a focused use case and adapt routing, workflows, AI, and integrations to match how they operate.",
          },
          {
            question: "How do you work with customers?",
            answer:
              "SwyftUp is designed to support guided rollout, practical onboarding, and long-term workflow improvement.",
          },
          {
            question: "How can I contact the team?",
            answer: "Use the contact page to book a demo, ask about pricing, or start a conversation.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Company pages that support trust and discovery",
        items: [
          {
            label: "Learn about careers",
            to: "/careers",
            description: "See how SwyftUp talks about mission, team, and future growth.",
            icon: "briefcase",
          },
          {
            label: "Explore partnerships",
            to: "/partners",
            description: "Understand how agencies, consultants, and integrators can work with SwyftUp.",
            icon: "partners",
          },
          {
            label: "Talk to sales",
            to: "/contact",
            description: "Ask about product fit, pricing, or rollout planning.",
            icon: "calendar",
          },
          {
            label: "Explore the product",
            to: "/product",
            description: "Connect the company point of view to the platform itself.",
            icon: "chat",
          },
          {
            label: "Read the blog",
            to: "/blog",
            description: "See how SwyftUp educates the market around communication operations.",
            icon: "book",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "If the way you work matters as much as the features you buy",
        body:
          "SwyftUp is worth a closer look if you care about the operational side of customer communication as much as the front-end channels. Explore the product or talk to the team about your workflow.",
        actions: [productAction, demoAction],
      },
    ],
  },
  "/contact": {
    slug: "/contact",
    metaTitle: "Contact Sales | SwyftUp",
    metaDescription:
      "Talk to the SwyftUp team about chat, voice, AI reception, routing, pricing, integrations, and rollout planning.",
    keywords: [
      "book a SwyftUp demo",
      "talk to sales",
      "customer communication demo",
      "contact swyftup",
      "request pricing",
      "schedule product demo",
    ],
    hero: {
      eyebrow: "Contact",
      title: "See how SwyftUp fits your workflow",
      subtitle:
        "Talk to our team about your goals, your channels, your routing model, and the fastest way to launch SwyftUp for your business.",
      actions: [demoAction, pricingAction, helpAction],
      visual: {
        eyebrow: "What to expect",
        title: "A conversation tailored to your operating model",
        items: [
          "Bring your use case, team structure, and current tools.",
          "Review product fit, routing design, integration paths, and pricing.",
          "Leave with a clearer picture of rollout scope and next steps.",
        ],
        footer:
          "Contact page with a short demo form, expectation-setting copy, and supporting links to pricing, security, and help.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Why contact us",
        title: "Use this page for the commercial and rollout conversation",
        paragraphs: [
          "The contact page is the main conversion point for demos, pricing questions, rollout planning, integration scoping, and security review requests.",
          "The goal is to make it clear that buyers will get a conversation tailored to their workflow rather than a generic product tour.",
        ],
      },
      {
        kind: "form",
        eyebrow: "Demo form",
        title: "Tell us a bit about your team",
        intro:
          "Keep the form short enough to convert and detailed enough to route the conversation intelligently.",
        expectations: [
          "A prompt follow-up from the SwyftUp team",
          "A short discovery conversation about your goals and current stack",
          "A live walkthrough of the workflows that matter most to you",
        ],
        fields: [
          {
            name: "fullName",
            label: "Full name",
            placeholder: "Alex Morgan",
            required: true,
            helper: "Please enter your full name.",
          },
          {
            name: "workEmail",
            label: "Work email",
            type: "email",
            placeholder: "alex@company.com",
            required: true,
            helper: "Please enter a valid work email address.",
          },
          {
            name: "companyName",
            label: "Company name",
            placeholder: "Your company name",
            required: true,
            helper: "Please enter your company name.",
          },
          {
            name: "website",
            label: "Website",
            type: "url",
            placeholder: "https://www.company.com",
            helper: "Please check the format and try again.",
          },
          {
            name: "teamSize",
            label: "Team size",
            type: "select",
            placeholder: "Select team size",
            required: true,
            helper: "Please choose a team size.",
            options: ["1-5", "6-15", "16-50", "51-200", "200+"],
          },
          {
            name: "industry",
            label: "Industry",
            type: "select",
            placeholder: "Choose your industry",
            options: [
              "Real estate",
              "Ecommerce",
              "Professional services",
              "Healthcare",
              "Education",
              "Local / multi-location",
              "SaaS",
              "Other",
            ],
          },
          {
            name: "useCase",
            label: "What do you want to improve?",
            type: "textarea",
            placeholder:
              "Lead response, support coverage, intake, scheduling, routing, reporting...",
            required: true,
            helper: "Please tell us a bit about your use case.",
          },
          {
            name: "timeline",
            label: "Preferred timeline",
            placeholder: "This month, next quarter, or just exploring",
          },
          {
            name: "notes",
            label: "Anything else we should know?",
            type: "textarea",
            placeholder: "Tell us about your current tools, goals, or constraints.",
          },
        ],
        privacyNote:
          "By submitting this form, you agree to SwyftUp contacting you about your request. We handle your information in line with our Privacy Policy and use it only to respond, onboard, and improve service.",
        submitLabel: "Book a Demo",
        successMessage:
          "Thanks. Your request is ready for review. A member of the SwyftUp team will follow up with the right next step.",
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Questions about the sales conversation",
        items: [
          {
            question: "What happens after I submit the form?",
            answer:
              "A member of the SwyftUp team will follow up to understand your use case and schedule the right next step.",
          },
          {
            question: "Can I request pricing details here?",
            answer:
              "Yes. The contact page is the right place to ask about plan fit, rollout size, and commercial questions.",
          },
          {
            question: "Will the demo reflect my industry?",
            answer:
              "Yes. Demos should be tailored to your workflow and operating model, not just a generic product script.",
          },
          {
            question: "Can we cover integrations and security?",
            answer:
              "Yes. Technical and trust-related questions should be welcome as part of the evaluation process.",
          },
          {
            question: "What if I just need documentation or help?",
            answer:
              "Visitors looking for product education can also use the help center, guides, and developer pages.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Helpful pages before or after the conversation",
        items: [
          {
            label: "See the product",
            to: "/product",
            description: "Review the platform at a high level before you book time.",
            icon: "chat",
          },
          {
            label: "Compare pricing",
            to: "/pricing",
            description: "Understand plan fit before or after your initial conversation.",
            icon: "analytics",
          },
          {
            label: "Review security",
            to: "/product/security",
            description: "Bring trust and procurement questions into the evaluation earlier.",
            icon: "security",
          },
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "Read setup, technical, and product guidance before the call.",
            icon: "help",
          },
          {
            label: "Learn about SwyftUp",
            to: "/about",
            description: "See the company story and point of view behind the platform.",
            icon: "team",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Ready to see whether SwyftUp can simplify your workflow?",
        body:
          "If you’re ready to see whether SwyftUp can simplify your communication workflow, this is the place to start.",
        actions: [demoAction, pricingAction],
      },
    ],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Sales | SwyftUp",
      url: `${siteConfig.url}/contact`,
      description:
        "Talk to the SwyftUp team about chat, voice, AI reception, routing, pricing, integrations, and rollout planning.",
    },
  },
  "/careers": {
    slug: "/careers",
    metaTitle: "Careers | SwyftUp",
    metaDescription:
      "Learn what it’s like to build at SwyftUp and explore future career opportunities across product, engineering, and go-to-market.",
    keywords: [
      "SwyftUp careers",
      "communication software jobs",
      "startup careers",
      "join swyftup",
      "SaaS careers",
      "customer operations software careers",
    ],
    hero: {
      eyebrow: "Careers",
      title: "Help build the communication layer modern teams rely on",
      subtitle:
        "Explore how we work and where we are hiring as the SwyftUp team grows.",
      actions: [
        { label: "View Open Roles", to: "/careers", variant: "primary" },
        { label: "Learn About SwyftUp", to: "/about", variant: "secondary" },
        { label: "Contact Us", to: "/contact", variant: "ghost" },
      ],
      visual: {
        eyebrow: "Careers page",
        title: "Mission, principles, and role paths",
        items: [
          "Show why the problem matters and how the team works together.",
          "Keep values practical and human instead of startup-generic.",
          "Launch with a no-openings message if recruiting is not yet active.",
        ],
        footer:
          "Careers page with mission statement, team principles, and current or upcoming role categories.",
      },
    },
    sections: [
      {
        kind: "copy",
        eyebrow: "Why work here",
        title: "A product problem with real operational weight",
        paragraphs: [
          "SwyftUp is working on a problem that sits at the center of how modern businesses operate: how to stay fast, personal, and organized as communication volume grows.",
          "That makes the work meaningful for people who enjoy product craft, operational thinking, and building software that teams actually depend on every day.",
        ],
      },
      {
        kind: "cards",
        eyebrow: "Values",
        title: "What we value in the way we work",
        items: [
          {
            title: "Ownership",
            description: "Take responsibility for the work and for whether it actually helps customers.",
            icon: "check",
          },
          {
            title: "Calm execution",
            description: "Move with clarity, not drama. Good systems are built deliberately.",
            icon: "workflow",
          },
          {
            title: "Curiosity",
            description: "The best ideas often come from understanding the workflow more deeply.",
            icon: "sparkles",
          },
          {
            title: "Respect for customers",
            description: "We build with a strong sense of how real teams actually work under pressure.",
            icon: "team",
          },
        ],
        columns: 2,
      },
      {
        kind: "cards",
        eyebrow: "Team areas",
        title: "Functions likely to grow over time",
        items: [
          { title: "Product", description: "Own product design, workflow clarity, and feature direction.", icon: "workflow" },
          { title: "Engineering", description: "Build the platform, infrastructure, and developer surfaces behind the product.", icon: "code" },
          { title: "Customer Success", description: "Help customers launch well and improve after go-live.", icon: "help" },
          { title: "Go-to-market", description: "Bring the story to market and help teams understand the product fit.", icon: "analytics" },
        ],
        columns: 2,
      },
      {
        kind: "copy",
        eyebrow: "Open roles",
        title: "A clean way to launch before the full hiring program is live",
        paragraphs: [
          "If no roles are open yet, the page says that plainly: No current openings. Join our talent network to hear when new roles are posted.",
          "That keeps the page honest while still building employer-brand equity and giving interested candidates a path to raise their hand.",
        ],
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Questions candidates often have",
        items: [
          {
            question: "Do you post all open roles here?",
            answer: "Yes. This page serves as the main home for current openings.",
          },
          {
            question: "What kinds of people thrive at SwyftUp?",
            answer:
              "People who care about clarity, ownership, product quality, and thoughtful teamwork tend to fit well.",
          },
          {
            question: "What teams are likely to grow over time?",
            answer:
              "Product, engineering, customer success, and go-to-market are the core teams we expect to keep growing.",
          },
          {
            question: "What should candidates expect from the process?",
            answer:
              "Keep the hiring process transparent, respectful, and focused on real job requirements.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Pages candidates may explore next",
        items: [
          {
            label: "Learn about SwyftUp",
            to: "/about",
            description: "Understand the company mission and product point of view.",
            icon: "team",
          },
          {
            label: "Read the blog",
            to: "/blog",
            description: "See how the company thinks about communication operations and product design.",
            icon: "book",
          },
          {
            label: "See the product",
            to: "/product",
            description: "Understand the product mission more concretely.",
            icon: "chat",
          },
          {
            label: "Explore partnerships",
            to: "/partners",
            description: "See the ecosystem side of the company story.",
            icon: "partners",
          },
          {
            label: "Contact the team",
            to: "/contact",
            description: "Raise a hand even before formal recruiting is fully active.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "Interested before the full hiring program is live?",
        body:
          "If you want to build software that improves how businesses communicate and operate, SwyftUp should be on your radar. Use this page to express interest even before the full hiring program is live.",
        actions: [
          { label: "Contact Us", to: "/contact", variant: "primary" },
          { label: "Learn About SwyftUp", to: "/about", variant: "secondary" },
        ],
      },
    ],
  },
  "/partners": {
    slug: "/partners",
    metaTitle: "Partners | SwyftUp",
    metaDescription:
      "Partner with SwyftUp as an agency, consultant, integrator, or referral partner supporting better customer communication.",
    keywords: [
      "customer communication software partners",
      "agency partners",
      "referral partners",
      "integration partners",
      "reseller program",
      "implementation partners",
    ],
    hero: {
      eyebrow: "Partners",
      title: "Partner with SwyftUp",
      subtitle:
        "This page explains how agencies, consultants, implementation teams, and referral partners can bring SwyftUp workflows to their clients.",
      actions: [
        { label: "Apply to Partner", to: "/contact", variant: "primary" },
        salesAction,
        integrationsAction,
      ],
      visual: {
        eyebrow: "Partner page",
        title: "Referral, implementation, and technology partnership paths",
        items: [
          "Support partner discovery even before the formal program is fully mature.",
          "Explain how SwyftUp works with agencies, consultants, and integrators.",
          "Connect enablement resources back to product and developer pages.",
        ],
        footer: "Partner page with referral, implementation, and technology partnership paths.",
      },
    },
    sections: [
      {
        kind: "cards",
        eyebrow: "Partner types",
        title: "Who the program is for",
        items: [
          {
            title: "Referral partners",
            description: "Partners who introduce SwyftUp to businesses that need better customer communication workflows.",
            icon: "partners",
          },
          {
            title: "Implementation partners",
            description: "Agencies and consultants who help customers launch, optimize, and expand the platform over time.",
            icon: "workflow",
          },
          {
            title: "Technology partners",
            description: "Integrators and builders extending the platform through APIs, webhooks, and custom solutions.",
            icon: "code",
          },
        ],
        columns: 3,
      },
      {
        kind: "copy",
        eyebrow: "Why partner",
        title: "Strong partners help customers launch better",
        paragraphs: [
          "SwyftUp is most valuable when it is aligned with real operating needs, which makes strong partners important.",
          "Partners can help clients launch faster, design better routing models, connect internal systems, and improve performance after go-live.",
        ],
      },
      {
        kind: "steps",
        eyebrow: "How it works",
        title: "A simple path into the program",
        items: [
          {
            title: "Apply and describe your model",
            description: "Share how you work with customers and where SwyftUp fits into your practice.",
            icon: "files",
          },
          {
            title: "Align on fit and enablement",
            description: "The SwyftUp team confirms the relationship model, resources, and collaboration path.",
            icon: "team",
          },
          {
            title: "Launch with support",
            description: "Use training, product materials, and shared workflows to support customers more effectively.",
            icon: "check",
          },
        ],
      },
      {
        kind: "copy",
        eyebrow: "Enablement",
        title: "What partners should expect over time",
        paragraphs: [
          "The program includes partner onboarding, co-marketing opportunities, implementation resources, and clear referral or commercial terms.",
          "If the program is early, say that plainly and invite qualified partners to start the conversation now.",
        ],
      },
      {
        kind: "faqs",
        eyebrow: "FAQs",
        title: "Questions potential partners ask",
        items: [
          {
            question: "Who should apply?",
            answer:
              "Agencies, consultants, systems integrators, and referral partners supporting customer communication or operations are strong candidates.",
          },
          {
            question: "What kinds of partnerships are available?",
            answer:
              "Referral, implementation, and technology partnership models are the clearest starting point.",
          },
          {
            question: "Will partners get enablement materials?",
            answer:
              "Yes. The program includes product education, positioning support, and a path for rollout collaboration.",
          },
          {
            question: "Can partners build integrations?",
            answer:
              "Yes. Technical partners can use the integration and developer layers to extend SwyftUp.",
          },
          {
            question: "How do we start?",
            answer:
              "Use the contact flow to begin the conversation while the formal partner program matures.",
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Internal links",
        title: "Pages partners will likely need",
        items: [
          {
            label: "Explore integrations",
            to: "/product/integrations",
            description: "Understand the partner opportunity around connected systems.",
            icon: "integrations",
          },
          {
            label: "Read developer docs",
            to: "/product/developers",
            description: "Review the technical surface for deeper implementation work.",
            icon: "code",
          },
          {
            label: "See case study examples",
            to: "/resources/case-studies",
            description: "Use case study patterns to support partner-led discovery conversations.",
            icon: "files",
          },
          {
            label: "Learn about SwyftUp",
            to: "/about",
            description: "Understand the company story and positioning behind the program.",
            icon: "team",
          },
          {
            label: "Apply to partner",
            to: "/contact",
            description: "Start the conversation directly when there is a fit.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
      {
        kind: "cta",
        eyebrow: "Final CTA",
        title: "If you help businesses improve how they communicate with customers",
        body:
          "There is a strong case for partnering with SwyftUp. Reach out and we can talk through the model that makes the most sense.",
        actions: [
          { label: "Apply to Partner", to: "/contact", variant: "primary" },
          salesAction,
        ],
      },
    ],
  },
  "/privacy": {
    slug: "/privacy",
    metaTitle: "Privacy Policy | SwyftUp",
    metaDescription:
      "Review how SwyftUp collects, uses, stores, and protects information across its website and platform.",
    keywords: [
      "SwyftUp privacy policy",
      "data privacy policy",
      "communication platform privacy",
      "personal data handling",
      "retention policy",
      "privacy rights",
    ],
    hero: {
      eyebrow: "Legal",
      title: "Privacy Policy",
      subtitle:
        "This Privacy Policy summarizes how SwyftUp handles information across the website and product.",
      actions: [
        { label: "Contact Us", to: "/contact", variant: "primary" },
        { label: "Review Security", to: "/product/security", variant: "secondary" },
        { label: "Read the DPA", to: "/dpa", variant: "ghost" },
      ],
      visual: {
        eyebrow: "Policy layout",
        title: "Summary, table of contents, and contact information",
        items: [
          "Use a clear last-updated date at the top.",
          "Keep rights, retention, and contact details easy to find.",
          "Align the published version to actual product behavior and legal review.",
        ],
        footer:
          "Privacy policy layout with summary, table of contents, and contact information.",
      },
    },
    sections: [
      {
        kind: "legal",
        eyebrow: "Privacy details",
        title: "A clear summary of how information is handled",
        notice: "Last updated: March 8, 2026.",
        sections: [
          {
            title: "Information we collect",
            paragraphs: [
              "SwyftUp may collect information users provide directly, such as names, work email addresses, company details, inquiry details, and account information.",
              "The platform and website may also collect usage data needed to operate, secure, and improve the service.",
            ],
          },
          {
            title: "How we use data",
            paragraphs: [
              "Information is used to deliver the service, respond to inquiries, support onboarding, improve product performance, and communicate about account or product matters.",
            ],
          },
          {
            title: "Sharing and retention",
            paragraphs: [
              "Information may be shared with service providers supporting platform operations and with other parties when required by law or business necessity.",
              "Retention is based on operational need, account lifecycle, and configured controls where available.",
            ],
          },
          {
            title: "Your rights and choices",
            paragraphs: [
              "Users can request access, correction, deletion, or communication preference changes through the designated privacy contact method.",
            ],
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Related legal pages",
        title: "Continue your review",
        items: [
          {
            label: "Review security controls",
            to: "/product/security",
            description: "See how permissions, audit visibility, and retention controls support trust.",
            icon: "security",
          },
          {
            label: "Read the DPA",
            to: "/dpa",
            description: "Continue into the customer-facing data processing terms.",
            icon: "files",
          },
          {
            label: "Read the Terms of Service",
            to: "/terms",
            description: "Review account, billing, and acceptable-use terms alongside privacy language.",
            icon: "files",
          },
          {
            label: "Review the Cookie Policy",
            to: "/cookies",
            description: "See how cookies and tracking preferences are described.",
            icon: "files",
          },
          {
            label: "Contact us",
            to: "/contact",
            description: "Bring privacy or procurement questions directly to the team.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
    ],
  },
  "/terms": {
    slug: "/terms",
    metaTitle: "Terms of Service | SwyftUp",
    metaDescription:
      "Read SwyftUp terms covering accounts, billing, acceptable use, intellectual property, and service access.",
    keywords: [
      "SwyftUp terms of service",
      "SaaS terms",
      "service terms",
      "billing terms",
      "acceptable use",
      "legal terms",
    ],
    hero: {
      eyebrow: "Legal",
      title: "Terms of Service",
      subtitle:
        "These Terms of Service outline account use, billing, and service expectations for SwyftUp.",
      actions: [
        { label: "Contact Us", to: "/contact", variant: "primary" },
        { label: "Review Privacy Policy", to: "/privacy", variant: "secondary" },
        { label: "Review Pricing", to: "/pricing", variant: "ghost" },
      ],
      visual: {
        eyebrow: "Terms layout",
        title: "Summary, legal sections, and clear contact information",
        items: [
          "Explain account access, acceptable use, billing, and service changes plainly.",
          "Keep legal review steps and contact routes easy to find.",
          "Make the published page easy to scan for procurement and legal teams.",
        ],
        footer: "Terms page with concise summary, legal sections, and clear contact information.",
      },
    },
    sections: [
      {
        kind: "legal",
        eyebrow: "Terms details",
        title: "A simple framework for service terms",
        notice: "Last updated: March 8, 2026.",
        sections: [
          {
            title: "Accounts and use",
            paragraphs: [
              "Customers are responsible for account access, authorized use, and lawful operation of the service.",
              "Misuse, abuse, spam, or harmful activity is prohibited.",
            ],
          },
          {
            title: "Billing and renewal",
            paragraphs: [
              "Explain payment obligations, renewal or change terms, and what happens when accounts fall out of good standing.",
            ],
          },
          {
            title: "Intellectual property",
            paragraphs: [
              "Clarify that SwyftUp retains rights to the service, while customers retain rights to their own content and data subject to the service terms.",
            ],
          },
          {
            title: "Termination and service changes",
            paragraphs: [
              "Explain that SwyftUp may suspend or terminate access for material breaches or harmful use, and that service features may evolve over time.",
            ],
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Related legal pages",
        title: "Continue your legal review",
        items: [
          {
            label: "Review pricing and billing",
            to: "/pricing",
            description: "Compare commercial framing with the legal terms around service access.",
            icon: "analytics",
          },
          {
            label: "Read the Privacy Policy",
            to: "/privacy",
            description: "Review data handling language alongside service terms.",
            icon: "security",
          },
          {
            label: "Read the DPA",
            to: "/dpa",
            description: "Continue into the privacy and vendor review terms.",
            icon: "files",
          },
          {
            label: "Review security",
            to: "/product/security",
            description: "Pair legal review with the operational trust model behind the platform.",
            icon: "security",
          },
          {
            label: "Contact us",
            to: "/contact",
            description: "Bring legal, procurement, or commercial questions directly to the team.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
    ],
  },
  "/cookies": {
    slug: "/cookies",
    metaTitle: "Cookie Policy | SwyftUp",
    metaDescription:
      "Learn how SwyftUp uses cookies and similar technologies, and how visitors can manage their preferences.",
    keywords: [
      "SwyftUp cookie policy",
      "website cookie policy",
      "tracking preferences",
      "analytics cookies",
      "cookie controls",
      "browser settings",
    ],
    hero: {
      eyebrow: "Legal",
      title: "Cookie Policy",
      subtitle:
        "Explain cookie and tracking behavior in clear, plain language and align the published policy to the site’s actual implementation.",
      actions: [
        { label: "Review Privacy Policy", to: "/privacy", variant: "primary" },
        { label: "Contact Us", to: "/contact", variant: "secondary" },
        helpAction,
      ],
      visual: {
        eyebrow: "Cookie policy",
        title: "Category explanations and preference controls",
        items: [
          "Describe essential, analytics, and functional cookies in plain language.",
          "Explain what changes when non-essential cookies are disabled.",
          "Make preference controls and browser guidance easy to find.",
        ],
        footer:
          "Cookie policy layout with category explanations and preference controls.",
      },
    },
    sections: [
      {
        kind: "legal",
        eyebrow: "Cookie details",
        title: "A clear explanation of how tracking technology is used",
        notice: "Last updated: March 8, 2026.",
        sections: [
          {
            title: "Cookie types",
            paragraphs: [
              "Explain the difference between essential cookies, analytics cookies, and functional or preference cookies in plain language.",
            ],
          },
          {
            title: "How cookies are used",
            paragraphs: [
              "Describe how each category may support site performance, session management, and product improvement.",
            ],
          },
          {
            title: "Managing preferences",
            paragraphs: [
              "Visitors should be able to manage preferences through cookie controls, browser settings, and any other published preference tools.",
            ],
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Related pages",
        title: "Keep the policy connected to the rest of the trust content",
        items: [
          {
            label: "Read the Privacy Policy",
            to: "/privacy",
            description: "Review tracking language alongside the broader privacy model.",
            icon: "security",
          },
          {
            label: "Read the Terms of Service",
            to: "/terms",
            description: "Pair browser and tracking terms with the full service terms.",
            icon: "files",
          },
          {
            label: "Review security",
            to: "/product/security",
            description: "See the operational trust controls behind the product itself.",
            icon: "security",
          },
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "Offer additional support paths when visitors need help finding settings.",
            icon: "help",
          },
          {
            label: "Contact us",
            to: "/contact",
            description: "Provide a path for questions that go beyond the policy text.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
    ],
  },
  "/dpa": {
    slug: "/dpa",
    metaTitle: "Data Processing Addendum | SwyftUp",
    metaDescription:
      "Review the SwyftUp Data Processing Addendum for customer and vendor privacy review.",
    keywords: [
      "SwyftUp data processing addendum",
      "data processing terms",
      "processor obligations",
      "subprocessor information",
      "privacy addendum",
      "data handling agreement",
    ],
    hero: {
      eyebrow: "Legal",
      title: "Data Processing Addendum",
      subtitle:
        "This Data Processing Addendum outlines processing terms used in customer and vendor privacy review.",
      actions: [
        { label: "Contact Us", to: "/contact", variant: "primary" },
        { label: "Review Security", to: "/product/security", variant: "secondary" },
        { label: "Read Privacy Policy", to: "/privacy", variant: "ghost" },
      ],
      visual: {
        eyebrow: "DPA overview",
        title: "Scope, security measures, and legal contact details",
        items: [
          "Explain controller and processor responsibilities plainly.",
          "Reference practical controls like encryption, permissions, audit visibility, and retention.",
          "Provide a path for subprocessor review and signature requests.",
        ],
        footer: "DPA page with scope summary, security measures, and legal contact details.",
      },
    },
    sections: [
      {
        kind: "legal",
        eyebrow: "DPA details",
        title: "A clear vendor review framework",
        notice: "Last updated: March 8, 2026.",
        sections: [
          {
            title: "Scope and roles",
            paragraphs: [
              "Explain the purpose of the DPA, the relationship between customer and provider data responsibilities, and the kinds of processing activities covered by the agreement.",
            ],
          },
          {
            title: "Security measures",
            paragraphs: [
              "Summarize practical controls such as encryption, permissions, audit visibility, and retention settings used to help protect communication data.",
            ],
          },
          {
            title: "Subprocessors",
            paragraphs: [
              "Subprocessor disclosures are available on request and maintained as part of SwyftUp’s customer-facing legal documentation process.",
            ],
          },
          {
            title: "Requests and contact",
            paragraphs: [
              "Explain how customers can request the DPA, review current versions, or ask questions during procurement or security review.",
            ],
          },
        ],
      },
      {
        kind: "links",
        eyebrow: "Related trust pages",
        title: "Continue your vendor review",
        items: [
          {
            label: "Review the Privacy Policy",
            to: "/privacy",
            description: "Review the broader data-handling language alongside the DPA.",
            icon: "security",
          },
          {
            label: "Review security controls",
            to: "/product/security",
            description: "See how the operational trust model supports the legal framework.",
            icon: "security",
          },
          {
            label: "Read the Terms of Service",
            to: "/terms",
            description: "Pair vendor review with the broader service terms.",
            icon: "files",
          },
          {
            label: "Visit the Help Center",
            to: "/help",
            description: "Support customer teams who need more context about setup or admin controls.",
            icon: "help",
          },
          {
            label: "Contact us",
            to: "/contact",
            description: "Request the current DPA or raise legal review questions directly.",
            icon: "calendar",
          },
        ],
        columns: 3,
      },
    ],
  },
};

marketingPages["/solutions/real-estate"].structuredData = buildFaqSchema(realEstateFaqs);

export const marketingPagePaths = [
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

export const marketingNavGroups: NavGroup[] = [
  {
    label: "Product",
    href: "/product",
    items: [
      { label: "Overview", to: "/product", description: "See the full platform in one place." },
      {
        label: "Features",
        to: "/product/features",
        description: "Explore messaging, voice, AI, routing, workflows, and analytics.",
      },
      {
        label: "Integrations",
        to: "/product/integrations",
        description: "Connect SwyftUp to CRM, helpdesk, and internal systems.",
      },
      {
        label: "Security",
        to: "/product/security",
        description: "Review encryption, permissions, audit logs, and retention controls.",
      },
      {
        label: "Developers",
        to: "/product/developers",
        description: "Work with APIs, webhooks, and SDK starter kits.",
      },
    ],
  },
  {
    label: "Solutions",
    items: [
      {
        label: "Real Estate",
        to: "/solutions/real-estate",
        description: "Capture listing inquiries and route by office or agent.",
      },
      {
        label: "Ecommerce",
        to: "/solutions/ecommerce",
        description: "Support shoppers before and after checkout.",
      },
      {
        label: "Professional Services",
        to: "/solutions/professional-services",
        description: "Handle intake and follow-up for firms selling expertise.",
      },
      {
        label: "Healthcare",
        to: "/solutions/healthcare",
        description: "Manage non-emergency patient-facing communication more clearly.",
      },
      {
        label: "Education",
        to: "/solutions/education",
        description: "Route student and admissions questions to the right team.",
      },
      {
        label: "Local Business",
        to: "/solutions/local-business",
        description: "Run location-aware communication across bookings, quotes, and service.",
      },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
  {
    label: "Resources",
    items: [
      { label: "Blog", to: "/blog", description: "Read insights on customer communication and operations." },
      { label: "Guides", to: "/resources/guides", description: "Use rollout playbooks and templates." },
      {
        label: "Case Studies",
        to: "/resources/case-studies",
        description: "See how customers improve response time and handoffs.",
      },
      {
        label: "Changelog",
        to: "/resources/changelog",
        description: "Track product updates across messaging, voice, and routing.",
      },
      { label: "Help Center", to: "/help", description: "Find setup help, troubleshooting, and admin docs." },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", to: "/about", description: "Learn why SwyftUp exists." },
      { label: "Contact", to: "/contact", description: "Talk to sales or ask rollout questions." },
      { label: "Careers", to: "/careers", description: "Explore team culture and current or upcoming roles." },
      { label: "Partners", to: "/partners", description: "Apply as a referral, implementation, or technology partner." },
    ],
  },
];

export const footerGroups = [
  {
    label: "Product",
    items: [
      { label: "Product", to: "/product" },
      { label: "Features", to: "/product/features" },
      { label: "Integrations", to: "/product/integrations" },
      { label: "Security", to: "/product/security" },
      { label: "Developers", to: "/product/developers" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "Real Estate", to: "/solutions/real-estate" },
      { label: "Ecommerce", to: "/solutions/ecommerce" },
      { label: "Professional Services", to: "/solutions/professional-services" },
      { label: "Healthcare", to: "/solutions/healthcare" },
      { label: "Education", to: "/solutions/education" },
      { label: "Local Business", to: "/solutions/local-business" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Blog", to: "/blog" },
      { label: "Guides", to: "/resources/guides" },
      { label: "Case Studies", to: "/resources/case-studies" },
      { label: "Changelog", to: "/resources/changelog" },
      { label: "Help Center", to: "/help" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Careers", to: "/careers" },
      { label: "Partners", to: "/partners" },
    ],
  },
  {
    label: "Legal",
    items: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Cookies", to: "/cookies" },
      { label: "DPA", to: "/dpa" },
    ],
  },
];

export const legacyRedirects = [
  { from: "solutions", to: "/solutions/real-estate" },
  { from: "resources", to: "/blog" },
  { from: "book-demo", to: "/contact" },
] as const;

export function getMarketingPage(pathname: string) {
  return marketingPages[pathname];
}
