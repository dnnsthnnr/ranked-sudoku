import { and, asc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { DailyCompletion } from "@/domain/daily-completion";
import type { DailyCompletionRepository } from "@/repositories/daily-completion.repository";
import { dailyCompletions } from "@/db/schema/user";
import type * as userSchema from "@/db/schema/user";

export class DrizzleDailyCompletionRepository implements DailyCompletionRepository {
  constructor(private readonly db: LibSQLDatabase<typeof userSchema>) {}

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
