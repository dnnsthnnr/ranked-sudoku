import { and, asc, eq, ne, notInArray, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { GhostRun } from "@/domain/ghost-run";
import type { DifficultyTier } from "@/domain/puzzle";
import type { GhostRunRepository } from "@/repositories/ghost-run.repository";
import { ghostRuns, puzzles, races } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzleGhostRunRepository implements GhostRunRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async insert(ghostRun: Omit<GhostRun, "createdAt">): Promise<void> {
    await this.db.insert(ghostRuns).values(ghostRun);
  }

  async findMatchFor(
    playerId: string,
    tier: DifficultyTier,
    playerElo: number
  ): Promise<GhostRun | null> {
    // Ghost runs the player has already raced
    const racedIds = this.db
      .select({ id: races.ghostRunId })
      .from(races)
      .where(eq(races.playerId, playerId));

    // Closest Stamped ELO to playerElo, same tier, not already raced, not own runs
    const row = await this.db
      .select({ ghostRuns })
      .from(ghostRuns)
      .innerJoin(puzzles, eq(ghostRuns.puzzleId, puzzles.id))
      .where(
        and(
          eq(puzzles.difficultyTier, tier),
          ne(ghostRuns.playerId, playerId),
          notInArray(ghostRuns.id, racedIds)
        )
      )
      .orderBy(asc(sql`abs(${ghostRuns.stampedElo} - ${playerElo})`))
      .limit(1);

    return row[0]?.ghostRuns ?? null;
  }
}
