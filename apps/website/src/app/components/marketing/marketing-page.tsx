import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  FileStack,
  Globe2,
  GraduationCap,
  Handshake,
  HeartPulse,
  LifeBuoy,
  Link2,
  MapPinHouse,
  MessageSquare,
  MessagesSquare,
  Route,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  Workflow,
  PhoneCall,
  Code2,
} from "lucide-react";
import {
  getMarketingPage,
  type IconName,
  type MarketingAction,
  type MarketingCardItem,
  type MarketingFaq,
  type MarketingFormField,
  type MarketingHero,
  type MarketingLegalEntry,
  type MarketingLinkItem,
  type MarketingPage,
  type MarketingPageSection,
  type MarketingPricingPlan,
  type MarketingPricingRow,
  type MarketingResourceItem,
  type MarketingStepItem,
  type MarketingTestimonial,
  type MarketingVisualSlide,
} from "../../content/marketing-content";
import { cn } from "../ui/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";

const iconMap: Record<IconName, LucideIcon> = {
  analytics: BarChart3,
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  building: Building2,
  calendar: CalendarClock,
  cart: ShoppingCart,
  chat: MessagesSquare,
  check: ShieldCheck,
  clock: CalendarClock,
  code: Code2,
  education: GraduationCap,
  files: FileStack,
  globe: Globe2,
  health: HeartPulse,
  help: LifeBuoy,
  integrations: Link2,
  link: Link2,
  local: MapPinHouse,
  message: MessageSquare,
  partners: Handshake,
  routing: Route,
  security: ShieldCheck,
  sparkles: Sparkles,
  team: Users,
  voice: PhoneCall,
  workflow: Workflow,
};

type FormState = Record<string, string>;
type FormErrors = Record<string, string>;

function ActionButton({
  action,
  className,
}: {
  action: MarketingAction;
  className?: string;
}) {
  const variant = action.variant ?? "primary";
  const classes =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent/90"
      : variant === "secondary"
        ? "bg-primary text-white hover:bg-primary/90"
        : "border border-border bg-white/70 text-primary hover:border-accent/40 hover:text-accent";

  return (
    <Link
      to={action.to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors",
        classes,
        className,
      )}
      style={{ fontWeight: 600 }}
    >
      <span>{action.label}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Eyebrow({ children }: { children?: string }) {
  if (!children) {
    return null;
  }

  return (
    <p
      className="mb-3 text-xs uppercase tracking-[0.18em] text-accent"
      style={{ fontWeight: 700 }}
    >
      {children}
    </p>
  );
}

function SectionFrame({
  eyebrow,
  title,
  intro,
  children,
  muted = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={cn("py-16 sm:py-20", muted ? "bg-[#f5fbfb]" : "bg-white")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2
            className="text-3xl text-primary sm:text-4xl"
            style={{ fontWeight: 700, lineHeight: 1.15 }}
          >
            {title}
          </h2>
          {intro ? <p className="mt-4 text-base text-muted-foreground">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function Hero({ hero }: { hero: MarketingHero }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_35%),linear-gradient(135deg,#0f2744_0%,#16375e_58%,#114a5c_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-[72px] sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:py-24 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1
            className="text-4xl text-white sm:text-5xl lg:text-6xl"
            style={{ fontWeight: 800, lineHeight: 1.02 }}
          >
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/78 sm:text-xl">{hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {hero.actions.map((action) => (
              <ActionButton
                key={`${action.label}-${action.to}`}
                action={action}
                className={action.variant === "ghost" ? "bg-white/10 text-white border-white/20 hover:bg-white/15 hover:text-white" : undefined}
              />
            ))}
          </div>
          {hero.stats?.length ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {hero.stats.map((stat) => (
                <div
                  key={`${stat.label}-${stat.value}`}
                  className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4 backdrop-blur"
                >
                  <p className="text-base text-white" style={{ fontWeight: 700 }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-white/65">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 text-white shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>{hero.visual.eyebrow}</Eyebrow>
              <h2 className="text-2xl text-white" style={{ fontWeight: 700, lineHeight: 1.15 }}>
                {hero.visual.title}
              </h2>
            </div>
            <div className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs text-accent">
              Live preview
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {hero.visual.items.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
              >
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm leading-6 text-white/80">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-[#08182a]/55 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/50">Product preview</p>
            <p className="mt-2 text-sm leading-6 text-white/72">{hero.visual.footer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CopySection({
  title,
  eyebrow,
  paragraphs,
  action,
  muted,
}: {
  title: string;
  eyebrow?: string;
  paragraphs: string[];
  action?: MarketingAction;
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} muted={muted}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="space-y-5">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
        {action ? (
          <div className="self-start rounded-3xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm leading-6 text-muted-foreground">
              Want to go deeper on this topic?
            </p>
            <ActionButton action={action} className="mt-4 w-full" />
          </div>
        ) : null}
      </div>
    </SectionFrame>
  );
}

function ListSection({
  title,
  eyebrow,
  intro,
  items,
  columns = 2,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  items: string[];
  columns?: 2 | 3;
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div className={cn("grid gap-4", columns === 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-border bg-white px-5 py-5 shadow-sm"
          >
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Check className="h-4 w-4" />
            </span>
            <p className="text-sm leading-7 text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function StepCard({ item, index }: { item: MarketingStepItem; index: number }) {
  const Icon = iconMap[item.icon];

  return (
    <div className="relative rounded-[24px] border border-border bg-white p-6 shadow-sm">
      <div className="absolute right-5 top-5 text-sm text-muted-foreground/50">
        {String(index + 1).padStart(2, "0")}
      </div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-xl text-primary" style={{ fontWeight: 650 }}>
        {item.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
    </div>
  );
}

function StepsSection({
  title,
  eyebrow,
  intro,
  items,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  items: MarketingStepItem[];
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <StepCard key={`${item.title}-${index}`} item={item} index={index} />
        ))}
      </div>
    </SectionFrame>
  );
}

function Card({
  item,
  linked,
}: {
  item: MarketingCardItem;
  linked?: boolean;
}) {
  const Icon = iconMap[item.icon];
  const content = (
    <div className="flex h-full flex-col rounded-[24px] border border-border bg-white p-6 shadow-sm transition-transform duration-150 hover:-translate-y-0.5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      {item.eyebrow ? (
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-accent">{item.eyebrow}</p>
      ) : null}
      <h3 className="mt-4 text-xl text-primary" style={{ fontWeight: 650 }}>
        {item.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{item.description}</p>
      {item.meta ? <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">{item.meta}</p> : null}
      {item.to ? (
        <span className="mt-5 inline-flex items-center gap-2 text-sm text-accent" style={{ fontWeight: 650 }}>
          Learn more <ChevronRight className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  );

  return item.to ? (
    <Link to={item.to} className={linked ? "block h-full" : "pointer-events-none block h-full"}>
      {content}
    </Link>
  ) : (
    content
  );
}

function CardsSection({
  title,
  eyebrow,
  intro,
  items,
  columns = 3,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  items: MarketingCardItem[];
  columns?: 2 | 3 | 4;
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div
        className={cn(
          "grid gap-5",
          columns === 2 ? "md:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <Card key={`${item.title}-${item.to ?? item.description}`} item={item} linked={Boolean(item.to)} />
        ))}
      </div>
    </SectionFrame>
  );
}

function VisualSlide({
  slide,
}: {
  slide: MarketingVisualSlide;
}) {
  const checklist = slide.items?.length ? slide.items : [slide.description];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm">
        <h3 className="text-2xl text-primary" style={{ fontWeight: 700 }}>
          {slide.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{slide.description}</p>
        <div className="mt-6 space-y-3">
          {checklist.map((item) => (
            <div key={`${slide.title}-${item}`} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Check className="h-4 w-4" />
              </span>
              <p className="text-sm leading-7 text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] border border-border bg-white p-5 shadow-sm">
        {slide.imageSrc ? (
          <figure>
            <img
              src={slide.imageSrc}
              alt={slide.imageAlt ?? slide.title}
              loading="lazy"
              decoding="async"
              className="h-[280px] w-full rounded-2xl border border-border object-cover"
            />
            <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{slide.caption}</figcaption>
          </figure>
        ) : (
          <div className="h-full rounded-2xl border border-border bg-[linear-gradient(135deg,#f8fcfc_0%,#edf7f7_100%)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-primary" style={{ fontWeight: 700 }}>
                Workflow preview
              </p>
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
                Live view
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div
                  key={`${slide.caption}-${item}`}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{slide.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VisualGallerySection({
  title,
  eyebrow,
  intro,
  slides,
  action,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  slides: MarketingVisualSlide[];
  action?: MarketingAction;
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div className="rounded-[30px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <Carousel opts={{ align: "start", loop: false }} className="pb-14">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={`${slide.title}-${slide.caption}`}>
                <VisualSlide slide={slide} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {slides.length > 1 ? (
            <>
              <CarouselPrevious className="bottom-2 left-2 top-auto -translate-y-0 border-border bg-white text-primary hover:bg-[#f3fbfb]" />
              <CarouselNext className="bottom-2 left-12 right-auto top-auto -translate-y-0 border-border bg-white text-primary hover:bg-[#f3fbfb]" />
            </>
          ) : null}
        </Carousel>
      </div>
      {action ? (
        <div className="mt-6">
          <ActionButton action={action} />
        </div>
      ) : null}
    </SectionFrame>
  );
}

function PricingPlanCard({ plan }: { plan: MarketingPricingPlan }) {
  return (
    <div
      className={cn(
        "relative rounded-[28px] border bg-white p-7 shadow-sm",
        plan.highlight ? "border-accent shadow-accent/10 ring-1 ring-accent/40" : "border-border",
      )}
    >
      {plan.highlight ? (
        <div className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs text-white">
          {plan.highlight}
        </div>
      ) : null}
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{plan.bestFor}</p>
      <h3 className="mt-3 text-2xl text-primary" style={{ fontWeight: 700 }}>
        {plan.name}
      </h3>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl text-primary" style={{ fontWeight: 800 }}>
          {plan.price}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{plan.description}</p>
      <Link
        to="/contact"
        className={cn(
          "mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
          plan.highlight ? "bg-accent text-white hover:bg-accent/90" : "bg-primary text-white hover:bg-primary/90",
        )}
        style={{ fontWeight: 650 }}
      >
        {plan.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <div className="mt-6 space-y-3 border-t border-border pt-6">
        {plan.included.map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="leading-6 text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingSection({
  title,
  eyebrow,
  intro,
  plans,
  matrix,
  footnote,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  plans: MarketingPricingPlan[];
  matrix?: MarketingPricingRow[];
  footnote?: string;
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div className="grid gap-5 xl:grid-cols-4">
        {plans.map((plan) => (
          <PricingPlanCard key={plan.name} plan={plan} />
        ))}
      </div>
      {matrix?.length ? (
        <div className="mt-10 overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-[#f8fcfc]">
                <tr>
                  <th className="px-6 py-4 text-sm text-primary" style={{ fontWeight: 700 }}>
                    Capability
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="px-6 py-4 text-sm text-primary" style={{ fontWeight: 700 }}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrix.map((row) => (
                  <tr key={row.label}>
                    <td className="px-6 py-4 text-sm text-primary" style={{ fontWeight: 600 }}>
                      {row.label}
                    </td>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="px-6 py-4 text-sm text-muted-foreground">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {footnote ? <p className="mt-4 text-sm text-muted-foreground">{footnote}</p> : null}
    </SectionFrame>
  );
}

function ResourceCard({ item }: { item: MarketingResourceItem }) {
  const Icon = iconMap[item.icon];

  return (
    <Link
      to={item.to}
      className="block rounded-[24px] border border-border bg-white p-6 shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.meta}</p>
      <h3 className="mt-3 text-xl text-primary" style={{ fontWeight: 650 }}>
        {item.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm text-accent" style={{ fontWeight: 650 }}>
        Open <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function ResourcesSection({
  title,
  eyebrow,
  intro,
  chips,
  searchPlaceholder,
  items,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  chips?: string[];
  searchPlaceholder?: string;
  items: MarketingResourceItem[];
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      {searchPlaceholder ? (
        <div className="mb-6 rounded-[22px] border border-border bg-white px-4 py-4 shadow-sm">
          <input
            type="search"
            readOnly
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-muted-foreground outline-none"
          />
        </div>
      ) : null}
      {chips?.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground"
              style={{ fontWeight: 600 }}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ResourceCard key={`${item.title}-${item.to}`} item={item} />
        ))}
      </div>
    </SectionFrame>
  );
}

function LogoStrip({ logosText, logos }: { logosText?: string; logos?: string[] }) {
  return (
    <div>
      {logosText ? <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{logosText}</p> : null}
      {logos?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {logos.map((logo) => (
            <div
              key={logo}
              className="rounded-2xl border border-border bg-white px-4 py-4 text-center text-sm text-primary shadow-sm"
              style={{ fontWeight: 650 }}
            >
              {logo}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: MarketingTestimonial }) {
  return (
    <div className="rounded-[26px] border border-border bg-white p-6 shadow-sm">
      <p className="text-sm leading-7 text-muted-foreground">"{testimonial.quote}"</p>
      <div className="mt-6">
        <p className="text-sm text-primary" style={{ fontWeight: 700 }}>
          {testimonial.name}
        </p>
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{testimonial.role}</p>
      </div>
    </div>
  );
}

function SocialProofSection({
  title,
  eyebrow,
  intro,
  logosText,
  logos,
  testimonials,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  logosText?: string;
  logos?: string[];
  testimonials: MarketingTestimonial[];
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <LogoStrip logosText={logosText} logos={logos} />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <TestimonialCard
            key={`${testimonial.name}-${testimonial.role}`}
            testimonial={testimonial}
          />
        ))}
      </div>
    </SectionFrame>
  );
}

function validateField(field: MarketingFormField, value: string) {
  const trimmedValue = value.trim();

  if (field.required && !trimmedValue) {
    return field.helper ?? "This field can't be left blank.";
  }

  if (field.type === "email" && trimmedValue) {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);
    if (!emailValid) {
      return field.helper ?? "Please enter a valid work email address.";
    }
  }

  if (field.type === "url" && trimmedValue) {
    try {
      new URL(trimmedValue);
    } catch {
      return field.helper ?? "Please check the format and try again.";
    }
  }

  return "";
}

function ContactFormSection({
  title,
  eyebrow,
  intro,
  expectations,
  fields,
  privacyNote,
  submitLabel,
  successMessage,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  expectations?: string[];
  fields: MarketingFormField[];
  privacyNote: string;
  submitLabel: string;
  successMessage: string;
  muted?: boolean;
}) {
  const [values, setValues] = useState<FormState>(() =>
    fields.reduce<FormState>((state, field) => {
      state[field.name] = "";
      return state;
    }, {}),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const groupedFields = useMemo(
    () => fields.filter((field) => field.type !== "textarea"),
    [fields],
  );

  function handleChange(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = fields.reduce<FormErrors>((state, field) => {
      const nextError = validateField(field, values[field.name] ?? "");
      if (nextError) {
        state[field.name] = nextError;
      }
      return state;
    }, {});

    setErrors(nextErrors);
    setSubmitted(Object.keys(nextErrors).length === 0);
  }

  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] border border-border bg-[#f8fcfc] p-6 shadow-sm">
          <h3 className="text-xl text-primary" style={{ fontWeight: 700 }}>
            What to expect
          </h3>
          <div className="mt-5 space-y-4">
            {expectations?.map((expectation) => (
              <div key={expectation} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm leading-7 text-muted-foreground">{expectation}</p>
              </div>
            ))}
          </div>
        </div>
        <form
          className="rounded-[28px] border border-border bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid gap-5 md:grid-cols-2">
            {groupedFields.map((field) => (
              <div
                key={field.name}
                className={cn(
                  field.type === "textarea" ? "md:col-span-2" : "",
                )}
              >
                <label className="block text-sm text-primary" style={{ fontWeight: 600 }}>
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={values[field.name] ?? ""}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent/50"
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type ?? "text"}
                    value={values[field.name] ?? ""}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    className="mt-2 w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent/50"
                  />
                )}
                {field.name === "workEmail" && !errors[field.name] ? (
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    A business email helps us route your request faster.
                  </p>
                ) : null}
                {errors[field.name] ? (
                  <p className="mt-2 text-xs leading-6 text-destructive">{errors[field.name]}</p>
                ) : null}
              </div>
            ))}
            {fields
              .filter((field) => field.type === "textarea")
              .map((field) => (
                <div key={field.name} className="md:col-span-2">
                  <label className="block text-sm text-primary" style={{ fontWeight: 600 }}>
                    {field.label}
                  </label>
                  <textarea
                    rows={field.name === "useCase" ? 4 : 3}
                    value={values[field.name] ?? ""}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-input-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent/50"
                  />
                  {errors[field.name] ? (
                    <p className="mt-2 text-xs leading-6 text-destructive">{errors[field.name]}</p>
                  ) : null}
                </div>
              ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">{privacyNote}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm text-white hover:bg-accent/90"
              style={{ fontWeight: 650 }}
            >
              {submitLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            {submitted ? (
              <p className="text-sm leading-6 text-primary">{successMessage}</p>
            ) : null}
          </div>
        </form>
      </div>
    </SectionFrame>
  );
}

function LegalSection({
  title,
  eyebrow,
  intro,
  notice,
  sections,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  notice?: string;
  sections: MarketingLegalEntry[];
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      {notice ? (
        <div className="mb-6 rounded-2xl border border-border bg-[#f8fcfc] px-5 py-4 text-sm text-muted-foreground shadow-sm">
          {notice}
        </div>
      ) : null}
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title} className="rounded-[24px] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-xl text-primary" style={{ fontWeight: 700 }}>
              {section.title}
            </h3>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function FaqRow({ faq }: { faq: MarketingFaq }) {
  return (
    <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm">
      <h3 className="text-lg text-primary" style={{ fontWeight: 700 }}>
        {faq.question}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
    </div>
  );
}

function FaqSection({
  title,
  eyebrow,
  items,
  muted,
}: {
  title: string;
  eyebrow?: string;
  items: MarketingFaq[];
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} muted={muted}>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((faq) => (
          <FaqRow key={faq.question} faq={faq} />
        ))}
      </div>
    </SectionFrame>
  );
}

function LinkCard({ item }: { item: MarketingLinkItem }) {
  const Icon = item.icon ? iconMap[item.icon] : ArrowRight;

  return (
    <Link
      to={item.to}
      className="block rounded-[24px] border border-border bg-white p-6 shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-xl text-primary" style={{ fontWeight: 650 }}>
        {item.label}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm text-accent" style={{ fontWeight: 650 }}>
        Visit page <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function LinksSection({
  title,
  eyebrow,
  intro,
  items,
  columns = 3,
  muted,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  items: MarketingLinkItem[];
  columns?: 2 | 3;
  muted?: boolean;
}) {
  return (
    <SectionFrame eyebrow={eyebrow} title={title} intro={intro} muted={muted}>
      <div className={cn("grid gap-5", columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>
        {items.map((item) => (
          <LinkCard key={`${item.label}-${item.to}`} item={item} />
        ))}
      </div>
    </SectionFrame>
  );
}

function CtaSection({
  title,
  eyebrow,
  body,
  actions,
  muted,
}: {
  title: string;
  eyebrow?: string;
  body: string;
  actions: MarketingAction[];
  muted?: boolean;
}) {
  return (
    <section className={cn("py-16 sm:py-20", muted ? "bg-[#f5fbfb]" : "bg-white")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_30%),linear-gradient(135deg,#0f2744_0%,#143d59_100%)] px-6 py-8 text-white shadow-2xl shadow-primary/10 sm:px-10 sm:py-10">
          <Eyebrow>{eyebrow}</Eyebrow>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <h2 className="text-3xl text-white sm:text-4xl" style={{ fontWeight: 800, lineHeight: 1.08 }}>
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/78">{body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              {actions.map((action) => (
                <ActionButton
                  key={`${action.label}-${action.to}`}
                  action={action}
                  className={
                    action.variant === "secondary"
                      ? "bg-white text-primary hover:bg-white/92"
                      : action.variant === "ghost"
                        ? "border-white/20 bg-white/10 text-white hover:bg-white/14"
                        : "bg-accent text-white hover:bg-accent/90"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderSection(section: MarketingPageSection, index: number) {
  const muted = index % 2 === 1;

  switch (section.kind) {
    case "copy":
      return <CopySection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "list":
      return <ListSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "steps":
      return <StepsSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "cards":
      return <CardsSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "visualGallery":
      return <VisualGallerySection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "pricing":
      return <PricingSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "resources":
      return <ResourcesSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "socialProof":
      return <SocialProofSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "form":
      return <ContactFormSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "legal":
      return <LegalSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "faqs":
      return <FaqSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "links":
      return <LinksSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    case "cta":
      return <CtaSection key={`${section.kind}-${section.title}`} muted={muted} {...section} />;
    default:
      return null;
  }
}

function MarketingPageView({ page }: { page: MarketingPage }) {
  return (
    <div className="bg-[#fcfefe]">
      <Hero hero={page.hero} />
      {page.sections.map((section, index) => renderSection(section, index))}
    </div>
  );
}

export function MarketingPageRoute() {
  const location = useLocation();
  const page = getMarketingPage(location.pathname);

  if (!page) {
    return null;
  }

  return <MarketingPageView page={page} />;
}
