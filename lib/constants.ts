export const MAX_EMAILS_PER_BATCH = 20;
export const CLASSIFICATION_BATCH_SIZE = 15;
export const GMAIL_FETCH_CONCURRENCY = 8;
export const GMAIL_REQUEST_TIMEOUT_MS = 15_000;
export const GROQ_REQUEST_TIMEOUT_MS = 15_000;
export const ACTIONS_PER_MINUTE = 60;
export const CLASSIFICATIONS_PER_MINUTE = 10;
export const ALLOWLIST_TTL_MS = 15 * 60 * 1000;
export const MAX_ACTION_LOG_ITEMS = 50;

export const GROQ_PRIMARY_MODEL = "openai/gpt-oss-20b";
export const GROQ_FALLBACK_MODEL = "openai/gpt-oss-120b";

export const COMBO_THRESHOLDS = {
  warmup: 3,
  rolling: 8,
  unstoppable: 15,
} as const;

export const RANK_THRESHOLDS = {
  legendAccuracy: 95,
  legendMinimumReviewed: 20,
  ninjaAccuracy: 80,
  proAccuracy: 50,
} as const;
