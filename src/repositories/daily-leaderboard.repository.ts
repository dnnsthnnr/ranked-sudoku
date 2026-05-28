import type { DailyLeaderboardEntry } from "@/domain/daily-leaderboard-entry";

export interface DailyLeaderboardRepository {
  recomputeForGame(dailyGameId: string): Promise<void>;
  findByDailyGame(dailyGameId: string): Promise<DailyLeaderboardEntry[]>;
}
