import { asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { DailyLeaderboardEntry } from "@/domain/daily-leaderboard-entry";
import type { DailyLeaderboardRepository } from "@/repositories/daily-leaderboard.repository";
import type { AllUserDbsResolver } from "@/db/client";
import { dailyLeaderboard, players } from "@/db/schema/control";
import { dailyCompletions } from "@/db/schema/user";
import type * as controlSchema from "@/db/schema/control";

export class DrizzleDailyLeaderboardRepository implements DailyLeaderboardRepository {
  constructor(
    private readonly controlDb: LibSQLDatabase<typeof controlSchema>,
    private readonly getAllUserDbs: AllUserDbsResolver,
  ) {}

  async recomputeForGame(dailyGameId: string): Promise<void> {
    const dbs = await this.getAllUserDbs();
    const perDbResults = await Promise.all(
      dbs.map((db) =>
        db
          .select({
            playerId: dailyCompletions.playerId,
            effectiveTime: dailyCompletions.effectiveTime,
            mistakes: dailyCompletions.mistakes,
          })
          .from(dailyCompletions)
          .where(eq(dailyCompletions.dailyGameId, dailyGameId)),
      ),
    );

    const completions = perDbResults.flat().sort((a, b) => a.effectiveTime - b.effectiveTime);

    if (completions.length === 0) {
      await this.controlDb
        .delete(dailyLeaderboard)
        .where(eq(dailyLeaderboard.dailyGameId, dailyGameId));
      return;
    }

    const playerIds = completions.map((c) => c.playerId);
    const playerRows = await this.controlDb
      .select({ id: players.id, displayName: players.displayName })
      .from(players)
      .where(inArray(players.id, playerIds));
    const displayNameById = new Map(playerRows.map((p) => [p.id, p.displayName]));

    await this.controlDb
      .delete(dailyLeaderboard)
      .where(eq(dailyLeaderboard.dailyGameId, dailyGameId));

    await this.controlDb.insert(dailyLeaderboard).values(
      completions.map((c, i) => ({
        id: randomUUID(),
        dailyGameId,
        playerId: c.playerId,
        displayName: displayNameById.get(c.playerId) ?? null,
        effectiveTime: c.effectiveTime,
        mistakes: c.mistakes,
        rank: i + 1,
      })),
    );
  }

  async findByDailyGame(dailyGameId: string): Promise<DailyLeaderboardEntry[]> {
    return this.controlDb.query.dailyLeaderboard.findMany({
      where: eq(dailyLeaderboard.dailyGameId, dailyGameId),
      orderBy: asc(dailyLeaderboard.rank),
    });
  }
}
