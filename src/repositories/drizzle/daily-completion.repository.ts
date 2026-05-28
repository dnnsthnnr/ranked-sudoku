import { and, asc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { DailyCompletion } from "@/domain/daily-completion";
import type { DailyCompletionRepository } from "@/repositories/daily-completion.repository";
import { dailyCompletions } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzleDailyCompletionRepository implements DailyCompletionRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async insert(completion: Omit<DailyCompletion, "completedAt">): Promise<void> {
    await this.db.insert(dailyCompletions).values(completion);
  }

  async findByDailyGame(dailyGameId: string): Promise<DailyCompletion[]> {
    return this.db.query.dailyCompletions.findMany({
      where: eq(dailyCompletions.dailyGameId, dailyGameId),
      orderBy: asc(dailyCompletions.effectiveTime),
    });
  }

  async hasCompleted(playerId: string, dailyGameId: string): Promise<boolean> {
    const row = await this.db.query.dailyCompletions.findFirst({
      where: and(
        eq(dailyCompletions.playerId, playerId),
        eq(dailyCompletions.dailyGameId, dailyGameId),
      ),
    });
    return row !== undefined;
  }
}
