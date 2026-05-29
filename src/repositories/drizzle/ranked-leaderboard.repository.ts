import { asc, desc, eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { RankedLeaderboardEntry } from "@/domain/ranked-leaderboard-entry";
import type { RankedLeaderboardRepository } from "@/repositories/ranked-leaderboard.repository";
import type { AllUserDbsResolver } from "@/db/client";
import { players, rankedLeaderboard } from "@/db/schema/control";
import { rankedMatches } from "@/db/schema/user";
import type * as controlSchema from "@/db/schema/control";

export class DrizzleRankedLeaderboardRepository implements RankedLeaderboardRepository {
  constructor(
    private readonly controlDb: LibSQLDatabase<typeof controlSchema>,
    private readonly getAllUserDbs: AllUserDbsResolver,
  ) {}

  async recompute(): Promise<void> {
    const playerList = await this.controlDb
      .select({
        id: players.id,
        displayName: players.displayName,
        elo: players.elo,
        raceCount: players.raceCount,
      })
      .from(players)
      .orderBy(desc(players.elo));

    const dbs = await this.getAllUserDbs();
    const perDbStats = await Promise.all(
      dbs.map((db) =>
        db
          .select({
            playerId: rankedMatches.playerId,
            wins: sql<number>`sum(case when ${rankedMatches.outcome} = 'win' then 1 else 0 end)`.as(
              "wins",
            ),
            losses:
              sql<number>`sum(case when ${rankedMatches.outcome} = 'loss' then 1 else 0 end)`.as(
                "losses",
              ),
            forfeits:
              sql<number>`sum(case when ${rankedMatches.outcome} = 'forfeit' then 1 else 0 end)`.as(
                "forfeits",
              ),
          })
          .from(rankedMatches)
          .groupBy(rankedMatches.playerId),
      ),
    );

    const statsById = new Map<string, { wins: number; losses: number; forfeits: number }>();
    for (const rows of perDbStats) {
      for (const row of rows) {
        const prev = statsById.get(row.playerId);
        statsById.set(row.playerId, {
          wins: (prev?.wins ?? 0) + (row.wins ?? 0),
          losses: (prev?.losses ?? 0) + (row.losses ?? 0),
          forfeits: (prev?.forfeits ?? 0) + (row.forfeits ?? 0),
        });
      }
    }

    await this.controlDb.delete(rankedLeaderboard);

    if (playerList.length === 0) return;

    await this.controlDb.insert(rankedLeaderboard).values(
      playerList.map((p, i) => {
        const stats = statsById.get(p.id);
        return {
          playerId: p.id,
          displayName: p.displayName ?? null,
          elo: p.elo,
          raceCount: p.raceCount,
          wins: stats?.wins ?? 0,
          losses: stats?.losses ?? 0,
          forfeits: stats?.forfeits ?? 0,
          rank: i + 1,
        };
      }),
    );
  }

  async listTopN(limit = 100): Promise<RankedLeaderboardEntry[]> {
    return this.controlDb.query.rankedLeaderboard.findMany({
      orderBy: asc(rankedLeaderboard.rank),
      limit,
    });
  }
}
