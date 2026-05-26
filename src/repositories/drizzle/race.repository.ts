import { and, desc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Race } from "@/domain/race";
import type { RaceRepository } from "@/repositories/race.repository";
import { races } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzleRaceRepository implements RaceRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async insert(race: Omit<Race, "createdAt">): Promise<void> {
    await this.db.insert(races).values(race);
  }

  async hasRaced(playerId: string, ghostRunId: string): Promise<boolean> {
    const row = await this.db.query.races.findFirst({
      where: and(
        eq(races.playerId, playerId),
        eq(races.ghostRunId, ghostRunId)
      ),
    });
    return row !== undefined;
  }

  async findByPlayer(playerId: string, limit = 20): Promise<Race[]> {
    return this.db.query.races.findMany({
      where: eq(races.playerId, playerId),
      orderBy: desc(races.createdAt),
      limit,
    });
  }
}
