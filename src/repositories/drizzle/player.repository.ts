import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Player } from "@/domain/player";
import type { PlayerRepository } from "@/repositories/player.repository";
import { players } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzlePlayerRepository implements PlayerRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async upsert(player: Omit<Player, "createdAt">): Promise<void> {
    await this.db
      .insert(players)
      .values(player)
      .onConflictDoUpdate({
        target: players.id,
        set: { elo: player.elo, raceCount: player.raceCount },
      });
  }

  async findById(id: string): Promise<Player | null> {
    const row = await this.db.query.players.findFirst({
      where: eq(players.id, id),
    });
    return row ?? null;
  }

  async updateElo(id: string, elo: number, raceCount: number): Promise<void> {
    await this.db
      .update(players)
      .set({ elo, raceCount })
      .where(eq(players.id, id));
  }
}
