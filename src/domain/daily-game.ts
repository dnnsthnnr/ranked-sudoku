import type { DifficultyTier } from "./puzzle";

export interface DailyGame {
  id: string;
  puzzleId: string;
  tier: DifficultyTier;
  date: string;
  createdAt: string;
}
