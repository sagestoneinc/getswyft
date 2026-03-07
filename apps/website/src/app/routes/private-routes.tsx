import type { RouteObject } from "react-router";
import { AppLayout } from "../components/app/app-layout";
import { LoginPage } from "../components/app/login-page";
import { InboxPage } from "../components/app/inbox-page";
import { ConversationPage } from "../components/app/conversation-page";
import { RoutingPage } from "../components/app/routing-page";
import { WebhooksPage } from "../components/app/webhooks-page";
import { AnalyticsPage } from "../components/app/analytics-page";
import { TeamPage } from "../components/app/team-page";
import { BillingPage } from "../components/app/billing-page";
import { ProfilePage } from "../components/app/profile-page";
import { NotificationsPage } from "../components/app/notifications-page";
import { AiPage } from "../components/app/ai-page";
import { ModerationPage } from "../components/app/moderation-page";
import { AuditPage } from "../components/app/audit-page";
import { CollaborationPage } from "../components/app/collaboration-page";

export const privateRoutes: RouteObject[] = [
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
      { path: "notifications", Component: NotificationsPage },
      { path: "ai", Component: AiPage },
      { path: "moderation", Component: ModerationPage },
      { path: "audit", Component: AuditPage },
      { path: "collaboration", Component: CollaborationPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
];
