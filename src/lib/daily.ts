import type { DifficultyTier } from "@/domain/puzzle";

const TIERS: DifficultyTier[] = ["easy", "medium", "hard", "expert"];

export function pickTierForDate(date: string): DifficultyTier {
  const hash = date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TIERS[hash % TIERS.length];
}
