import { ClassifiedEmail, EmailType } from "./types";
import { ruleBasedClassify } from "./classification-rules";
import { safeFetchJson } from "./safe-fetch-json";
import { decodeHtmlEntities } from "./text";
import { isRulePrefiltered } from "./protection";
import { getTier } from "./protection";
import { CLASSIFICATION_BATCH_SIZE } from "./constants";
import { logger } from "./logger";

interface RequestEmail {
  id: string;
  sender: string;
  senderEmail?: string;
  subject: string;
  preview: string;
  trueType?: EmailType;
  labelIds?: string[];
  listUnsubscribe?: string;
  precedence?: string;
  listId?: string;
  hasUnsubscribe?: boolean;
  time?: string;
}

const CACHE_KEY_DEMO = "inbox_quest_groq_cache_v1";

export async function classifyBatch(
  emails: RequestEmail[],
  onProgress?: (pct: number) => void,
  onBatchComplete?: (index: number, total: number) => void
): Promise<ClassifiedEmail[]> {
  const isDemo = emails.length > 0 && emails[0].id.startsWith("email_");

  // If Demo, check sessionStorage
  if (isDemo && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_DEMO);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === emails.length) {
          onProgress?.(100);
          return parsed.map((email) => ({ ...email, ...getTier(email) }));
        }
      }
    } catch {
      // ignore
    }
  }

  const batchSize = CLASSIFICATION_BATCH_SIZE;
  const batches: RequestEmail[][] = [];
  for (let i = 0; i < emails.length; i += batchSize) {
    batches.push(emails.slice(i, i + batchSize));
  }

  const classifiedMap = new Map<string, { type: EmailType; confidence: number; reason: string }>();
  for (const email of emails) {
    if (isRulePrefiltered(email)) {
      classifiedMap.set(email.id, {
        type: "newsletter",
        confidence: 0.9,
        reason: "List or Gmail category",
      });
    }
  }

  let completedCount = 0;
  for (const batch of batches) {
    const groqBatch = batch.filter((email) => !classifiedMap.has(email.id));
    try {
      if (groqBatch.length === 0) {
        completedCount += batch.length;
        onProgress?.(35 + Math.min(60, Math.round((completedCount / emails.length) * 60)));
        onBatchComplete?.(batches.indexOf(batch) + 1, batches.length);
        continue;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const data = await safeFetchJson<{ results?: Array<{ id: string; type: EmailType; confidence: number; reason: string }> }>("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: groqBatch.map((e) => ({
            id: e.id,
            sender: e.sender,
            subject: e.subject,
            preview: decodeHtmlEntities(e.preview).slice(0, 100),
            labelIds: e.labelIds,
            listUnsubscribe: e.listUnsubscribe,
            precedence: e.precedence,
            listId: e.listId,
            hasUnsubscribe: e.hasUnsubscribe,
          })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          classifiedMap.set(item.id, {
            type: item.type,
            confidence: item.confidence,
            reason: item.reason,
          });
        }
      }
    } catch (err) {
      logger.warn("Classification batch call failed, using rule-based fallback", {
        error: err instanceof Error ? err.message : "unknown",
      });
    }

    completedCount += batch.length;
    onProgress?.(35 + Math.min(60, Math.round((completedCount / emails.length) * 60)));
    onBatchComplete?.(batches.indexOf(batch) + 1, batches.length);
  }

  // Fallback resolution
  const finalClassified: ClassifiedEmail[] = emails.map((email) => {
    const aiData = classifiedMap.get(email.id);
    if (aiData && aiData.type) {
      const result = {
        id: email.id,
        sender: email.sender,
        senderEmail: email.senderEmail || "user@example.com",
        subject: email.subject,
        preview: decodeHtmlEntities(email.preview),
        time: email.time || "Today",
        trueType: email.trueType || aiData.type,
        classifiedType: aiData.type,
        confidence: aiData.confidence || 0.95,
        reason: aiData.reason || "Llama classified",
        labelIds: email.labelIds,
        listUnsubscribe: email.listUnsubscribe,
        precedence: email.precedence,
        listId: email.listId,
        hasUnsubscribe: email.hasUnsubscribe,
      };
      return { ...result, ...getTier(result) };
    }

    // Rule-based fallback if Groq timed out or failed
    const ruleFallback = ruleBasedClassify(email.sender, email.subject, email.preview);
    const resolvedType = email.trueType || ruleFallback.type;

    const result = {
      id: email.id,
      sender: email.sender,
      senderEmail: email.senderEmail || "user@example.com",
      subject: email.subject,
      preview: decodeHtmlEntities(email.preview),
      time: email.time || "Today",
      trueType: resolvedType,
      classifiedType: resolvedType,
      confidence: 0.9,
      reason: email.trueType ? "Pattern match" : ruleFallback.reason,
      labelIds: email.labelIds,
      listUnsubscribe: email.listUnsubscribe,
      precedence: email.precedence,
      listId: email.listId,
      hasUnsubscribe: email.hasUnsubscribe,
    };
    return { ...result, ...getTier(result) };
  });

  if (isDemo && typeof window !== "undefined") {
    try {
      sessionStorage.setItem(CACHE_KEY_DEMO, JSON.stringify(finalClassified));
    } catch {
      // ignore
    }
  }

  onProgress?.(100);
  return finalClassified;
}

export const classifyEmails = classifyBatch;
