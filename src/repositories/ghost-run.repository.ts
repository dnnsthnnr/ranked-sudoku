import type { GhostRun } from "@/domain/ghost-run";
import type { DifficultyTier } from "@/domain/puzzle";

export interface GhostRunRepository {
  insert(ghostRun: Omit<GhostRun, "createdAt">): Promise<void>;
  findById(id: string): Promise<GhostRun | null>;
  findByPuzzleId(puzzleId: string): Promise<GhostRun | null>;
  findMatchFor(playerId: string, tier: DifficultyTier, playerElo: number): Promise<GhostRun | null>;
  listByTier(tier: DifficultyTier, limit?: number): Promise<GhostRun[]>;
}
