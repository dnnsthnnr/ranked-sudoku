export type DifficultyTier = "easy" | "medium" | "hard" | "expert";

export interface Puzzle {
  id: string;
  grid: string;
  solution: string;
  difficultyTier: DifficultyTier;
  puzzleScore: number;
  createdAt: string;
}
