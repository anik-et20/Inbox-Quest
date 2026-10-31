import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions", () => ({
  archive: vi.fn().mockResolvedValue({ success: true }),
  trash: vi.fn().mockResolvedValue({ success: true }),
  keep: vi.fn().mockResolvedValue({ success: true }),
  rewindAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { useGameStore } from "@/store/game";
import type { ClassifiedEmail } from "@/lib/types";

const item = (id: string): ClassifiedEmail => ({
  id,
  sender: "Alex Morgan",
  senderEmail: "alex@example.com",
  subject: "Can you review this?",
  preview: "Please let me know your thoughts.",
  time: "Today",
  trueType: "important",
  classifiedType: "important",
  confidence: 0.9,
  reason: "Direct message",
  tier: "protected",
  tierReason: "real person",
});

beforeEach(() => {
  useGameStore.setState({
    phase: "loading",
    inboxSource: "demo",
    isLive: false,
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
    loadedOnce: false,
    isLoading: false,
    loadError: null,
  });
});

describe("game store queue and actions", () => {
  it("removes duplicate queue entries", () => {
    useGameStore.getState().setQueue([item("one"), item("one"), item("two")]);
    expect(useGameStore.getState().queue.map(({ id }) => id)).toEqual(["one", "two"]);
  });

  it("advances the queue and ends after the final action", async () => {
    useGameStore.getState().setQueue([item("one")]);
    useGameStore.getState().setPhase("playing");
    await useGameStore.getState().processAction("keep");
    expect(useGameStore.getState()).toMatchObject({ currentIndex: 1, phase: "ended", keptCount: 1 });
  });

  it("caps the action log at the latest 50 items", async () => {
    useGameStore.setState({
      phase: "playing",
      queue: Array.from({ length: 51 }, (_, index) => item(String(index))),
    });
    for (let index = 0; index < 51; index += 1) {
      await useGameStore.getState().processAction("keep");
    }
    expect(useGameStore.getState().log.length).toBeLessThanOrEqual(50);
  });
});
