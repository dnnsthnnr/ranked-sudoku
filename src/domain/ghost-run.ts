export type GhostRunSource = "daily" | "ranked" | "seed";

export interface GhostRun {
  id: string;
  puzzleId: string;
  playerId: string;
  stampedElo: number;
  effectiveTime: number;
  replayKey: string;
  source: GhostRunSource;
  isActiveInPool: boolean;
  createdAt: string;
}
