import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { DailyGame } from "@/domain/daily-game";
import type { DifficultyTier } from "@/domain/puzzle";
import type { DailyGameRepository } from "@/repositories/daily-game.repository";
import { dailyGames } from "@/db/schema/control";
import type * as controlSchema from "@/db/schema/control";

export class DrizzleDailyGameRepository implements DailyGameRepository {
  constructor(private readonly db: LibSQLDatabase<typeof controlSchema>) {}

  async insert(dailyGame: Omit<DailyGame, "createdAt">): Promise<void> {
    await this.db.insert(dailyGames).values(dailyGame);
  }

  async findByDate(date: string, tier: DifficultyTier): Promise<DailyGame | null> {
    const row = await this.db.query.dailyGames.findFirst({
      where: and(eq(dailyGames.date, date), eq(dailyGames.tier, tier)),
    });
    return row ?? null;
  }
}
