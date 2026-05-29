import type { RankedMatch } from "@/domain/ranked-match";

export interface RankedMatchRepository {
  insert(match: Omit<RankedMatch, "createdAt">): Promise<void>;
  hasRaced(playerId: string, ghostRunId: string): Promise<boolean>;
  findByPlayer(playerId: string, limit?: number): Promise<RankedMatch[]>;
}
