import { asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { DailyLeaderboardEntry } from "@/domain/daily-leaderboard-entry";
import type { DailyLeaderboardRepository } from "@/repositories/daily-leaderboard.repository";
import { dailyCompletions, dailyLeaderboard, players } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzleDailyLeaderboardRepository implements DailyLeaderboardRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async recomputeForGame(dailyGameId: string): Promise<void> {
    const completions = await this.db
      .select({
        playerId: dailyCompletions.playerId,
        displayName: players.displayName,
        effectiveTime: dailyCompletions.effectiveTime,
        mistakes: dailyCompletions.mistakes,
      })
      .from(dailyCompletions)
      .leftJoin(players, eq(dailyCompletions.playerId, players.id))
      .where(eq(dailyCompletions.dailyGameId, dailyGameId))
      .orderBy(asc(dailyCompletions.effectiveTime));

    await this.db.delete(dailyLeaderboard).where(eq(dailyLeaderboard.dailyGameId, dailyGameId));

    if (completions.length === 0) return;

    await this.db.insert(dailyLeaderboard).values(
      completions.map((c, i) => ({
        id: randomUUID(),
        dailyGameId,
        playerId: c.playerId,
        displayName: c.displayName ?? null,
        effectiveTime: c.effectiveTime,
        mistakes: c.mistakes,
        rank: i + 1,
      })),
    );
  }

  async findByDailyGame(dailyGameId: string): Promise<DailyLeaderboardEntry[]> {
    return this.db.query.dailyLeaderboard.findMany({
      where: eq(dailyLeaderboard.dailyGameId, dailyGameId),
      orderBy: asc(dailyLeaderboard.rank),
    });
  }
}
