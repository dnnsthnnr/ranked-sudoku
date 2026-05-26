import type { Player } from "@/domain/player";

export interface PlayerRepository {
  upsert(player: Omit<Player, "createdAt">): Promise<void>;
  findById(id: string): Promise<Player | null>;
  updateElo(id: string, elo: number, raceCount: number): Promise<void>;
}
