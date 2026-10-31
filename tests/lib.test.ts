import { describe, expect, it } from "vitest";
import { getTier, isRulePrefiltered } from "@/lib/protection";
import { scoreDecision } from "@/lib/scoring";
import { getRank } from "@/lib/ranks";
import { ruleBasedClassify } from "@/lib/classification-rules";
import { decodeHtmlEntities } from "@/lib/text";
import {
  actionRequestSchema,
  classificationResponseSchema,
  classifyRequestSchema,
} from "@/lib/validation";

const email = (overrides: Record<string, unknown> = {}) => ({
  classifiedType: "important" as const,
  confidence: 0.9,
  sender: "Alex Morgan",
  senderEmail: "alex@example.com",
  subject: "Can you review this?",
  preview: "Hey, please let me know your thoughts.",
  labelIds: [],
  ...overrides,
});

describe("tiering and pre-filtering", () => {
  it("protects starred mail", () => expect(getTier(email({ labelIds: ["STARRED"] })).tier).toBe("protected"));
  it("protects security alerts from automated senders", () => {
    expect(getTier(email({
      sender: "Google Account",
      senderEmail: "security@google.com",
      subject: "Security alert: new sign-in",
      preview: "A new login was detected.",
    })).tier).toBe("protected");
  });
  it("classifies an unsubscribe newsletter as clutter", () => {
    expect(getTier(email({
      sender: "Nicolas Boucher",
      senderEmail: "hello@nicolasboucher.online",
      subject: "ChatGPT replaced a junior accountant for this CFO (3-steps to ROI)",
      preview: "Read the story. Unsubscribe here.",
      listUnsubscribe: "<mailto:unsubscribe@example.com>",
    })).tier).toBe("clutter");
  });
  it("protects a real person", () => expect(getTier(email()).tier).toBe("protected"));
  it("marks low confidence as uncertain", () => expect(getTier(email({
    confidence: 0.2,
    sender: "Automated Service",
    senderEmail: "service@example.com",
    classifiedType: "important",
    subject: "A message",
    preview: "An update is available.",
  })).tier).toBe("uncertain"));
  it.each([
    ["unsubscribe header", { listUnsubscribe: "<mailto:unsubscribe@example.com>" }],
    ["promo words", { subject: "Join our webinar and summit" }],
    ["generic sender", { senderEmail: "hello@example.com" }],
  ])("pre-filters %s", (_, overrides) => expect(isRulePrefiltered(email(overrides))).toBe(true));
  it("pre-filters receipt keywords through the rules classifier", () => {
    expect(ruleBasedClassify("Billing", "Your invoice", "Payment received").type).toBe("receipt");
  });
});

describe("scoring and ranks", () => {
  it("scores a correct action and extends the streak", () => {
    expect(scoreDecision("clutter", "archive", 2, 1)).toMatchObject({ streak: 3, combo: 2, xpGained: 200 });
  });
  it("resets a soft mistake without health loss", () => {
    expect(scoreDecision("clutter", "keep", 7, 2)).toMatchObject({ softMistake: true, healthDelta: 0, streak: 0, combo: 1 });
  });
  it("loses one health for a hard mistake", () => {
    expect(scoreDecision("protected", "trash", 7, 5)).toMatchObject({ hardMistake: true, healthDelta: -1, combo: 1 });
  });
  it.each([[3, 2], [8, 5], [15, 10]])("uses combo threshold %s", (streak, combo) => {
    expect(scoreDecision("clutter", "archive", streak - 1, 1).combo).toBe(combo);
  });
  it("supports game over at zero health", () => expect(3 + scoreDecision("protected", "trash", 0, 1).healthDelta).toBe(2));
  it.each([["Legend", 95, 20], ["Ninja", 80, 5], ["Pro", 50, 5], ["Rookie", 49, 5] as const])(
    "returns %s at rank threshold",
    (rank, accuracy, reviewed) => expect(getRank(accuracy, reviewed)).toBe(rank),
  );
});

describe("validation and text", () => {
  it("rejects invalid action and message ids", () => {
    expect(actionRequestSchema.safeParse({ id: "bad id", action: "delete" }).success).toBe(false);
  });
  it("rejects batches over the maximum", () => {
    const item = { id: "id", sender: "a", subject: "", preview: "" };
    expect(classifyRequestSchema.safeParse({ emails: Array.from({ length: 21 }, () => item) }).success).toBe(false);
  });
  it("rejects invalid classification types and confidence", () => {
    expect(classificationResponseSchema.safeParse({
      results: [{ id: "id", type: "unknown", confidence: 2, reason: "bad" }],
    }).success).toBe(false);
  });
  it("rejects reasons longer than 80 characters", () => {
    expect(classificationResponseSchema.safeParse({
      results: [{ id: "id", type: "spam", confidence: 0.5, reason: "x".repeat(81) }],
    }).success).toBe(false);
  });
  it("decodes HTML entities and strips controls", () => {
    expect(decodeHtmlEntities("didn&#39;t\u0000")).toBe("didn't");
  });
});
