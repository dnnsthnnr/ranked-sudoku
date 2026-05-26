import type { DailyGame } from "@/domain/daily-game";
import type { DifficultyTier } from "@/domain/puzzle";

export interface DailyGameRepository {
  insert(dailyGame: Omit<DailyGame, "createdAt">): Promise<void>;
  findByDate(date: string, tier: DifficultyTier): Promise<DailyGame | null>;
}
