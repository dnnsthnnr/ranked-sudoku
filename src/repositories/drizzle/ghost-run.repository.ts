import { and, asc, eq, ne, notInArray, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { GhostRun } from "@/domain/ghost-run";
import type { DifficultyTier } from "@/domain/puzzle";
import type { GhostRunRepository } from "@/repositories/ghost-run.repository";
import type { PlayerDbResolver } from "@/db/client";
import { ghostRuns, puzzles } from "@/db/schema/control";
import { rankedMatches } from "@/db/schema/user";
import type * as controlSchema from "@/db/schema/control";

export class DrizzleGhostRunRepository implements GhostRunRepository {
  constructor(
    private readonly db: LibSQLDatabase<typeof controlSchema>,
    private readonly getPlayerDb: PlayerDbResolver,
  ) {}

  async insert(ghostRun: Omit<GhostRun, "createdAt">): Promise<void> {
    await this.db.insert(ghostRuns).values(ghostRun);
  }

  async findById(id: string): Promise<GhostRun | null> {
    const row = await this.db.query.ghostRuns.findFirst({
      where: eq(ghostRuns.id, id),
    });
    return row ?? null;
  }

  async findByPuzzleId(puzzleId: string): Promise<GhostRun | null> {
    const row = await this.db.query.ghostRuns.findFirst({
      where: eq(ghostRuns.puzzleId, puzzleId),
    });
    return row ?? null;
  }

  async listByTier(tier: DifficultyTier, limit = 20): Promise<GhostRun[]> {
    const rows = await this.db
      .select({ ghostRuns })
      .from(ghostRuns)
      .innerJoin(puzzles, eq(ghostRuns.puzzleId, puzzles.id))
      .where(eq(puzzles.difficultyTier, tier))
      .orderBy(asc(ghostRuns.effectiveTime))
      .limit(limit);
    return rows.map((r) => r.ghostRuns);
  }

  async findMatchFor(
    playerId: string,
    tier: DifficultyTier,
    playerElo: number,
  ): Promise<GhostRun | null> {
    const userDb = await this.getPlayerDb(playerId);
    const racedRows = await userDb
      .select({ ghostRunId: rankedMatches.ghostRunId })
      .from(rankedMatches)
      .where(eq(rankedMatches.playerId, playerId));
    const racedIds = racedRows.map((r) => r.ghostRunId);

    const conditions = [
      eq(puzzles.difficultyTier, tier),
      eq(ghostRuns.isActiveInPool, true),
      ne(ghostRuns.playerId, playerId),
      ...(racedIds.length > 0 ? [notInArray(ghostRuns.id, racedIds)] : []),
    ];

    const row = await this.db
      .select({ ghostRuns })
      .from(ghostRuns)
      .innerJoin(puzzles, eq(ghostRuns.puzzleId, puzzles.id))
      .where(and(...conditions))
      .orderBy(asc(sql`abs(${ghostRuns.stampedElo} - ${playerElo})`))
      .limit(1);

    return row[0]?.ghostRuns ?? null;
  }
}
