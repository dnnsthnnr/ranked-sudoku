import { and, desc, eq } from "drizzle-orm";
import type { RankedMatch } from "@/domain/ranked-match";
import type { RankedMatchRepository } from "@/repositories/ranked-match.repository";
import type { PlayerDbResolver } from "@/db/client";
import { rankedMatches } from "@/db/schema/user";

export class DrizzleRankedMatchRepository implements RankedMatchRepository {
  constructor(private readonly getPlayerDb: PlayerDbResolver) {}

  async insert(match: Omit<RankedMatch, "createdAt">): Promise<void> {
    const db = await this.getPlayerDb(match.playerId);
    await db.insert(rankedMatches).values(match);
  }

  async hasRaced(playerId: string, ghostRunId: string): Promise<boolean> {
    const db = await this.getPlayerDb(playerId);
    const row = await db.query.rankedMatches.findFirst({
      where: and(eq(rankedMatches.playerId, playerId), eq(rankedMatches.ghostRunId, ghostRunId)),
    });
    return row !== undefined;
  }

  async findByPlayer(playerId: string, limit = 20): Promise<RankedMatch[]> {
    const db = await this.getPlayerDb(playerId);
    return db.query.rankedMatches.findMany({
      where: eq(rankedMatches.playerId, playerId),
      orderBy: desc(rankedMatches.createdAt),
      limit,
    });
  }
}
