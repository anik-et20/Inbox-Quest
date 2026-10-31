import { RANK_THRESHOLDS } from "@/lib/constants";

export function getRank(accuracy: number, reviewedCount: number): string {
  if (accuracy >= RANK_THRESHOLDS.legendAccuracy && reviewedCount >= RANK_THRESHOLDS.legendMinimumReviewed) {
    return "Legend";
  }
  if (accuracy >= RANK_THRESHOLDS.ninjaAccuracy) return "Ninja";
  if (accuracy >= RANK_THRESHOLDS.proAccuracy) return "Pro";
  return "Rookie";
}
