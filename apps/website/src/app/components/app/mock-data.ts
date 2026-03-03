export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  utm?: string;
}

export interface Listing {
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  mls: string;
}

export interface Message {
  id: string;
  sender: "visitor" | "agent";
  text: string;
  time: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  lead: Lead;
  listing: Listing;
  lastMessage: string;
  lastTime: string;
  status: "unassigned" | "mine" | "closed";
  assignedTo?: string;
  afterHours: boolean;
  messages: Message[];
  notes: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: "agent" | "admin";
  status: "online" | "offline" | "busy";
  conversations: number;
  avatar?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  createdAt: string;
}

export interface DeliveryLog {
  id: string;
  endpointId: string;
  event: string;
  status: "success" | "failed" | "pending";
  timestamp: string;
  statusCode?: number;
}

export const agents: Agent[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@pinnacle.com", role: "admin", status: "online", conversations: 8 },
  { id: "2", name: "Marcus Johnson", email: "marcus@pinnacle.com", role: "agent", status: "online", conversations: 5 },
  { id: "3", name: "Emily Rodriguez", email: "emily@pinnacle.com", role: "agent", status: "busy", conversations: 12 },
  { id: "4", name: "David Kim", email: "david@pinnacle.com", role: "agent", status: "offline", conversations: 0 },
  { id: "5", name: "Lisa Patel", email: "lisa@pinnacle.com", role: "agent", status: "online", conversations: 3 },
];

export const conversations: Conversation[] = [
  {
    id: "1",
    lead: { id: "l1", name: "James Wilson", email: "james.w@email.com", phone: "(555) 234-5678", source: "Website", utm: "google_ads" },
    listing: { address: "123 Oak Street, Austin TX", price: "$485,000", beds: 3, baths: 2, sqft: 1850, mls: "MLS-78901" },
    lastMessage: "Yes, this Saturday works for the tour!",
    lastTime: "2 min ago",
    status: "mine",
    assignedTo: "Sarah Chen",
    afterHours: false,
    notes: "Very interested buyer. Pre-approved for $500k.",
    messages: [
      { id: "m1", sender: "visitor", text: "Hi, I'm interested in the listing at 123 Oak Street.", time: "10:23 AM", read: true },
      { id: "m2", sender: "agent", text: "Great choice! That's a beautiful 3BR/2BA listed at $485,000. Would you like to schedule a tour?", time: "10:24 AM", read: true },
      { id: "m3", sender: "visitor", text: "Yes, this Saturday works for the tour!", time: "10:26 AM", read: true },
    ],
  },
  {
    id: "2",
    lead: { id: "l2", name: "Maria Garcia", email: "maria.g@email.com", phone: "(555) 345-6789", source: "Zillow", utm: "zillow_feed" },
    listing: { address: "456 Elm Ave, Austin TX", price: "$625,000", beds: 4, baths: 3, sqft: 2400, mls: "MLS-78902" },
    lastMessage: "Can you send me the floor plan?",
    lastTime: "15 min ago",
    status: "mine",
    assignedTo: "Sarah Chen",
    afterHours: false,
    notes: "",
    messages: [
      { id: "m4", sender: "visitor", text: "Hello, I saw the listing on Zillow for 456 Elm Ave. Is it still available?", time: "9:45 AM", read: true },
      { id: "m5", sender: "agent", text: "Yes! It's still on the market. It's a gorgeous 4-bedroom home with a recently updated kitchen.", time: "9:47 AM", read: true },
      { id: "m6", sender: "visitor", text: "Can you send me the floor plan?", time: "10:10 AM", read: false },
    ],
  },
  {
    id: "3",
    lead: { id: "l3", name: "Robert Chen", email: "robert.c@email.com", phone: "(555) 456-7890", source: "Website" },
    listing: { address: "789 Pine Rd, Austin TX", price: "$340,000", beds: 2, baths: 2, sqft: 1200, mls: "MLS-78903" },
    lastMessage: "What's the HOA fee?",
    lastTime: "1 hour ago",
    status: "unassigned",
    afterHours: false,
    notes: "",
    messages: [
      { id: "m7", sender: "visitor", text: "What's the HOA fee for 789 Pine Rd?", time: "9:15 AM", read: false },
    ],
  },
  {
    id: "4",
    lead: { id: "l4", name: "Amanda Foster", email: "amanda.f@email.com", phone: "(555) 567-8901", source: "Realtor.com" },
    listing: { address: "321 Maple Ln, Austin TX", price: "$715,000", beds: 5, baths: 4, sqft: 3200, mls: "MLS-78904" },
    lastMessage: "Thank you for the showing! We'll think about it.",
    lastTime: "3 hours ago",
    status: "unassigned",
    afterHours: false,
    notes: "",
    messages: [
      { id: "m8", sender: "visitor", text: "Hi, we're interested in the property at 321 Maple Ln.", time: "7:00 AM", read: true },
      { id: "m9", sender: "visitor", text: "Thank you for the showing! We'll think about it.", time: "7:05 AM", read: false },
    ],
  },
  {
    id: "5",
    lead: { id: "l5", name: "Kevin Nguyen", email: "kevin.n@email.com", phone: "(555) 678-9012", source: "Website", utm: "facebook_ad" },
    listing: { address: "567 Cedar Blvd, Austin TX", price: "$890,000", beds: 4, baths: 3, sqft: 2800, mls: "MLS-78905" },
    lastMessage: "Is the pool heated?",
    lastTime: "11:32 PM",
    status: "unassigned",
    afterHours: true,
    notes: "",
    messages: [
      { id: "m10", sender: "visitor", text: "Is the pool heated? Also interested in the backyard dimensions.", time: "11:32 PM", read: false },
    ],
  },
  {
    id: "6",
    lead: { id: "l6", name: "Patricia Moore", email: "pat.m@email.com", phone: "(555) 789-0123", source: "Website" },
    listing: { address: "890 Birch Way, Austin TX", price: "$420,000", beds: 3, baths: 2, sqft: 1650, mls: "MLS-78906" },
    lastMessage: "We've decided to go with this property. What's the next step?",
    lastTime: "Yesterday",
    status: "closed",
    assignedTo: "Marcus Johnson",
    afterHours: false,
    notes: "Closed deal! Offer accepted at $415,000.",
    messages: [
      { id: "m11", sender: "visitor", text: "We've decided to go with this property. What's the next step?", time: "Yesterday", read: true },
      { id: "m12", sender: "agent", text: "Wonderful news! I'll prepare the offer paperwork right away. Congratulations!", time: "Yesterday", read: true },
    ],
  },
];

export const webhookEndpoints: WebhookEndpoint[] = [
  { id: "wh1", url: "https://crm.pinnacle.com/webhooks/swyftup", events: ["conversation.created", "conversation.closed", "message.sent"], status: "active", createdAt: "2025-11-15" },
  { id: "wh2", url: "https://marketing.pinnacle.com/api/leads", events: ["lead.created"], status: "active", createdAt: "2025-12-01" },
  { id: "wh3", url: "https://old-system.example.com/hook", events: ["message.sent"], status: "inactive", createdAt: "2025-08-20" },
];

export const deliveryLogs: DeliveryLog[] = [
  { id: "dl1", endpointId: "wh1", event: "conversation.created", status: "success", timestamp: "2026-03-02 10:23:15", statusCode: 200 },
  { id: "dl2", endpointId: "wh1", event: "message.sent", status: "success", timestamp: "2026-03-02 10:24:01", statusCode: 200 },
  { id: "dl3", endpointId: "wh2", event: "lead.created", status: "success", timestamp: "2026-03-02 10:23:15", statusCode: 201 },
  { id: "dl4", endpointId: "wh3", event: "message.sent", status: "failed", timestamp: "2026-03-02 09:15:00", statusCode: 503 },
  { id: "dl5", endpointId: "wh1", event: "conversation.closed", status: "success", timestamp: "2026-03-01 16:45:00", statusCode: 200 },
  { id: "dl6", endpointId: "wh2", event: "lead.created", status: "pending", timestamp: "2026-03-02 10:26:00" },
];
