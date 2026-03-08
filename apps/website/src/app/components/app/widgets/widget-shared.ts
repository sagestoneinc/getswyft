export type WidgetState = "collapsed" | "form" | "chat" | "error";

export interface ChatMessage {
  id: number;
  sender: "agent" | "customer";
  name?: string;
  text: string;
  time: string;
}

export interface WidgetThemeConfig {
  id: "minimal" | "gradient" | "premium";
  label: string;
  subtitle: string;
  description: string;
}

export const widgetThemes: WidgetThemeConfig[] = [
  {
    id: "minimal",
    label: "Minimal",
    subtitle: "Minimal Professional",
    description:
      "Clean white theme with subtle borders. Best for professional B2B sites that favor a polished, understated look.",
  },
  {
    id: "gradient",
    label: "Gradient",
    subtitle: "Bold Gradient Branded",
    description:
      "Dark mode with vivid blue-purple gradients. Eye-catching and modern — ideal for tech-forward brands.",
  },
  {
    id: "premium",
    label: "Premium",
    subtitle: "Premium Conversational",
    description:
      "Warm off-white tones with a proactive greeting bubble. Friendly, approachable, and perfect for customer-facing sites.",
  },
];
