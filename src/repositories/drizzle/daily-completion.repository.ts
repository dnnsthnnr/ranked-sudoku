import { and, asc, eq } from "drizzle-orm";
import type { DailyCompletion } from "@/domain/daily-completion";
import type { DailyCompletionRepository } from "@/repositories/daily-completion.repository";
import type { AllUserDbsResolver, PlayerDbResolver } from "@/db/client";
import { dailyCompletions } from "@/db/schema/user";

export class DrizzleDailyCompletionRepository implements DailyCompletionRepository {
  constructor(
    private readonly getPlayerDb: PlayerDbResolver,
    private readonly getAllUserDbs: AllUserDbsResolver,
  ) {}

  async insert(completion: Omit<DailyCompletion, "completedAt">): Promise<void> {
    const db = await this.getPlayerDb(completion.playerId);
    await db.insert(dailyCompletions).values(completion);
  }

  async hasCompleted(playerId: string, dailyGameId: string): Promise<boolean> {
    const db = await this.getPlayerDb(playerId);
    const row = await db.query.dailyCompletions.findFirst({
      where: and(
        eq(dailyCompletions.playerId, playerId),
        eq(dailyCompletions.dailyGameId, dailyGameId),
      ),
    });
    return row !== undefined;
  }

  async findByDailyGame(dailyGameId: string): Promise<DailyCompletion[]> {
    const dbs = await this.getAllUserDbs();
    const results = await Promise.all(
      dbs.map((db) =>
        db.query.dailyCompletions.findMany({
          where: eq(dailyCompletions.dailyGameId, dailyGameId),
          orderBy: asc(dailyCompletions.effectiveTime),
        }),
      ),
    );
    return results.flat().sort((a, b) => a.effectiveTime - b.effectiveTime);
  }
}
