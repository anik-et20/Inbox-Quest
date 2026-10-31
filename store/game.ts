import { create } from "zustand";
import { ClassifiedEmail, DemoEmail, EmailAction, ActionLogItem } from "@/lib/types";
import { archive, trash, keep, rewindAction } from "@/lib/actions";
import demoEmails from "@/data/demo-emails.json";
import { classifyEmails } from "@/lib/classify";
import { safeFetchJson } from "@/lib/safe-fetch-json";
import { decodeHtmlEntities } from "@/lib/text";
import { getTier, recordSenderDisposition } from "@/lib/protection";
import { scoreDecision } from "@/lib/scoring";
import { MAX_ACTION_LOG_ITEMS } from "@/lib/constants";

export type GamePhase = "landing" | "loading" | "playing" | "ended" | "empty_inbox";
export type InboxSource = "demo" | "gmail";

interface GameState {
  phase: GamePhase;
  inboxSource: InboxSource;
  isLive: boolean; // false = Dry Run, true = Live real changes
  queue: ClassifiedEmail[];
  currentIndex: number;
  score: number;
  combo: number;
  streak: number;
  health: number;
  archivedCount: number;
  trashedCount: number;
  keptCount: number;
  actedIds: Set<string>;
  log: ActionLogItem[];
  loadProgress: number;
  statusMessage: string;
  loadError: string | null;
  isLoading: boolean;
  loadedOnce: boolean;
  lastFeedback: {
    status: "correct" | "wrong" | null;
    xpGained?: number;
    comboLabel?: string;
    message?: string;
    key: number;
  };

  // State mutators
  setPhase: (phase: GamePhase) => void;
  setInboxSource: (source: InboxSource) => void;
  setIsLive: (isLive: boolean) => void;
  setQueue: (queue: ClassifiedEmail[]) => void;
  setLoadProgress: (progress: number) => void;
  startGame: (source: InboxSource) => Promise<void>;
  retryGame: () => Promise<void>;
  processAction: (action: EmailAction) => Promise<void>;
  rewindLastAction: () => Promise<void>;
  retryAction: (logId: string) => Promise<void>;
  restartGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "landing",
  inboxSource: "demo",
  isLive: false, // Default is DRY RUN
  queue: [],
  currentIndex: 0,
  score: 0,
  combo: 1,
  streak: 0,
  health: 3,
  archivedCount: 0,
  trashedCount: 0,
  keptCount: 0,
  actedIds: new Set(),
  log: [],
  loadProgress: 0,
  statusMessage: "Scanning your inbox...",
  loadError: null,
  isLoading: false,
  loadedOnce: false,
  lastFeedback: {
    status: null,
    key: 0,
  },

  setPhase: (phase) => set({ phase }),
  setInboxSource: (inboxSource) => set({ inboxSource }),
  setIsLive: (isLive) => set({ isLive }),
  setQueue: (queue) => {
    const state = get();
    if (state.phase === "playing") {
      console.warn("queue reset ignored while phase is playing");
      return;
    }
    const uniqueQueue = [...new Map(queue.map((email) => [email.id, email])).values()]
      .filter((email) => !state.actedIds.has(email.id));
    console.log("queue reset");
    console.info(`[client] queue fetched ${queue.length}, unique count ${uniqueQueue.length}`);
    set({ queue: uniqueQueue, currentIndex: 0 });
  },
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  startGame: async (source) => {
    const state = get();
    if (state.isLoading || state.loadedOnce) return;
    set({
      inboxSource: source,
      phase: "loading",
      isLoading: true,
      loadedOnce: true,
      loadError: null,
      loadProgress: 0,
      statusMessage: source === "gmail" ? "Fetching emails..." : "Scanning demo emails...",
    });
    console.log("load: start");

    let rawEmails: DemoEmail[] = [];
    try {
      if (source === "gmail") {
        set({ loadProgress: 10, statusMessage: "Fetching emails..." });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        try {
          const data = await safeFetchJson<{ emails?: DemoEmail[] }>("/api/emails", { signal: controller.signal });
          rawEmails = [...new Map((data.emails || []).map((email) => [email.id, {
            ...email,
            preview: decodeHtmlEntities(email.preview),
          }])).values()];
          console.log(`load: fetched ${rawEmails.length}`);
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        rawEmails = demoEmails as ClassifiedEmail[];
        console.log(`load: fetched ${rawEmails.length}`);
      }

      if (rawEmails.length === 0) {
        set({ phase: "empty_inbox", isLoading: false, loadProgress: 100 });
        return;
      }

      set({ loadProgress: 35, statusMessage: "Classifying emails..." });
      const classified = await classifyEmails(
        rawEmails,
        (progress) => set({ loadProgress: progress }),
        (index, total) => console.log(`load: classified batch ${index}/${total}`)
      );
      const tierCounts = classified.reduce(
        (counts, email) => {
          counts[email.tier || "clutter"] += 1;
          return counts;
        },
        { protected: 0, clutter: 0, uncertain: 0 } as Record<"protected" | "clutter" | "uncertain", number>
      );
      console.log(`protected ${tierCounts.protected}, clutter ${tierCounts.clutter}, uncertain ${tierCounts.uncertain}`);
      get().setQueue(classified);
      console.log(`load: done -> playing`);
    } catch (error) {
      console.error("load: error", error);
      set({ loadError: error instanceof Error ? error.message : "Failed to load emails" });
    } finally {
      set({ loadProgress: 100, isLoading: false });
      if (rawEmails.length > 0) {
        set({ phase: "playing" });
        console.log("load: done -> playing");
      }
    }
  },
  retryGame: async () => {
    const source = get().inboxSource;
    set({ loadedOnce: false });
    await get().startGame(source);
  },

  processAction: async (action: EmailAction) => {
    const state = get();
    if (state.phase !== "playing") return;
    const currentEmail = state.queue[state.currentIndex];
    if (!currentEmail) return;

    if (action === "archive" || action === "trash") {
      recordSenderDisposition(currentEmail);
    }
    const tierResult = getTier(currentEmail);
    const tier = currentEmail.tier || tierResult.tier;
    const tierReason = currentEmail.tierReason || tierResult.tierReason;
    const decision = scoreDecision(tier, action, state.streak, state.combo);
    const hardMistake = decision.hardMistake;
    const softMistake = decision.softMistake;
    const isCorrect = decision.isCorrect;
    const newHealth = Math.max(0, state.health + decision.healthDelta);
    const newStreak = decision.streak;
    const newCombo = decision.combo;
    let newScore = state.score;
    const xpGained = decision.xpGained;
    const comboLabel = decision.comboLabel;
    newScore += xpGained;

    let newArchived = state.archivedCount;
    let newTrashed = state.trashedCount;
    let newKept = state.keptCount;
    if (action === "archive") newArchived += 1;
    if (action === "trash") newTrashed += 1;
    if (action === "keep") newKept += 1;

    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    let note = "";
    if (hardMistake) {
      note = `Protected: ${tierReason}`;
    } else if (softMistake) {
      note = "Kept clutter: " + currentEmail.subject;
    } else if (state.inboxSource === "gmail" && !state.isLive) {
      note = "DRY RUN";
    }

    const newLogItem: ActionLogItem = {
      id: logId,
      action,
      emailId: currentEmail.id,
      sender: currentEmail.sender,
      subject: currentEmail.subject,
      timestamp: nowTime,
      status: "pending",
      isCorrect,
      correctAction: tier === "protected" ? "keep" : tier === "clutter" ? "archive" : action,
      xpChange: xpGained,
      comboMultiplier: newCombo,
      note,
      protected: tier === "protected",
      tier,
      tierReason,
    };

    const nextIndex = state.currentIndex + 1;
    const isGameOver = newHealth <= 0 || nextIndex >= state.queue.length;

    set({
      currentIndex: nextIndex,
      score: newScore,
      health: newHealth,
      streak: newStreak,
      combo: newCombo,
      archivedCount: newArchived,
      trashedCount: newTrashed,
      keptCount: newKept,
      log: [newLogItem, ...state.log].slice(0, MAX_ACTION_LOG_ITEMS),
      lastFeedback: {
        status: isCorrect ? "correct" : "wrong",
        xpGained: isCorrect ? xpGained : 0,
        comboLabel,
        message: isCorrect ? `${currentEmail.sender} cleared` : note,
        key: Date.now(),
      },
      phase: isGameOver ? "ended" : "playing",
      actedIds: new Set([...state.actedIds, currentEmail.id]),
    });
    console.log(`action: ${action} index ${state.currentIndex} -> ${nextIndex}`);
    console.info(`[client] action=${action} id=${currentEmail.id} currentIndex=${nextIndex}`);

    // Run action in background (optimistic UI)
    (async () => {
      try {
        let res;
        if (action === "archive") res = await archive(currentEmail.id, state.isLive, nextIndex);
        else if (action === "trash") res = await trash(currentEmail.id, state.isLive, nextIndex);
        else res = await keep(currentEmail.id, state.isLive, nextIndex);

        if (res && res.success === false) {
          // Action failed: rollback score and cleared count, mark failed
          set((s) => ({
            score: Math.max(0, s.score - xpGained),
            archivedCount: action === "archive" ? Math.max(0, s.archivedCount - 1) : s.archivedCount,
            trashedCount: action === "trash" ? Math.max(0, s.trashedCount - 1) : s.trashedCount,
            log: s.log.map((item) =>
              item.id === logId
                ? {
                    ...item,
                    status: "confirmed",
                    note: `Failed: ${res.error || "Execution error"} (Click to Retry)`,
                    isCorrect: false,
                  }
                : item
            ),
          }));
        } else {
          set((s) => ({
            log: s.log.map((item) => (item.id === logId ? { ...item, status: "confirmed" } : item)),
          }));
        }
      } catch (err: unknown) {
        set((s) => ({
          log: s.log.map((item) =>
            item.id === logId
              ? { ...item, status: "confirmed", note: `Failed: ${err instanceof Error ? err.message : "Network error"}` }
              : item
          ),
        }));
      }
    })();
  },

  rewindLastAction: async () => {
    const state = get();
    if (state.log.length === 0 || state.currentIndex === 0) return;

    const lastLog = state.log[0];
    const prevIndex = Math.max(0, state.currentIndex - 1);
    const lastEmail = state.queue.find((email) => email.id === lastLog.emailId) || state.queue[prevIndex];

    if (!lastEmail || lastEmail.id === undefined) return;

    // Trigger API undo
    try {
      await rewindAction(lastEmail.id, lastLog.action, state.isLive);
    } catch (e) {
      console.error("Rewind failed", e);
    }

    set((s) => ({
      currentIndex: prevIndex,
      score: Math.max(0, s.score - (lastLog.xpChange || 0)),
      archivedCount: lastLog.action === "archive" ? Math.max(0, s.archivedCount - 1) : s.archivedCount,
      trashedCount: lastLog.action === "trash" ? Math.max(0, s.trashedCount - 1) : s.trashedCount,
      keptCount: lastLog.action === "keep" ? Math.max(0, s.keptCount - 1) : s.keptCount,
      log: s.log.slice(1),
      actedIds: new Set([...s.actedIds].filter((id) => id !== lastEmail.id)),
    }));
  },

  retryAction: async (logId: string) => {
    const state = get();
    const item = state.log.find((l) => l.id === logId);
    if (!item) return;

    // Set pending
    set((s) => ({
      log: s.log.map((l) => (l.id === logId ? { ...l, status: "pending", note: "Retrying..." } : l)),
    }));

    try {
      let res;
      if (item.action === "archive") res = await archive(item.emailId, state.isLive, state.currentIndex);
      else if (item.action === "trash") res = await trash(item.emailId, state.isLive, state.currentIndex);
      else res = await keep(item.emailId, state.isLive, state.currentIndex);

      if (res.success) {
        set((s) => ({
          log: s.log.map((l) => (l.id === logId ? { ...l, status: "confirmed", note: "Confirmed" } : l)),
        }));
      } else {
        set((s) => ({
          log: s.log.map((l) => (l.id === logId ? { ...l, status: "confirmed", note: `Failed: ${res.error}` } : l)),
        }));
      }
    } catch {
      set((s) => ({
        log: s.log.map((l) => (l.id === logId ? { ...l, status: "confirmed", note: "Retry failed" } : l)),
      }));
    }
  },

  restartGame: () => {
    const source = get().inboxSource;
    set({
      phase: "loading",
      currentIndex: 0,
      score: 0,
      combo: 1,
      streak: 0,
      health: 3,
      archivedCount: 0,
      trashedCount: 0,
      keptCount: 0,
      log: [],
      actedIds: new Set(),
      lastFeedback: { status: null, key: 0 },
      loadedOnce: false,
      loadError: null,
    });
    void get().startGame(source);
  },
}));
