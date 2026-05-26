import type { Puzzle, DifficultyTier } from "@/domain/puzzle";

export interface PuzzleRepository {
  insert(puzzles: Omit<Puzzle, "createdAt">[]): Promise<void>;
  findById(id: string): Promise<Puzzle | null>;
  findByDifficulty(tier: DifficultyTier, limit?: number): Promise<Puzzle[]>;
}
