import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Player } from "@/domain/player";
import type { PlayerRepository } from "@/repositories/player.repository";
import { players } from "@/db/schema/control";
import type * as controlSchema from "@/db/schema/control";

export class DrizzlePlayerRepository implements PlayerRepository {
  constructor(private readonly db: LibSQLDatabase<typeof controlSchema>) {}

  async upsert(player: Omit<Player, "createdAt" | "updatedAt">): Promise<void> {
    await this.db
      .insert(players)
      .values(player)
      .onConflictDoUpdate({
        target: players.id,
        set: {
          displayName: player.displayName,
          elo: player.elo,
          raceCount: player.raceCount,
          updatedAt: sql`(datetime('now'))`,
        },
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
      .set({ elo, raceCount, updatedAt: sql`(datetime('now'))` })
      .where(eq(players.id, id));
  }
}
