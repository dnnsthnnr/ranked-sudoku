import type { RankedLeaderboardEntry } from "@/domain/ranked-leaderboard-entry";

export interface RankedLeaderboardRepository {
  recompute(): Promise<void>;
  listTopN(limit?: number): Promise<RankedLeaderboardEntry[]>;
}
