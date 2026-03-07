# Platform Overview

Getswyft is a multi-tenant SaaS communications platform purpose-built for real estate professionals. It connects tenant organizations, their agents, and property-listing visitors through real-time messaging, voice calling, and AI-powered automation — all from a single platform.

---

## What Getswyft Is

Getswyft gives real estate teams a unified communications hub. Agents respond to visitor inquiries from listing pages, manage ongoing conversations across channels, and collaborate with their team — while tenant administrators control routing, team membership, billing, webhooks, analytics, and compliance from a central dashboard.

Key capabilities include:

- **Real-time messaging** between agents and visitors, with support for attachments, reactions, and notes
- **Voice calling** integrated directly into conversation threads
- **Embeddable visitor widget** that property websites drop onto listing pages so visitors can start conversations instantly
- **AI-powered tools** for chatbot responses, conversation summarization, content moderation, agent assist, and voice-bot interactions
- **Multi-tenant architecture** where each organization operates in an isolated tenant with its own team, settings, and data

---

## Who Uses It

Getswyft serves three distinct user roles:

| Role | Access Point | What They Do |
|------|-------------|--------------|
| **Tenant Admin** | Website dashboard (`/app/*`) | Manages the organization: team setup, routing rules, webhooks, analytics, billing, moderation, compliance, and AI configuration |
| **Agent** | Website dashboard and Agent console | Handles day-to-day conversations: picks up visitor inquiries, sends messages, creates channels, makes calls, monitors the feed, and manages their profile |
| **Visitor** | Embedded widget on listing pages | Initiates conversations with agents by chatting through the widget on a property listing page |

### Tenant Admin

Tenant Admins have full platform management access. They configure how conversations are routed to agents, invite and manage team members, set up webhook integrations with external systems, review analytics dashboards, manage billing and subscriptions, and enforce moderation and compliance policies. Tenant Admins access these features through the sidebar navigation items marked with an **Admin** badge: Routing, Webhooks, Analytics, Team, and Billing.

### Agent

Agents are the front-line users who communicate with visitors and leads. They view their inbox (with Unassigned, Mine, and Closed tabs), pick up conversations, send messages with attachments and reactions, use channels for team communication, make voice calls, and check the activity feed. Agents manage their own profile settings including name, phone number, timezone, and locale.

### Visitor

Visitors are anonymous or identified users browsing property listings on a real estate website. When the Getswyft widget is embedded on a listing page, visitors can open it to start a conversation with an available agent. The widget handles session creation, real-time messaging, and after-hours detection — notifying the visitor when agents are unavailable.

---

## Platform Components

Getswyft is made up of five components that work together:

### Website Dashboard

The primary web application for Tenant Admins and Agents. Built with React and TypeScript, it provides:

- **Login** (`/login`) — multi-provider authentication (email/password, Google, Azure)
- **Inbox** (`/app/inbox`) — conversation list with Unassigned, Mine, and Closed tabs, plus search
- **Conversation View** (`/app/conversation/:id`) — message thread with reactions, attachments, calling, notes, and transfer
- **Routing** (`/app/routing`) — routing mode, office hours, timezone, fallback agent configuration
- **Webhooks** (`/app/webhooks`) — webhook CRUD, event type selection, test delivery, delivery logs
- **Analytics** (`/app/analytics`) — KPI cards, conversation volume charts, response time metrics, lead source breakdowns
- **Team** (`/app/team`) — member list, pending invitations, role management
- **Billing** (`/app/billing`) — subscription details, invoices, seat-based pricing
- **Profile** (`/app/profile`) — personal settings (name, phone, timezone, locale)

### Agent Console

A lightweight React + Vite runtime shell optimized for agents. It provides login, an inbox with conversation tabs, a chat view for active conversations, and routing settings — giving agents a focused interface for their daily workflow.

### Visitor Widget

An embeddable React + Vite application that property websites include on their listing pages. When a visitor opens the widget, it creates a session, enables real-time messaging with an available agent, and detects after-hours periods to display appropriate messaging.

### API Backend

A JavaScript (ES modules) Express + Socket.IO server that powers all platform functionality. It connects to PostgreSQL (via Prisma ORM) for persistent data and Redis for caching and real-time pub/sub. The API is organized into 15 modules:

| Module | Purpose |
|--------|---------|
| auth | Authentication and session management |
| tenants | Tenant configuration and settings |
| users | User accounts and profiles |
| messaging | Message send, receive, and thread management |
| channels | Channel creation and membership |
| calling | Voice call initiation and management |
| feed | Activity feed entries |
| moderation | Content moderation reports and actions |
| compliance | Compliance policy enforcement |
| ai | Chatbot, summarization, moderation, agent assist, voice-bot |
| notifications | In-app and push notification delivery |
| storage | File upload and attachment management |
| analytics | Metrics aggregation and dashboard data |
| audit | Audit log recording |
| presence | Real-time online/offline status (Socket.IO) |

### Shared Contracts

A TypeScript package (`packages/shared`) containing shared type definitions and permission constants used by both the frontend applications and the API backend. This ensures type safety and consistent permission enforcement across the entire platform.

---

## Main User Journeys

### Tenant Admin Journey

1. **Set up the team** — Invite agents and staff from the Team page, assign roles (Tenant Admin or Agent), and manage pending invitations
2. **Configure routing** — Choose a routing mode, define office hours with timezone, and designate a fallback agent for overflow or after-hours conversations
3. **Manage webhooks** — Create webhooks pointing to external systems, select which event types to subscribe to, test delivery, and monitor delivery logs
4. **Monitor analytics** — Review KPI cards (total conversations, average response time, lead sources), view conversation volume over time, and identify performance trends
5. **Handle billing** — View the current subscription, check invoices, and manage seat-based pricing as the team grows

### Agent Journey

1. **Log in** — Authenticate via email/password, Google, or Azure on the login page
2. **View the inbox** — See all conversations organized into Unassigned, Mine, and Closed tabs; use search to find specific conversations
3. **Pick up conversations** — Select an unassigned conversation to claim it and begin responding
4. **Send messages** — Type and send messages within the conversation thread; add attachments, react to messages, leave internal notes, or transfer the conversation to another agent
5. **Use channels** — Join or create channels for internal team communication outside of visitor conversations
6. **Make calls** — Initiate a voice call directly from a conversation thread
7. **Check the feed** — Review the activity feed for recent events and updates across conversations

### Visitor Journey

1. **Visit a listing page** — A visitor navigates to a property listing on a real estate website that has the Getswyft widget installed
2. **Widget opens** — The embedded widget appears, ready for the visitor to start a conversation
3. **Start a conversation** — The visitor types a message; the widget creates a session and connects them to an available agent
4. **Chat with an agent** — Real-time messages flow between the visitor and the assigned agent
5. **Receive after-hours notice** — If no agents are available (outside office hours), the widget displays an after-hours message and may collect the visitor's contact information for follow-up

---

## Architecture Overview

Getswyft follows a client-server architecture where multiple frontend applications communicate with a single API backend:

- The **Website Dashboard**, **Agent Console**, and **Visitor Widget** are separate frontend applications that each connect to the **API Backend** over HTTPS and WebSocket (Socket.IO) connections.
- The **API Backend** handles all business logic, authentication, authorization, and data persistence. It reads and writes data to **PostgreSQL** and uses **Redis** for caching, session management, and real-time event pub/sub.
- **Socket.IO** provides the real-time layer — pushing new messages, presence updates, and notifications to connected clients without polling.
- The **Shared Contracts** package is consumed at build time by the frontend apps and the API to keep TypeScript types and permission constants in sync.

Each tenant's data is logically isolated within the same database, ensuring that one organization's conversations, users, and settings are never visible to another.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Dashboard) | React, TypeScript |
| Frontend (Agent Console) | React, Vite, TypeScript |
| Frontend (Widget) | React, Vite, TypeScript |
| API Server | Express, Socket.IO, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache / Pub-Sub | Redis |
| Shared Contracts | TypeScript (monorepo package) |
| Package Manager | pnpm (workspace monorepo) |
