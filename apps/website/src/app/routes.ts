import { createBrowserRouter } from "react-router";
import { MarketingLayout } from "./components/marketing/marketing-layout";
import { HomePage } from "./components/marketing/home-page";
import { ProductPage } from "./components/marketing/product-page";
import { SolutionsPage } from "./components/marketing/solutions-page";
import { PricingPage } from "./components/marketing/pricing-page";
import { AboutPage } from "./components/marketing/about-page";
import { ContactPage } from "./components/marketing/contact-page";
import { PrivacyPage } from "./components/marketing/privacy-page";
import { TermsPage } from "./components/marketing/terms-page";
import { AppLayout } from "./components/app/app-layout";
import { LoginPage } from "./components/app/login-page";
import { InboxPage } from "./components/app/inbox-page";
import { ConversationPage } from "./components/app/conversation-page";
import { RoutingPage } from "./components/app/routing-page";
import { WebhooksPage } from "./components/app/webhooks-page";
import { AnalyticsPage } from "./components/app/analytics-page";
import { TeamPage } from "./components/app/team-page";
import { BillingPage } from "./components/app/billing-page";
import { ProfilePage } from "./components/app/profile-page";
import { WidgetDemo } from "./components/widget/widget-demo";

export const router = createBrowserRouter([
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
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: InboxPage },
      { path: "inbox", Component: InboxPage },
      { path: "conversation/:id", Component: ConversationPage },
      { path: "routing", Component: RoutingPage },
      { path: "webhooks", Component: WebhooksPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "team", Component: TeamPage },
      { path: "billing", Component: BillingPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
  {
    path: "/widget-demo",
    Component: WidgetDemo,
  },
]);
