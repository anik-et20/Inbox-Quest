import { EmailType } from "./types";

export function ruleBasedClassify(sender: string, subject: string, snippet: string): { type: EmailType; reason: string } {
  const text = `${sender} ${subject} ${snippet}`.toLowerCase();

  if (
    text.includes("unsubscribe") ||
    text.includes("% off") ||
    text.includes("newsletter") ||
    text.includes("digest") ||
    text.includes("weekly") ||
    text.includes("sale ends") ||
    text.includes("deals")
  ) {
    return { type: "newsletter", reason: "Unsubscribe/promo rule" };
  }

  if (
    text.includes("receipt") ||
    text.includes("invoice") ||
    text.includes("payment received") ||
    text.includes("order confirmation") ||
    text.includes("billed to") ||
    text.includes("your plan ($")
  ) {
    return { type: "receipt", reason: "Payment/receipt rule" };
  }

  if (
    text.includes("won a mystery") ||
    text.includes("jackpot") ||
    text.includes("claim prize") ||
    text.includes("airdrop claim") ||
    text.includes("unsecured cash loan") ||
    text.includes("nigerian prince") ||
    text.includes("urgent suspension")
  ) {
    return { type: "spam", reason: "Spam keywords rule" };
  }

  if (
    text.includes("can you send") ||
    text.includes("thoughts?") ||
    text.includes("let me know if") ||
    text.includes("are we still meeting") ||
    text.includes("quick question")
  ) {
    return { type: "needs_reply", reason: "Question/reply rule" };
  }

  return { type: "important", reason: "Important inbox message" };
}
