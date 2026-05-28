import type { DailyCompletion } from "@/domain/daily-completion";

export interface DailyCompletionRepository {
  insert(completion: Omit<DailyCompletion, "completedAt">): Promise<void>;
  findByDailyGame(dailyGameId: string): Promise<DailyCompletion[]>;
  hasCompleted(playerId: string, dailyGameId: string): Promise<boolean>;
}
