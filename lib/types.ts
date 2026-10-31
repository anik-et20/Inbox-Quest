export type EmailType = "newsletter" | "spam" | "important" | "receipt" | "needs_reply";

export type EmailAction = "archive" | "trash" | "keep";
export type EmailTier = "protected" | "clutter" | "uncertain";

export interface DemoEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  time: string;
  trueType: EmailType;
  labelIds?: string[];
  listUnsubscribe?: string;
  listId?: string;
  hasUnsubscribe?: boolean;
  precedence?: string;
}

export interface ClassifiedEmail extends DemoEmail {
  classifiedType: EmailType;
  confidence: number;
  reason: string;
  labelIds?: string[];
  listUnsubscribe?: string;
  listId?: string;
  hasUnsubscribe?: boolean;
  precedence?: string;
  tier?: EmailTier;
  tierReason?: string;
}

export interface ActionLogItem {
  id: string;
  emailId: string;
  action: EmailAction;
  sender: string;
  subject: string;
  timestamp: string;
  status: "pending" | "confirmed";
  isCorrect: boolean;
  correctAction: EmailAction;
  xpChange: number;
  comboMultiplier: number;
  note?: string;
  protected: boolean;
  tier: EmailTier;
  tierReason: string;
}

export const ENEMY_METADATA: Record<
  EmailType,
  {
    name: string;
    correctAction: EmailAction;
    badgeText: string;
    colorHex: string;
    glowClass: string;
    tagline: string;
    ruleHint: string;
  }
> = {
  newsletter: {
    name: "Newsletter",
    correctAction: "archive",
    badgeText: "NEWSLETTER",
    colorHex: "#a855f7", // purple
    glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    tagline: "SLOW BLOB - Clear clutter. Keep your combo.",
    ruleHint: "Archive or unsubscribe",
  },
  spam: {
    name: "Spam",
    correctAction: "trash",
    badgeText: "SPAM",
    colorHex: "#ec4899", // pink
    glowClass: "shadow-[0_0_20px_rgba(236,72,153,0.4)]",
    tagline: "FAST SWARM - Trash instantly. Block malicious links.",
    ruleHint: "Trash immediately",
  },
  important: {
    name: "Important",
    correctAction: "keep",
    badgeText: "IMPORTANT",
    colorHex: "#22c55e", // green gem
    glowClass: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
    tagline: "PROTECT GEM - Keep in inbox. Never discard.",
    ruleHint: "Keep - never swipe away",
  },
  receipt: {
    name: "Receipt",
    correctAction: "archive",
    badgeText: "RECEIPT",
    colorHex: "#f59e0b", // amber chest
    glowClass: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    tagline: "LOOT CHEST - File away. Taxes and history saved.",
    ruleHint: "Archive - keep the receipt",
  },
  needs_reply: {
    name: "Needs Reply",
    correctAction: "keep",
    badgeText: "NEEDS REPLY",
    colorHex: "#f43f5e", // rose/pink horned boss
    glowClass: "shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    tagline: "BOSS HP - Keep for manual response & follow up.",
    ruleHint: "Review & approve reply",
  },
};
