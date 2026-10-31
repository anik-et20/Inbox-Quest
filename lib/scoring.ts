import { COMBO_THRESHOLDS } from "@/lib/constants";
import { EmailAction, EmailTier } from "@/lib/types";

export interface ScoreDecision {
  hardMistake: boolean;
  softMistake: boolean;
  isCorrect: boolean;
  healthDelta: number;
  streak: number;
  combo: number;
  xpGained: number;
  comboLabel: string;
}

export function scoreDecision(
  tier: EmailTier,
  action: EmailAction,
  previousStreak: number,
  previousCombo: number,
): ScoreDecision {
  const hardMistake = tier === "protected" && (action === "archive" || action === "trash");
  const softMistake = tier === "clutter" && action === "keep";
  const isCorrect = !hardMistake && !softMistake;

  if (hardMistake) {
    return {
      hardMistake,
      softMistake,
      isCorrect,
      healthDelta: -1,
      streak: 0,
      combo: 1,
      xpGained: 0,
      comboLabel: "",
    };
  }

  if (tier === "uncertain") {
    return {
      hardMistake,
      softMistake,
      isCorrect,
      healthDelta: 0,
      streak: previousStreak,
      combo: previousCombo,
      xpGained: 50,
      comboLabel: "",
    };
  }

  if (softMistake) {
    return {
      hardMistake,
      softMistake,
      isCorrect,
      healthDelta: 0,
      streak: 0,
      combo: 1,
      xpGained: 0,
      comboLabel: "",
    };
  }

  const streak = previousStreak + 1;
  const combo = streak >= COMBO_THRESHOLDS.unstoppable
    ? 10
    : streak >= COMBO_THRESHOLDS.rolling
      ? 5
      : streak >= COMBO_THRESHOLDS.warmup
        ? 2
        : 1;
  const comboLabel = combo > previousCombo
    ? `x${combo} ${combo === 10 ? "UNSTOPPABLE!" : combo === 5 ? "ON A ROLL!" : "WARMING UP!"}`
    : "";

  return {
    hardMistake,
    softMistake,
    isCorrect,
    healthDelta: 0,
    streak,
    combo,
    xpGained: 100 * combo,
    comboLabel,
  };
}
