export type RaceOutcome = "win" | "loss" | "forfeit";
export type MatchType = "ranked" | "ghost_match" | "live_match";

export interface RankedMatch {
  id: string;
  playerId: string;
  ghostRunId: string;
  opponentPlayerId: string | null;
  puzzleId: string;
  matchType: MatchType;
  outcome: RaceOutcome;
  effectiveTime: number | null;
  mistakes: number;
  eloBefore: number;
  eloAfter: number;
  createdAt: string;
}
