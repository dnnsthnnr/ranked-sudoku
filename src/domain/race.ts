export type RaceOutcome = "win" | "loss" | "forfeit";

export interface Race {
  id: string;
  playerId: string;
  ghostRunId: string;
  outcome: RaceOutcome;
  effectiveTime: number | null;
  mistakes: number;
  eloBefore: number;
  eloAfter: number;
  createdAt: string;
}
