import type { Race } from "@/domain/race";

export interface RaceRepository {
  insert(race: Omit<Race, "createdAt">): Promise<void>;
  hasRaced(playerId: string, ghostRunId: string): Promise<boolean>;
  findByPlayer(playerId: string, limit?: number): Promise<Race[]>;
}
