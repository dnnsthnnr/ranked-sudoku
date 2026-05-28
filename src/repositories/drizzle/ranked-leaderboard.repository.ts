import { asc, desc, eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { RankedLeaderboardEntry } from "@/domain/ranked-leaderboard-entry";
import type { RankedLeaderboardRepository } from "@/repositories/ranked-leaderboard.repository";
import { players, rankedLeaderboard, rankedMatches } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzleRankedLeaderboardRepository implements RankedLeaderboardRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async recompute(): Promise<void> {
    const stats = await this.db
      .select({
        playerId: players.id,
        displayName: players.displayName,
        elo: players.elo,
        raceCount: players.raceCount,
        wins: sql<number>`sum(case when ${rankedMatches.outcome} = 'win' then 1 else 0 end)`.as(
          "wins",
        ),
        losses: sql<number>`sum(case when ${rankedMatches.outcome} = 'loss' then 1 else 0 end)`.as(
          "losses",
        ),
        forfeits:
          sql<number>`sum(case when ${rankedMatches.outcome} = 'forfeit' then 1 else 0 end)`.as(
            "forfeits",
          ),
      })
      .from(players)
      .leftJoin(rankedMatches, eq(rankedMatches.playerId, players.id))
      .groupBy(players.id)
      .orderBy(desc(players.elo));

    await this.db.delete(rankedLeaderboard);

    if (stats.length === 0) return;

    await this.db.insert(rankedLeaderboard).values(
      stats.map((s, i) => ({
        playerId: s.playerId,
        displayName: s.displayName ?? null,
        elo: s.elo,
        raceCount: s.raceCount,
        wins: s.wins ?? 0,
        losses: s.losses ?? 0,
        forfeits: s.forfeits ?? 0,
        rank: i + 1,
      })),
    );
  }

  async listTopN(limit = 100): Promise<RankedLeaderboardEntry[]> {
    return this.db.query.rankedLeaderboard.findMany({
      orderBy: asc(rankedLeaderboard.rank),
      limit,
    });
  }
}
