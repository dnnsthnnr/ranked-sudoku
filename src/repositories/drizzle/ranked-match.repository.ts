import { and, desc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { RankedMatch } from "@/domain/ranked-match";
import type { RankedMatchRepository } from "@/repositories/ranked-match.repository";
import { rankedMatches } from "@/db/schema/user";
import type * as userSchema from "@/db/schema/user";

export class DrizzleRankedMatchRepository implements RankedMatchRepository {
  constructor(private readonly db: LibSQLDatabase<typeof userSchema>) {}

  async insert(match: Omit<RankedMatch, "createdAt">): Promise<void> {
    await this.db.insert(rankedMatches).values(match);
  }

  async hasRaced(playerId: string, ghostRunId: string): Promise<boolean> {
    const row = await this.db.query.rankedMatches.findFirst({
      where: and(eq(rankedMatches.playerId, playerId), eq(rankedMatches.ghostRunId, ghostRunId)),
    });
    return row !== undefined;
  }

  async findByPlayer(playerId: string, limit = 20): Promise<RankedMatch[]> {
    return this.db.query.rankedMatches.findMany({
      where: eq(rankedMatches.playerId, playerId),
      orderBy: desc(rankedMatches.createdAt),
      limit,
    });
  }
}
