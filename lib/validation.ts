import { z } from "zod";
import { MAX_EMAILS_PER_BATCH } from "@/lib/constants";

export const messageIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,200}$/);
export const actionSchema = z.enum(["archive", "trash", "keep", "untrash", "unarchive"]);

export const classifyEmailSchema = z.object({
  id: messageIdSchema,
  sender: z.string().trim().min(1).max(200),
  subject: z.string().max(500),
  preview: z.string().max(1000),
  labelIds: z.array(z.string().max(100)).max(30).optional(),
  listUnsubscribe: z.string().max(1000).optional(),
  precedence: z.string().max(50).optional(),
  listId: z.string().max(500).optional(),
  hasUnsubscribe: z.boolean().optional(),
});

export const classifyRequestSchema = z.object({
  emails: z.array(classifyEmailSchema).max(MAX_EMAILS_PER_BATCH),
});

export const actionRequestSchema = z.object({
  id: messageIdSchema,
  action: actionSchema,
  isLive: z.boolean().default(false),
  currentIndex: z.number().int().min(0).max(10_000).optional(),
});

export const undoRequestSchema = z.object({
  id: messageIdSchema,
  originalAction: z.enum(["archive", "trash"]),
  isLive: z.boolean().default(false),
});

export const classificationResultSchema = z.object({
  id: messageIdSchema,
  type: z.enum(["newsletter", "spam", "important", "receipt", "needs_reply"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(80),
});

export const classificationResponseSchema = z.object({
  results: z.array(classificationResultSchema),
});
