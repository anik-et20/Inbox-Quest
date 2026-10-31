import { ClassifiedEmail, EmailTier } from "./types";

const OVERRIDE_KEY = "inbox_quest_clutter_senders_v1";
const GENERIC_LOCAL_PART = /^(hello|info|team|news|newsletter|marketing|offers|deals|updates|contact|no[- ]?reply|noreply|notifications|mailer)$/i;
const SENDER_BLOCKLIST = /(?:no[- ]?reply|noreply|donotreply|newsletter|marketing|deals|offers|notifications|mailer|support[- ]?bot)/i;
const PROMO_TERMS = /webinar|summit|masterclass|free|% off|sale|deal|join me|limited time|discount|course|bootcamp|tips|blueprint|newsletter|weekly digest/i;
const ALERT_TERMS = /security alert|new sign[- ]?in|new login|password reset|verification code|otp|bill due|payment due|payment failed|invoice due|interview|offer letter|meeting invite|calendar invite|action required/i;
const BULK_LABELS = new Set(["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_FORUMS"]);
const DIRECT_MESSAGE_TERMS = /\b(hey|hi|can you|could you|please|let me know|send|deck|review|thoughts|meeting|invite|tomorrow|thanks|quick question)\b/i;

export function senderOverrideKey(email: Pick<ClassifiedEmail, "senderEmail" | "sender">): string {
  return (email.senderEmail || email.sender).trim().toLowerCase();
}

export function getClutterSenderOverrides(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

export function recordSenderDisposition(email: Pick<ClassifiedEmail, "senderEmail" | "sender">): void {
  if (typeof window === "undefined") return;
  try {
    const key = senderOverrideKey(email);
    const counts = JSON.parse(localStorage.getItem(`${OVERRIDE_KEY}_counts`) || "{}") as Record<string, number>;
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] >= 2) {
      const overridden = getClutterSenderOverrides();
      overridden.add(key);
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify([...overridden]));
    }
    localStorage.setItem(`${OVERRIDE_KEY}_counts`, JSON.stringify(counts));
  } catch {
    // Local storage is optional.
  }
}

function hasBulkMetadata(email: Pick<ClassifiedEmail, "labelIds" | "listUnsubscribe" | "listId" | "hasUnsubscribe" | "precedence">): boolean {
  return Boolean(email.hasUnsubscribe || email.listUnsubscribe || email.listId)
    || /^(bulk|list)$/i.test(email.precedence || "")
    || (email.labelIds || []).some((label) => BULK_LABELS.has(label));
}

type TierInput = Omit<Pick<ClassifiedEmail, "sender" | "senderEmail" | "subject" | "preview" | "labelIds" | "listUnsubscribe" | "listId" | "hasUnsubscribe" | "precedence">, "senderEmail"> & { senderEmail?: string; classifiedType?: ClassifiedEmail["classifiedType"] };

function hasExplicitClutter(email: TierInput): string | null {
  const text = `${email.subject} ${email.preview}`;
  if (ALERT_TERMS.test(email.subject) && !PROMO_TERMS.test(email.subject)) return null;
  if (hasBulkMetadata(email)) {
    if (email.hasUnsubscribe || email.listUnsubscribe) return "has unsubscribe link";
    if (email.listId) return "list header";
    if (/^(bulk|list)$/i.test(email.precedence || "")) return "bulk header";
    const label = (email.labelIds || []).find((value) => BULK_LABELS.has(value));
    return label ? `${label.toLowerCase().replace("category_", "")} label` : "bulk mail";
  }
  if (/unsubscribe|view in browser|manage preferences|you are receiving this/i.test(text)) return "unsubscribe language";
  const localPart = (email.senderEmail || "").split("@")[0];
  if (GENERIC_LOCAL_PART.test(localPart)) return "generic sender";
  if (PROMO_TERMS.test(text)) return "promotional language";
  if (email.classifiedType && ["newsletter", "spam", "receipt"].includes(email.classifiedType)) return `AI ${email.classifiedType}`;
  return null;
}

function looksLikeRealPerson(email: TierInput): boolean {
  if (hasBulkMetadata(email)) return false;
  const localPart = (email.senderEmail || "").split("@")[0];
  const displayName = email.sender.trim();
  const personalName = /^[A-Za-z]+(?:[ '-][A-Za-z]+){1,3}$/.test(displayName);
  return personalName
    && !GENERIC_LOCAL_PART.test(localPart)
    && !SENDER_BLOCKLIST.test(`${displayName} ${localPart}`)
    && DIRECT_MESSAGE_TERMS.test(`${email.subject} ${email.preview}`);
}

function looksLikeRealService(email: Pick<ClassifiedEmail, "sender" | "senderEmail">): boolean {
  return Boolean(email.senderEmail)
    && !/^[A-Za-z]+(?:[ '-][A-Za-z]+){1,3}$/.test(email.sender.trim())
    && !GENERIC_LOCAL_PART.test(email.senderEmail.split("@")[0]);
}

export function getTier(email: Pick<ClassifiedEmail, "classifiedType" | "confidence" | "sender" | "senderEmail" | "subject" | "preview" | "labelIds" | "listUnsubscribe" | "listId" | "hasUnsubscribe" | "precedence">): { tier: EmailTier; tierReason: string } {
  const labels = new Set(email.labelIds || []);
  if (labels.has("STARRED")) return { tier: "protected", tierReason: "starred" };

  const text = `${email.subject} ${email.preview}`;
  if (ALERT_TERMS.test(text) && !PROMO_TERMS.test(email.subject) && looksLikeRealService(email)) {
    return { tier: "protected", tierReason: "security keyword" };
  }

  const explicitClutter = hasExplicitClutter(email);
  if (explicitClutter) return { tier: "clutter", tierReason: explicitClutter };

  if (getClutterSenderOverrides().has(senderOverrideKey(email))) {
    return { tier: "clutter", tierReason: "sender override" };
  }
  if (looksLikeRealPerson(email)) return { tier: "protected", tierReason: "real person" };
  if ((email.classifiedType === "important" || email.classifiedType === "needs_reply") && email.confidence >= 0.8) {
    return { tier: "protected", tierReason: "AI important" };
  }
  if (email.confidence < 0.6) return { tier: "uncertain", tierReason: "low confidence" };
  return { tier: "uncertain", tierReason: "needs review" };
}

export function isProtected(email: Parameters<typeof getTier>[0]): boolean {
  return getTier(email).tier === "protected";
}

export function isRulePrefiltered(email: TierInput): boolean {
  return hasExplicitClutter(email) !== null;
}
