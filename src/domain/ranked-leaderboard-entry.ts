export interface RankedLeaderboardEntry {
  playerId: string;
  displayName: string | null;
  elo: number;
  raceCount: number;
  wins: number;
  losses: number;
  forfeits: number;
  rank: number;
  computedAt: string;
}
