import type { RouteObject } from "react-router";
import { MarketingLayout } from "../components/marketing/marketing-layout";
import { HomePage } from "../components/marketing/home-page";
import { ProductPage } from "../components/marketing/product-page";
import { SolutionsPage } from "../components/marketing/solutions-page";
import { PricingPage } from "../components/marketing/pricing-page";
import { AboutPage } from "../components/marketing/about-page";
import { ContactPage } from "../components/marketing/contact-page";
import { PrivacyPage } from "../components/marketing/privacy-page";
import { TermsPage } from "../components/marketing/terms-page";

export const marketingRoutes: RouteObject[] = [
  {
    path: "/",
    Component: MarketingLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "product", Component: ProductPage },
      { path: "solutions", Component: SolutionsPage },
      { path: "pricing", Component: PricingPage },
      { path: "about", Component: AboutPage },
      { path: "contact", Component: ContactPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "terms", Component: TermsPage },
    ],
  },
];
