import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Puzzle, DifficultyTier } from "@/domain/puzzle";
import type { PuzzleRepository } from "@/repositories/puzzle.repository";
import { puzzles } from "@/db/schema";
import type * as schema from "@/db/schema";

export class DrizzlePuzzleRepository implements PuzzleRepository {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async insert(rows: Omit<Puzzle, "createdAt">[]): Promise<void> {
    await this.db.insert(puzzles).values(rows);
  }

  async findById(id: string): Promise<Puzzle | null> {
    const row = await this.db.query.puzzles.findFirst({
      where: eq(puzzles.id, id),
    });
    return row ?? null;
  }

  async findByDifficulty(
    tier: DifficultyTier,
    limit = 10
  ): Promise<Puzzle[]> {
    return this.db.query.puzzles.findMany({
      where: eq(puzzles.difficultyTier, tier),
      limit,
    });
  }
}
