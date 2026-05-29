export interface DailyLeaderboardEntry {
  id: string;
  dailyGameId: string;
  playerId: string;
  displayName: string | null;
  effectiveTime: number;
  mistakes: number;
  rank: number;
  computedAt: string;
}
